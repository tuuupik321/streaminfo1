import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Any, Optional
from urllib.parse import parse_qsl, quote_plus

import aiohttp
from aiogram import Bot, Dispatcher, F, types
from aiogram.exceptions import TelegramAPIError
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web
from pydantic import BaseModel, ValidationError
from sqlalchemy import BigInteger, Boolean, Column, DateTime, Integer, String, and_, desc, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ... (rest of the constants remain the same)
TOKEN = os.getenv("BOT_TOKEN")
APP_URL = os.getenv("APP_URL") or os.getenv("RENDER_EXTERNAL_URL")
SPACE_HOST = os.getenv("SPACE_HOST")
RAW_DB_URL = os.getenv("DATABASE_URL")
TWITCH_ID = os.getenv("TWITCH_CLIENT_ID")
TWITCH_SECRET = os.getenv("TWITCH_SECRET")
YT_KEY = os.getenv("YOUTUBE_API_KEY")
YT_HANDOFF_WEBHOOK_URL = os.getenv("YT_HANDOFF_WEBHOOK_URL")
DONATALERTS_ACCESS_TOKEN = os.getenv("DONATALERTS_ACCESS_TOKEN")
DONATALERTS_API_BASE = os.getenv("DONATALERTS_API_BASE", "https://www.donationalerts.com/api/v1")
# Force webhook mode on server
WEBHOOK_ENABLED = True
WEBHOOK_PATH = os.getenv("WEBHOOK_PATH", "/telegram/webhook")
REQUIRE_INIT_DATA = os.getenv("REQUIRE_INIT_DATA", "true").lower() in {"1", "true", "yes"}
LOCAL_DEV_MODE = os.getenv("LOCAL_DEV_MODE", "false").lower() in {"1", "true", "yes"}
SELF_PING_ENABLED = os.getenv("SELF_PING_ENABLED", "true").lower() in {"1", "true", "yes"} # Enabled by default now
SELF_PING_INTERVAL_SECONDS = int(os.getenv("SELF_PING_INTERVAL_SECONDS", "600"))
OWNER_TELEGRAM_ID = os.getenv("OWNER_TELEGRAM_ID", "6983727854")
OWNER_ADMIN_PASSWORD = os.getenv("OWNER_ADMIN_PASSWORD", "22922292")
ADMIN_TOKEN_TTL_SECONDS = int(os.getenv("ADMIN_TOKEN_TTL_SECONDS", "43200"))


if RAW_DB_URL:
    DB_URL = f"postgresql+asyncpg://{RAW_DB_URL.split('://', 1)[1]}"
else:
    DB_URL = None

Base = declarative_base()

# Pydantic Models for API validation
class SaveSettingsPayload(BaseModel):
    user_id: int
    twitch_name: Optional[str] = None
    yt_channel_id: Optional[str] = None

class User(Base):
    __tablename__ = "users"
    user_id = Column(BigInteger, primary_key=True)
    clicks = Column(Integer, default=0)
    twitch_name = Column(String, nullable=True)
    yt_channel_id = Column(String, nullable=True)

# ... (rest of the SQLAlchemy models and setup remain the same)
class StreamSession(Base):
    __tablename__ = "stream_sessions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    platform = Column(String, nullable=False, default="twitch")
    started_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime(timezone=True), nullable=True)
    peak_viewers = Column(Integer, nullable=False, default=0)

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)
    details = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class RateLimitEvent(Base):
    __tablename__ = "rate_limit_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    scope = Column(String, nullable=False, index=True)
    key = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class PartnerBannerMetric(Base):
    __tablename__ = "partner_banner_metrics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    metric = Column(String, nullable=False, unique=True, index=True)
    value = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

engine = create_async_engine(DB_URL, pool_pre_ping=True, pool_recycle=1800) if DB_URL else None
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession) if engine else None
logger = logging.getLogger("streamfly")
logging.basicConfig(level=logging.INFO)
bot = Bot(token=TOKEN) if TOKEN else None
dp = Dispatcher()
rate_limit_cache: dict[str, deque[float]] = defaultdict(deque)

# ... (rest of the utility functions remain the same)
def log_event(event: str, **fields: Any):
    payload = {"event": event, "ts": datetime.now(timezone.utc).isoformat(), **fields}
    logger.info(json.dumps(payload, ensure_ascii=False))

def get_public_app_url() -> str:
    if APP_URL: return APP_URL.rstrip("/")
    if SPACE_HOST: return f"https://{SPACE_HOST}".rstrip("/")
    return ""

