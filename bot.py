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

def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int, *, min_value: Optional[int] = None, max_value: Optional[int] = None) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        return default
    if min_value is not None and value < min_value:
        return min_value
    if max_value is not None and value > max_value:
        return max_value
    return value


def _normalize_webhook_path(path: Optional[str]) -> str:
    result = (path or "/telegram/webhook").strip()
    if not result.startswith("/"):
        result = f"/{result}"
    return result.rstrip("/") or "/telegram/webhook"


def _normalize_db_url(raw_url: Optional[str]) -> Optional[str]:
    if not raw_url:
        return None
    raw_url = raw_url.strip()
    if raw_url.startswith("postgresql+asyncpg://"):
        return raw_url
    if raw_url.startswith("postgresql://"):
        return raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    return f"postgresql+asyncpg://{raw_url}"


TOKEN = os.getenv("BOT_TOKEN")
APP_URL = os.getenv("APP_URL") or os.getenv("RENDER_EXTERNAL_URL")
SPACE_HOST = os.getenv("SPACE_HOST")
RAW_DB_URL = os.getenv("DATABASE_URL")
TWITCH_ID = os.getenv("TWITCH_CLIENT_ID")
TWITCH_SECRET = os.getenv("TWITCH_SECRET")
YT_KEY = os.getenv("YOUTUBE_API_KEY")
YT_HANDOFF_WEBHOOK_URL = os.getenv("YT_HANDOFF_WEBHOOK_URL")
DONATALERTS_ACCESS_TOKEN = os.getenv("DONATALERTS_ACCESS_TOKEN")
DONATALERTS_API_BASE = os.getenv("DONATALERTS_API_BASE", "https://www.donationalerts.com/api/v1").rstrip("/")
DONATIONS_WEBHOOK_SECRET = os.getenv("DONATIONS_WEBHOOK_SECRET")
LOCAL_DEV_MODE = _env_bool("LOCAL_DEV_MODE", False)
WEBHOOK_ENABLED = _env_bool("WEBHOOK_ENABLED", not LOCAL_DEV_MODE)
WEBHOOK_PATH = _normalize_webhook_path(os.getenv("WEBHOOK_PATH"))
REQUIRE_INIT_DATA = _env_bool("REQUIRE_INIT_DATA", True)
SELF_PING_ENABLED = _env_bool("SELF_PING_ENABLED", True)
SELF_PING_INTERVAL_SECONDS = _env_int("SELF_PING_INTERVAL_SECONDS", 600, min_value=60, max_value=86_400)
OWNER_TELEGRAM_ID = os.getenv("OWNER_TELEGRAM_ID")
OWNER_ADMIN_PASSWORD = os.getenv("OWNER_ADMIN_PASSWORD")
ADMIN_TOKEN_TTL_SECONDS = _env_int("ADMIN_TOKEN_TTL_SECONDS", 43_200, min_value=300, max_value=604_800)


DB_URL = _normalize_db_url(RAW_DB_URL)

Base = declarative_base()

# Pydantic Models for API validation
class SaveSettingsPayload(BaseModel):
    user_id: int
    twitch_name: Optional[str] = None
    yt_channel_id: Optional[str] = None
    donationalerts_name: Optional[str] = None

class VerifyChannelPayload(BaseModel):
    user_id: int
    platform: str
    channel: str

class User(Base):
    __tablename__ = "users"
    user_id = Column(BigInteger, primary_key=True)
    clicks = Column(Integer, default=0)
    twitch_name = Column(String, nullable=True)
    yt_channel_id = Column(String, nullable=True)
    donationalerts_name = Column(String, nullable=True)

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    chat_id = Column(BigInteger, nullable=False, index=True)
    message_id = Column(BigInteger, nullable=False, unique=True)
    text = Column(String, nullable=False)
    author = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    answered = Column(Boolean, default=False)

class LiveBanner(Base):
    __tablename__ = "live_banner"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    image_url = Column(String, nullable=False)
    link_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

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

class DonationEvent(Base):
    __tablename__ = "donation_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    donor = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String, nullable=False, default="USD")
    message = Column(String, nullable=True)
    source = Column(String, nullable=False, default="donation")
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
donation_events: deque[dict[str, Any]] = deque(maxlen=100)