# ... (security and other functions remain the same)
async def _require_verified_user(request: web.Request):
    init_data = request.query.get("init_data")
    log_event("auth_attempt", method=request.method, path=request.path, has_init_data=bool(init_data))
    
    if request.method in {"POST", "PUT", "PATCH"}:
        try:
            payload = await request.json()
            init_data = payload.get("init_data", init_data)
            request["_json"] = payload
            log_event("auth_attempt_body", has_init_data_in_body=bool(payload.get("init_data")))
        except Exception:
            pass

    if not REQUIRE_INIT_DATA:
        log_event("auth_skipped", reason="REQUIRE_INIT_DATA_is_false")
        return None

    verified = parse_and_verify_init_data(init_data)
    if not verified or not verified.get("user_id"):
        log_event("auth_failed", reason="invalid_init_data", init_data_preview=str(init_data)[:100])
        return web.json_response({"error": "invalid_init_data"}, status=401)

    log_event("auth_success", user_id=verified.get("user_id"))
    request["verified_user_id"] = str(verified["user_id"])
    return None


async def setup_database():
    if not engine:
        return
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def keep_database_warm():
    if not engine:
        return
    while True:
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception as error:
            log_event("db_keepalive_failed", error=str(error))
        await asyncio.sleep(240)

async def health_check(request: web.Request):
    return web.Response(text="I'm alive!", status=200)

async def save_settings(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error

    try:
        payload = SaveSettingsPayload.model_validate(await request.json())
    except ValidationError as e:
        return web.json_response({"error": "validation_error", "details": e.errors()}, status=400)

    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)

    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(payload.user_id):
        return web.json_response({"error": "user_mismatch"}, status=403)

    if not _allow_rate("save_settings", str(payload.user_id), limit=20, window_seconds=60):
        return web.json_response({"error": "rate_limited"}, status=429)

    twitch_name = payload.twitch_name
    yt_channel_id = payload.yt_channel_id

    if twitch_name:
        if not all([TWITCH_ID, TWITCH_SECRET]):
            return web.json_response({"error": "twitch_validation_not_configured"}, status=500)
        resolved_twitch = await resolve_twitch_login(twitch_name)
        if not resolved_twitch:
            return web.json_response({"error": "twitch_not_found"}, status=400)
        twitch_name = resolved_twitch

    if yt_channel_id:
        if not YT_KEY:
            return web.json_response({"error": "youtube_validation_not_configured"}, status=500)
        resolved_youtube = await resolve_youtube_channel_id(yt_channel_id)
        if not resolved_youtube:
            return web.json_response({"error": "youtube_not_found"}, status=400)
        yt_channel_id = resolved_youtube

    async with async_session() as session:
        user = await session.get(User, payload.user_id)
        if not user:
            user = User(user_id=payload.user_id)
            session.add(user)

        user.twitch_name = twitch_name
        user.yt_channel_id = yt_channel_id
        await session.commit()

    await write_audit_log(str(payload.user_id), "save_integrations", json.dumps({"twitch": twitch_name, "youtube": yt_channel_id}))

    return web.json_response(
        {
            "status": "ok",
            "twitch_name": twitch_name,
            "yt_channel_id": yt_channel_id,
        }
    )

# ... (rest of the API endpoints remain the same)

def build_app():
    app = web.Application()
    
    # Health check for cron-job
    app.router.add_get("/health", health_check)

    # API routes
    app.router.add_get("/api/stats", get_all_stats)
    app.router.add_get("/api/settings", get_settings)
    app.router.add_get("/api/analytics", get_analytics)
    # ... (add other api routes here)

    if bot and WEBHOOK_ENABLED:
        SimpleRequestHandler(dispatcher=dp, bot=bot).register(app, path=WEBHOOK_PATH)
        setup_application(app, dp, bot=bot)

    # Static files serving (must be last)
    dist_path = os.path.join(os.path.dirname(__file__), "dist")
    if os.path.exists(dist_path):
        app.router.add_static("/assets", os.path.join(dist_path, "assets"))
        # For any other route, serve index.html to support client-side routing
        async def serve_index(request):
            return web.FileResponse(os.path.join(dist_path, "index.html"))
        app.router.add_route("GET", "/{tail:.*}", serve_index)

    return app

async def run_polling():
    if not bot:
        raise RuntimeError("Bot initialization failed")
    try:
        await bot.delete_webhook(drop_pending_updates=True)
    except TelegramAPIError as error:
        log_event("telegram_delete_webhook_failed", error=str(error))
    log_event("bot_mode", mode="polling")
    await dp.start_polling(bot)

async def run_webhook():
    if not bot:
        raise RuntimeError("Bot initialization failed")
    app_url = get_public_app_url()
    if not app_url:
        raise RuntimeError("APP_URL or SPACE_HOST is required for webhook mode")
    webhook_url = f"{app_url.rstrip('/')}{WEBHOOK_PATH}"
    await bot.set_webhook(webhook_url, drop_pending_updates=True)
    log_event("bot_mode", mode="webhook", webhook_url=webhook_url)

async def keep_app_awake():
    app_url = get_public_app_url()
    if not app_url:
        log_event("self_ping_disabled", reason="APP_URL_not_set")
        return
        
    health_url = f"{app_url.rstrip('/')}/health"
    while True:
        await asyncio.sleep(max(60, SELF_PING_INTERVAL_SECONDS))
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(health_url) as response:
                    log_event("self_ping", status=response.status)
        except Exception as error:
            log_event("self_ping_failed", error=str(error))


async def main():
    if not TOKEN and not LOCAL_DEV_MODE: raise RuntimeError("BOT_TOKEN is not set")
    if not DB_URL and not LOCAL_DEV_MODE: raise RuntimeError("DATABASE_URL is not set")
    
    await setup_database()
    
    if engine:
        asyncio.create_task(keep_database_warm())
    if SELF_PING_ENABLED:
        asyncio.create_task(keep_app_awake())

    app = build_app()
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.getenv("PORT", "8000"))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    
    log_event("http_started", port=port)

    if not bot:
        await asyncio.Event().wait()
    elif WEBHOOK_ENABLED:
        try:
            await run_webhook()
        except Exception as error:
            log_event("webhook_start_failed", error=str(error))
        await asyncio.Event().wait()
    else:
        try:
            await run_polling()
        except Exception as error:
            log_event("polling_start_failed", error=str(error))
            await asyncio.Event().wait()

# ... (rest of the file remains the same)
async def get_all_stats(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error: return auth_error
    uid = request.query.get("user_id")
    if not uid: return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid): return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session: return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        user = await session.get(User, int(uid))
        if not user: return web.json_response({"is_linked": False, "clicks": 0, "twitch": {"online": False, "viewers": 0}, "youtube": {"subscribers": 0}})
        twitch_data = await fetch_twitch(user.twitch_name)
        youtube_data = await fetch_youtube(user.yt_channel_id)
        await update_stream_history(session, int(uid), bool(twitch_data.get("online")), int(twitch_data.get("viewers", 0)))
        await session.commit()
        return web.json_response({"is_linked": True, "clicks": user.clicks, "twitch": twitch_data, "youtube": youtube_data})

async def get_settings(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error: return auth_error
    uid = request.query.get("user_id")
    if not uid: return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid): return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session: return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        user = await session.get(User, int(uid))
        if not user: return web.json_response({"is_linked": False, "twitch_name": None, "yt_channel_id": None})
        return web.json_response({"is_linked": bool(user.twitch_name or user.yt_channel_id), "twitch_name": user.twitch_name, "yt_channel_id": user.yt_channel_id})

async def get_analytics(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error: return auth_error
    uid = request.query.get("user_id")
    if not uid: return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid): return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session: return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        sessions_query = select(StreamSession).where(StreamSession.user_id == int(uid)).order_by(desc(StreamSession.started_at)).limit(50)
        sessions = (await session.execute(sessions_query)).scalars().all()
        user = await session.get(User, int(uid))
        clicks = user.clicks if user else 0
        streams_count = len(sessions)
        max_peak = max((s.peak_viewers for s in sessions), default=0)
        avg_peak = int(sum((s.peak_viewers for s in sessions), 0) / streams_count) if streams_count else 0
        total_hours = sum((s.ended_at - s.started_at).total_seconds() / 3600.0 for s in sessions if s.started_at and s.ended_at)
        timeline = [{"time": s.started_at.isoformat(), "viewers": s.peak_viewers, "event": "start"} for s in sessions[:24] if s.started_at]
        return web.json_response({"streams_count": streams_count, "max_peak": max_peak, "avg_peak": avg_peak, "hours_streamed": round(total_hours, 1), "clicks": clicks, "timeline": list(reversed(timeline))})

if __name__ == "__main__":
    try:
        print("--- Bot startup ---")
        asyncio.run(main())
    except Exception as error:
        print(f"!!! Startup error: {error}")

# Force update