# ... (rest of the utility functions remain the same)
def log_event(event: str, **fields: Any):
    payload = {"event": event, "ts": datetime.now(timezone.utc).isoformat(), **fields}
    logger.info(json.dumps(payload, ensure_ascii=False))


def validate_runtime_config() -> None:
    if OWNER_TELEGRAM_ID:
        try:
            int(OWNER_TELEGRAM_ID)
        except ValueError:
            log_event("config_warning", key="OWNER_TELEGRAM_ID", reason="must_be_integer")

    if TWITCH_ID and not TWITCH_SECRET:
        log_event("config_warning", key="TWITCH_SECRET", reason="missing_while_twitch_id_is_set")
    if TWITCH_SECRET and not TWITCH_ID:
        log_event("config_warning", key="TWITCH_CLIENT_ID", reason="missing_while_twitch_secret_is_set")
    if YT_HANDOFF_WEBHOOK_URL and not YT_HANDOFF_WEBHOOK_URL.startswith(("http://", "https://")):
        log_event("config_warning", key="YT_HANDOFF_WEBHOOK_URL", reason="must_be_http_url")
    if DONATALERTS_ACCESS_TOKEN and not DONATALERTS_API_BASE.startswith(("http://", "https-:-//")):
        log_event("config_warning", key="DONATALERTS_API_BASE", reason="must_be_http_url")

    log_event(
        "runtime_config",
        webhook_enabled=WEBHOOK_ENABLED,
        webhook_path=WEBHOOK_PATH,
        require_init_data=REQUIRE_INIT_DATA,
        local_dev_mode=LOCAL_DEV_MODE,
        self_ping_enabled=SELF_PING_ENABLED,
        self_ping_interval_seconds=SELF_PING_INTERVAL_SECONDS,
        admin_token_ttl_seconds=ADMIN_TOKEN_TTL_SECONDS,
        app_url_set=bool(APP_URL or SPACE_HOST),
        db_configured=bool(DB_URL),
        twitch_configured=bool(TWITCH_ID and TWITCH_SECRET),
        youtube_configured=bool(YT_KEY),
        yt_handoff_configured=bool(YT_HANDOFF_WEBHOOK_URL),
        donationalerts_configured=bool(DONATALERTS_ACCESS_TOKEN),
        owner_id_set=bool(OWNER_TELEGRAM_ID),
        owner_password_set=bool(OWNER_ADMIN_PASSWORD),
    )


def get_public_app_url() -> str:
    if APP_URL: return APP_URL.rstrip("/")
    if SPACE_HOST: return f"https://{SPACE_HOST}".rstrip("/")
    return ""

def parse_and_verify_init_data(init_data: Optional[str]) -> Optional[dict[str, Any]]:
    if not init_data or not TOKEN:
        return None
    try:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        received_hash = pairs.pop("hash", None)
        if not received_hash:
            return None

        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
        secret_key = hmac.new(b"WebAppData", TOKEN.encode("utf-8"), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(calculated_hash, received_hash):
            return None

        auth_date_raw = pairs.get("auth_date")
        if auth_date_raw:
            auth_date = int(auth_date_raw)
            if int(time.time()) - auth_date > 86400:
                return None

        user_raw = pairs.get("user")
        if not user_raw:
            return None
        user = json.loads(user_raw)
        user_id = user.get("id")
        if not user_id:
            return None
        return {"user_id": int(user_id), "user": user}
    except Exception as error:
        log_event("init_data_parse_failed", error=str(error))
        return None

_twitch_token: Optional[str] = None
_twitch_token_expiry: float = 0.0
_twitch_stats_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_youtube_stats_cache: dict[str, tuple[float, dict[str, Any]]] = {}
STATS_CACHE_TTL_SECONDS = _env_int("STATS_CACHE_TTL_SECONDS", 30, min_value=5, max_value=600)

async def _get_twitch_app_token() -> Optional[str]:
    global _twitch_token, _twitch_token_expiry
    if _twitch_token and time.time() < _twitch_token_expiry - 30:
        return _twitch_token
    if not TWITCH_ID or not TWITCH_SECRET:
        return None
    try:
        token_url = (
            "https://id.twitch.tv/oauth2/token"
            f"?client_id={quote_plus(TWITCH_ID)}"
            f"&client_secret={quote_plus(TWITCH_SECRET)}"
            "&grant_type=client_credentials"
        )
        async with aiohttp.ClientSession() as session:
            async with session.post(token_url, timeout=12) as resp:
                data = await resp.json()
                if resp.status != 200:
                    log_event("twitch_token_failed", status=resp.status, body=str(data)[:200])
                    return None
                _twitch_token = data.get("access_token")
                expires_in = int(data.get("expires_in", 0))
                _twitch_token_expiry = time.time() + max(expires_in, 0)
                return _twitch_token
    except Exception as error:
        log_event("twitch_token_error", error=str(error))
        return None

async def resolve_twitch_login(username: str) -> Optional[str]:
    login = (username or "").strip().lower()
    if not login:
        return None
    token = await _get_twitch_app_token()
    if not token:
        return None
    try:
        url = f"https://api.twitch.tv/helix/users?login={quote_plus(login)}"
        headers = {"Client-ID": TWITCH_ID, "Authorization": f"Bearer {token}"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=12) as resp:
                data = await resp.json()
                if resp.status != 200:
                    log_event("twitch_lookup_failed", status=resp.status, body=str(data)[:200])
                    return None
                users = data.get("data") or []
                if not users:
                    return None
                return users[0].get("login")
    except Exception as error:
        log_event("twitch_lookup_error", error=str(error))
        return None

async def resolve_youtube_channel_id(value: str) -> Optional[str]:
    if not value or not YT_KEY:
        return None
    raw = value.strip()
    if raw.startswith("UC") and len(raw) > 10:
        return raw
    handle = raw.lstrip("@")
    try:
        async with aiohttp.ClientSession() as session:
            # Try handle lookup
            url = (
                "https://www.googleapis.com/youtube/v3/channels"
                f"?part=id&forHandle={quote_plus(handle)}&key={quote_plus(YT_KEY)}"
            )
            async with session.get(url, timeout=12) as resp:
                data = await resp.json()
                items = data.get("items") or []
                if items:
                    return items[0].get("id")

            # Try legacy username
            url = (
                "https://www.googleapis.com/youtube/v3/channels"
                f"?part=id&forUsername={quote_plus(handle)}&key={quote_plus(YT_KEY)}"
            )
            async with session.get(url, timeout=12) as resp:
                data = await resp.json()
                items = data.get("items") or []
                if items:
                    return items[0].get("id")

            # Fallback search
            url = (
                "https://www.googleapis.com/youtube/v3/search"
                f"?part=snippet&type=channel&maxResults=1&q={quote_plus(handle)}&key={quote_plus(YT_KEY)}"
            )
            async with session.get(url, timeout=12) as resp:
                data = await resp.json()
                items = data.get("items") or []
                if not items:
                    return None
                channel_id = (items[0].get("id") or {}).get("channelId")
                return channel_id
    except Exception as error:
        log_event("youtube_lookup_error", error=str(error))
        return None

async def fetch_twitch_channel_details(login: str) -> Optional[dict[str, Any]]:
    token = await _get_twitch_app_token()
    if not token or not TWITCH_ID:
        return None
    try:
        url = f"https://api.twitch.tv/helix/users?login={quote_plus(login)}"
        headers = {"Client-ID": TWITCH_ID, "Authorization": f"Bearer {token}"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=12) as resp:
                data = await resp.json()
                if resp.status != 200:
                    log_event("twitch_user_failed", status=resp.status, body=str(data)[:200])
                    return None
                users = data.get("data") or []
                if not users:
                    return None
                user = users[0]
        followers = None
        try:
            url = f"https://api.twitch.tv/helix/channels/followers?broadcaster_id={quote_plus(user.get('id', ''))}"
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=12) as resp:
                    data = await resp.json()
                    if resp.status == 200:
                        followers = data.get("total")
        except Exception as error:
            log_event("twitch_followers_error", error=str(error))
        return {
            "id": user.get("id"),
            "login": user.get("login"),
            "name": user.get("display_name") or user.get("login"),
            "avatar": user.get("profile_image_url"),
            "followers": followers,
            "views": user.get("view_count"),
        }
    except Exception as error:
        log_event("twitch_user_error", error=str(error))
        return None

async def fetch_youtube_channel_details(channel_id: str) -> Optional[dict[str, Any]]:
    if not YT_KEY:
        return None
    try:
        url = (
            "https://www.googleapis.com/youtube/v3/channels"
            f"?part=snippet,statistics&id={quote_plus(channel_id)}&key={quote_plus(YT_KEY)}"
        )
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=12) as resp:
                data = await resp.json()
                if resp.status != 200:
                    log_event("youtube_channel_failed", status=resp.status, body=str(data)[:200])
                    return None
                items = data.get("items") or []
                if not items:
                    return None
                item = items[0]
                snippet = item.get("snippet") or {}
                stats = item.get("statistics") or {}
                return {
                    "id": item.get("id"),
                    "name": snippet.get("title"),
                    "avatar": ((snippet.get("thumbnails") or {}).get("medium") or {}).get("url"),
                    "subscribers": int(stats.get("subscriberCount", 0)) if stats.get("subscriberCount") else None,
                    "videos": int(stats.get("videoCount", 0)) if stats.get("videoCount") else None,
                    "views": int(stats.get("viewCount", 0)) if stats.get("viewCount") else None,
                }
    except Exception as error:
        log_event("youtube_channel_error", error=str(error))
        return None

async def fetch_twitch(login: Optional[str]) -> dict[str, Any]:
    if not login:
        return {"online": False, "viewers": 0}
    cached = _twitch_stats_cache.get(login)
    if cached and time.time() - cached[0] < STATS_CACHE_TTL_SECONDS:
        return cached[1]
    token = await _get_twitch_app_token()
    if not token or not TWITCH_ID:
        return {"online": False, "viewers": 0}
    online = False
    viewers = 0
    try:
        headers = {"Client-ID": TWITCH_ID, "Authorization": f"Bearer {token}"}
        url = f"https://api.twitch.tv/helix/streams?user_login={quote_plus(login)}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=12) as resp:
                data = await resp.json()
                if resp.status == 200:
                    streams = data.get("data") or []
                    if streams:
                        online = True
                        viewers = int(streams[0].get("viewer_count", 0))
    except Exception as error:
        log_event("twitch_stream_error", error=str(error))
    payload = {"online": online, "viewers": viewers}
    _twitch_stats_cache[login] = (time.time(), payload)
    return payload

async def fetch_youtube(channel_id: Optional[str]) -> dict[str, Any]:
    if not channel_id:
        return {"subscribers": 0}
    cached = _youtube_stats_cache.get(channel_id)
    if cached and time.time() - cached[0] < STATS_CACHE_TTL_SECONDS:
        return cached[1]
    details = await fetch_youtube_channel_details(channel_id)
    payload = {"subscribers": int(details.get("subscribers", 0)) if details else 0}
    _youtube_stats_cache[channel_id] = (time.time(), payload)
    return payload

async def update_stream_history(session: AsyncSession, user_id: int, is_live: bool, viewers: int) -> None:
    query = select(StreamSession).where(
        StreamSession.user_id == user_id,
        StreamSession.ended_at == None,  # noqa: E711
    ).order_by(desc(StreamSession.started_at))
    open_session = (await session.execute(query)).scalars().first()
    now = datetime.now(timezone.utc)

    if is_live:
        if open_session is None:
            session.add(StreamSession(user_id=user_id, started_at=now, peak_viewers=max(viewers, 0)))
        else:
            if viewers > open_session.peak_viewers:
                open_session.peak_viewers = viewers
    else:
        if open_session is not None:
            open_session.ended_at = now

async def api_ping(request: web.Request):
    return web.json_response({"ok": True})

async def get_bot_info(request: web.Request):
    if not bot:
        return web.json_response({"error": "telegram_bot_not_configured"}, status=500)
    try:
        me = await bot.get_me()
        return web.json_response({"username": me.username, "id": me.id})
    except Exception as error:
        log_event("bot_info_failed", error=str(error))
        return web.json_response({"error": "bot_info_failed"}, status=500)

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
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN donationalerts_name VARCHAR"))
        except Exception:
            pass

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

@dp.message(F.text.contains("?"))
async def handle_questions(message: types.Message):
    if not async_session:
        return

    async with async_session() as session:
        question = Question(
            user_id=message.from_user.id,
            chat_id=message.chat.id,
            message_id=message.message_id,
            text=message.text,
            author=message.from_user.full_name,
        )
        session.add(question)
        await session.commit()

async def get_questions(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error

    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)

    async with async_session() as session:
        query = select(Question).where(Question.answered == False).order_by(desc(Question.created_at))
        result = await session.execute(query)
        questions = result.scalars().all()
        return web.json_response([
            {
                "id": q.id,
                "text": q.text,
                "author": q.author,
                "created_at": q.created_at.isoformat(),
            }
            for q in questions
        ])

async def answer_question(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error

    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)

    try:
        payload = await request.json()
        question_id = payload["question_id"]
    except (KeyError, json.JSONDecodeError):
        return web.json_response({"error": "bad_request"}, status=400)

    async with async_session() as session:
        question = await session.get(Question, question_id)
        if not question:
            return web.json_response({"error": "not_found"}, status=404)
        
        question.answered = True
        await session.commit()

        # Notify the admin panel that the question is answered
        # This can be done via websockets or long polling in a real application
        # For now, we just confirm the action
        return web.json_response({"status": "ok"})

async def set_live_banner(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error

    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)

    try:
        payload = await request.json()
        user_id = int(request["verified_user_id"])
        image_url = payload["image_url"]
        link_url = payload.get("link_url")
    except (KeyError, json.JSONDecodeError, ValueError):
        return web.json_response({"error": "bad_request"}, status=400)

    async with async_session() as session:
        # Remove previous banner for the user
        await session.execute(LiveBanner.__table__.delete().where(LiveBanner.user_id == user_id))
        
        banner = LiveBanner(
            user_id=user_id,
            image_url=image_url,
            link_url=link_url,
        )
        session.add(banner)
        await session.commit()
        return web.json_response({"status": "ok"})

async def get_live_banner(request: web.Request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "no_uid"}, status=400)

    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)

    async with async_session() as session:
        query = select(LiveBanner).where(LiveBanner.user_id == int(user_id)).order_by(desc(LiveBanner.created_at))
        result = await session.execute(query)
        banner = result.scalar_one_or_none()
        if not banner:
            return web.json_response({}, status=404)
        return web.json_response({
            "image_url": banner.image_url,
            "link_url": banner.link_url,
        })

def _extract_username(value: str) -> str:
    raw = (value or "").strip()
    if raw.startswith("http://") or raw.startswith("https://"):
        raw = raw.split("://", 1)[-1]
    raw = raw.replace("www.", "")
    raw = raw.strip("/")
    if "/" in raw:
        parts = raw.split("/")
        raw = parts[-1] or parts[-2]
    if raw.startswith("@"):
        raw = raw[1:]
    return raw.strip()

async def verify_channel(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error

    try:
        payload = VerifyChannelPayload.model_validate(await request.json())
    except ValidationError as e:
        return web.json_response({"error": "validation_error", "details": e.errors()}, status=400)

    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(payload.user_id):
        return web.json_response({"error": "user_mismatch"}, status=403)

    platform = payload.platform.lower().strip()
    channel_raw = payload.channel.strip()
    if not platform or not channel_raw:
        return web.json_response({"error": "bad_request"}, status=400)

    if platform == "twitch":
        if not all([TWITCH_ID, TWITCH_SECRET]):
            return web.json_response({"error": "twitch_validation_not_configured"}, status=500)
        username = _extract_username(channel_raw)
        resolved_twitch = await resolve_twitch_login(username)
        if not resolved_twitch:
            return web.json_response({"error": "twitch_not_found"}, status=404)
        details = await fetch_twitch_channel_details(resolved_twitch)
        return web.json_response({
            "status": "ok",
            "platform": "twitch",
            "name": (details or {}).get("name") or resolved_twitch,
            "url": f"https://twitch.tv/{resolved_twitch}",
            "avatar": (details or {}).get("avatar"),
            "followers": (details or {}).get("followers"),
            "views": (details or {}).get("views"),
        })

    if platform == "youtube":
        if not YT_KEY:
            return web.json_response({"error": "youtube_validation_not_configured"}, status=500)
        channel_id = _extract_username(channel_raw)
        resolved_youtube = await resolve_youtube_channel_id(channel_id)
        if not resolved_youtube:
            return web.json_response({"error": "youtube_not_found"}, status=404)
        details = await fetch_youtube_channel_details(resolved_youtube)
        return web.json_response({
            "status": "ok",
            "platform": "youtube",
            "name": (details or {}).get("name") or resolved_youtube,
            "url": f"https://youtube.com/channel/{resolved_youtube}",
            "avatar": (details or {}).get("avatar"),
            "subscribers": (details or {}).get("subscribers"),
            "videos": (details or {}).get("videos"),
            "views": (details or {}).get("views"),
        })

    if platform == "telegram":
        username = _extract_username(channel_raw)
        if not username:
            return web.json_response({"error": "telegram_not_found"}, status=404)
        if not bot:
            return web.json_response({"error": "telegram_bot_not_configured"}, status=500)
        try:
            chat = await bot.get_chat(f"@{username}")
            display = chat.title or f"@{username}"
            subscribers = None
            try:
                subscribers = await bot.get_chat_member_count(f"@{username}")
            except TelegramAPIError:
                subscribers = None
            return web.json_response({
                "status": "ok",
                "platform": "telegram",
                "name": display,
                "url": f"https://t.me/{username}",
                "channel": f"@{username}",
                "subscribers": subscribers,
            })
        except TelegramAPIError:
            return web.json_response({"error": "telegram_not_found"}, status=404)

    if platform == "donatealerts":
        username = _extract_username(channel_raw)
        if not username:
            return web.json_response({"error": "donatealerts_not_found"}, status=404)
        if not DONATALERTS_ACCESS_TOKEN:
            return web.json_response({"error": "donatealerts_not_configured"}, status=500)
        return web.json_response({
            "status": "ok",
            "platform": "donatealerts",
            "name": username,
            "url": f"https://www.donationalerts.com/r/{username}",
        })

    return web.json_response({"error": "unsupported_platform"}, status=400)

def _normalize_donation_payload(payload: dict[str, Any]) -> Optional[dict[str, Any]]:
    donor = payload.get("donor") or payload.get("username") or payload.get("name")
    amount = payload.get("amount") or payload.get("sum") or payload.get("value")
    currency = payload.get("currency") or payload.get("curr") or "USD"
    message = payload.get("message") or payload.get("comment") or ""
    event_type = payload.get("type") or payload.get("event") or "donation"
    if donor is None or amount is None:
        return None
    try:
        amount_value = float(amount)
    except Exception:
        return None
    return {
        "id": f"{int(time.time() * 1000)}",
        "donor": str(donor),
        "amount": amount_value,
        "currency": str(currency),
        "message": str(message),
        "source": str(event_type),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

async def donations_webhook(request: web.Request):
    if DONATIONS_WEBHOOK_SECRET:
        provided = request.headers.get("X-Webhook-Token") or request.query.get("token")
        if not provided or provided != DONATIONS_WEBHOOK_SECRET:
            return web.json_response({"error": "unauthorized"}, status=401)
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "bad_request"}, status=400)
    event = _normalize_donation_payload(payload if isinstance(payload, dict) else {})
    if not event:
        return web.json_response({"error": "invalid_payload"}, status=400)
    donation_events.appendleft(event)
    if async_session:
        try:
            async with async_session() as session:
                session.add(
                    DonationEvent(
                        donor=event["donor"],
                        amount=int(event["amount"]),
                        currency=event["currency"],
                        message=event["message"] or None,
                        source=event["source"],
                    )
                )
                await session.commit()
        except Exception as error:
            log_event("donation_event_persist_failed", error=str(error))
    return web.json_response({"status": "ok"})

async def get_donations_live(request: web.Request):
    configured = bool(DONATALERTS_ACCESS_TOKEN)
    items: list[dict[str, Any]] = []
    if async_session:
        try:
            async with async_session() as session:
                query = select(DonationEvent).order_by(desc(DonationEvent.created_at)).limit(20)
                rows = (await session.execute(query)).scalars().all()
                items = [
                    {
                        "id": str(row.id),
                        "donor": row.donor,
                        "amount": row.amount,
                        "currency": row.currency,
                        "message": row.message or "",
                        "source": row.source,
                        "createdAt": row.created_at.isoformat(),
                    }
                    for row in rows
                ]
        except Exception as error:
            log_event("donation_event_fetch_failed", error=str(error))
    if not items:
        items = list(donation_events)[:20]
    return web.json_response({"items": items, "configured": configured})


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
    donationalerts_name = payload.donationalerts_name

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

    if donationalerts_name:
        if not DONATALERTS_ACCESS_TOKEN:
            return web.json_response({"error": "donatealerts_not_configured"}, status=500)
        donationalerts_name = _extract_username(donationalerts_name)

    async with async_session() as session:
        user = await session.get(User, payload.user_id)
        if not user:
            user = User(user_id=payload.user_id)
            session.add(user)

        user.twitch_name = twitch_name
        user.yt_channel_id = yt_channel_id
        user.donationalerts_name = donationalerts_name
        await session.commit()

    await write_audit_log(
        str(payload.user_id),
        "save_integrations",
        json.dumps({"twitch": twitch_name, "youtube": yt_channel_id, "donationalerts": donationalerts_name}),
    )

    return web.json_response(
        {
            "status": "ok",
            "twitch_name": twitch_name,
            "yt_channel_id": yt_channel_id,
            "donationalerts_name": donationalerts_name,
        }
    )

# ... (rest of the API endpoints remain the same)

def build_app():
    app = web.Application()
    
    # Health check for cron-job
    app.router.add_get("/health", health_check)

    # API routes
    app.router.add_post("/api/ping", api_ping)
    app.router.add_get("/api/bot_info", get_bot_info)
    app.router.add_get("/api/stats", get_all_stats)
    app.router.add_get("/api/settings", get_settings)
    app.router.add_get("/api/analytics", get_analytics)
    app.router.add_get("/api/questions", get_questions)
    app.router.add_post("/api/questions/answer", answer_question)
    app.router.add_post("/api/live_banner", set_live_banner)
    app.router.add_get("/api/live_banner", get_live_banner)
    app.router.add_post("/api/verify_channel", verify_channel)
    app.router.add_post("/api/save_settings", save_settings)
    app.router.add_post("/api/donations/webhook", donations_webhook)
    app.router.add_get("/api/donations/live", get_donations_live)
    # ... (add other api routes here)

    if bot and WEBHOOK_ENABLED:
        SimpleRequestHandler(dispatcher=dp, bot=bot).register(app, path=WEBHOOK_PATH)
        setup_application(app, dp, bot=bot)

    # Static files serving (must be last)
    base_dir = os.path.dirname(__file__)
    dist_path = os.path.join(base_dir, "dist")
    public_path = os.path.join(base_dir, "public")
    static_root = dist_path if os.path.exists(dist_path) else public_path
    assets_path = os.path.join(static_root, "assets")
    if os.path.exists(assets_path):
        app.router.add_static("/assets", assets_path)
    index_path = os.path.join(static_root, "index.html")
    if os.path.exists(index_path):
        async def serve_index(request):
            return web.FileResponse(index_path)
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
    validate_runtime_config()
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
        if not user: return web.json_response({"is_linked": False, "twitch_name": None, "yt_channel_id": None, "donationalerts_name": None})
        return web.json_response({
            "is_linked": bool(user.twitch_name or user.yt_channel_id),
            "twitch_name": user.twitch_name,
            "yt_channel_id": user.yt_channel_id,
            "donationalerts_name": user.donationalerts_name,
        })

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
