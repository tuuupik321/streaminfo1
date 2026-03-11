import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
import mimetypes
from collections import defaultdict, deque
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from urllib.parse import parse_qsl, quote_plus, urlencode, urlparse, urlunparse

import aiohttp
from aiogram import Bot, Dispatcher, F, types
from aiogram.exceptions import TelegramAPIError
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web
from pydantic import BaseModel, ValidationError
from sqlalchemy import BigInteger, Boolean, Column, DateTime, Integer, MetaData, String, and_, desc, func, select, text
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


def _normalize_db_url(raw_url: Optional[str]) -> tuple[Optional[str], dict[str, Any]]:
    connect_args: dict[str, Any] = {}
    if not raw_url:
        return None, connect_args
    raw_url = raw_url.strip()
    if raw_url.startswith("postgresql+asyncpg://"):
        normalized = raw_url
    elif raw_url.startswith("postgresql://"):
        normalized = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif raw_url.startswith("postgres://"):
        normalized = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    else:
        normalized = f"postgresql+asyncpg://{raw_url}"

    parsed = urlparse(normalized)
    query_params = dict(parse_qsl(parsed.query, keep_blank_values=True))
    sslmode = query_params.pop("sslmode", None)
    if sslmode and sslmode.lower() not in {"disable", "allow", "prefer"}:
        # asyncpg expects "ssl" connect arg, not "sslmode"
        connect_args["ssl"] = True
    query_params.pop("channel_binding", None)
    cleaned = parsed._replace(query=urlencode(query_params))
    return urlunparse(cleaned), connect_args


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


DB_URL, DB_CONNECT_ARGS = _normalize_db_url(RAW_DB_URL)

Base = declarative_base(metadata=MetaData(schema="public"))

# Pydantic Models for API validation
class SaveSettingsPayload(BaseModel):
    user_id: int
    twitch_name: Optional[str] = None
    yt_channel_id: Optional[str] = None
    donationalerts_name: Optional[str] = None
    kick_name: Optional[str] = None
    telegram_channel: Optional[str] = None

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

class Streamer(Base):
    __tablename__ = "streamers"
    id = Column(BigInteger, primary_key=True)
    username = Column(String(50), nullable=True)
    twitch_connected = Column(Boolean, default=False)
    youtube_connected = Column(Boolean, default=False)
    telegram_channel = Column(String(100), nullable=True)
    telegram_connected = Column(Boolean, default=False)
    kick_connected = Column(Boolean, default=False)
    kick_name = Column(String(50), nullable=True)
    language = Column(String(5), default="ru")

class ChannelConnection(Base):
    __tablename__ = "channel_connections"
    user_id = Column(BigInteger, primary_key=True)
    platform = Column(String(20), nullable=False)
    channel_url = Column(String(255), nullable=False)
    channel_name = Column(String(100), nullable=False)
    connected = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class StreamGoal(Base):
    __tablename__ = "stream_goals"
    id = Column(Integer, primary_key=True, autoincrement=True)
    streamer_id = Column(BigInteger, index=True, nullable=False)
    goal_type = Column(String, nullable=False)
    current_value = Column(Integer, default=0)
    target_value = Column(Integer, nullable=False)

class Donation(Base):
    __tablename__ = "donations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    streamer_id = Column(BigInteger, index=True, nullable=False)
    donor_name = Column(String(50), nullable=False)
    amount = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class VisualSetting(Base):
    __tablename__ = "visual_settings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    streamer_id = Column(BigInteger, index=True, nullable=False)
    liquid_glow = Column(Integer, default=50)

class PlatformStat(Base):
    __tablename__ = "platform_stats"
    id = Column(Integer, primary_key=True, autoincrement=True)
    streamer_id = Column(BigInteger, index=True, nullable=False)
    platform = Column(String(20), nullable=False)
    followers = Column(Integer, default=0)
    views = Column(Integer, default=0)
    streams = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

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

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False, index=True)
    title = Column(String(120), nullable=False)
    body = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

engine = create_async_engine(
    DB_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args=DB_CONNECT_ARGS,
) if DB_URL else None
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


def _allow_rate(scope: str, key: str, *, limit: int, window_seconds: int) -> bool:
    if limit <= 0 or window_seconds <= 0:
        return True
    now = time.time()
    bucket_key = f"{scope}:{key}"
    bucket = rate_limit_cache[bucket_key]
    cutoff = now - window_seconds
    while bucket and bucket[0] <= cutoff:
        bucket.popleft()
    if len(bucket) >= limit:
        return False
    bucket.append(now)
    return True


async def write_audit_log(telegram_id: str, action: str, details: Optional[str] = None) -> None:
    if not async_session:
        log_event("audit_log_skipped", reason="db_not_configured", action=action, telegram_id=telegram_id)
        return
    try:
        async with async_session() as session:
            session.add(
                AdminAuditLog(
                    telegram_id=str(telegram_id),
                    action=str(action),
                    details=details,
                )
            )
            await session.commit()
    except Exception as error:
        log_event("audit_log_failed", error=str(error), action=action, telegram_id=telegram_id)


async def ensure_streamer(session: AsyncSession, user_id: int, username: Optional[str]) -> Streamer:
    streamer = await session.get(Streamer, user_id)
    if streamer:
        if username and streamer.username != username:
            streamer.username = username
        return streamer
    streamer = Streamer(id=user_id, username=username or None)
    session.add(streamer)
    await session.commit()
    return streamer


async def upsert_platform_stat(session: AsyncSession, streamer_id: int, platform: str, followers: int = 0, views: int = 0, streams: int = 0) -> None:
    query = select(PlatformStat).where(PlatformStat.streamer_id == streamer_id, PlatformStat.platform == platform)
    row = (await session.execute(query)).scalars().first()
    if not row:
        row = PlatformStat(streamer_id=streamer_id, platform=platform, followers=followers, views=views, streams=streams)
        session.add(row)
    else:
        row.followers = followers
        row.views = views
        row.streams = streams
        row.updated_at = datetime.now(timezone.utc)
    await session.commit()


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
_twitch_profile_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_youtube_stats_cache: dict[str, tuple[float, dict[str, Any]]] = {}
STATS_CACHE_TTL_SECONDS = _env_int("STATS_CACHE_TTL_SECONDS", 30, min_value=5, max_value=600)
PROFILE_CACHE_TTL_SECONDS = _env_int("PROFILE_CACHE_TTL_SECONDS", 180, min_value=30, max_value=1800)

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

async def fetch_twitch_profile(login: Optional[str]) -> dict[str, Any]:
    if not login:
        return {}
    cached = _twitch_profile_cache.get(login)
    if cached and time.time() - cached[0] < PROFILE_CACHE_TTL_SECONDS:
        return cached[1]
    details = await fetch_twitch_channel_details(login)
    payload = {
        "followers": details.get("followers") if details else None,
        "views": details.get("views") if details else None,
        "name": details.get("name") if details else None,
        "avatar": details.get("avatar") if details else None,
    }
    _twitch_profile_cache[login] = (time.time(), payload)
    return payload

async def fetch_twitch_videos(login: Optional[str], limit: int = 5) -> list[dict[str, Any]]:
    if not login:
        return []
    token = await _get_twitch_app_token()
    if not token or not TWITCH_ID:
        return []
    details = await fetch_twitch_channel_details(login)
    if not details or not details.get("id"):
        return []
    try:
        url = f"https://api.twitch.tv/helix/videos?user_id={quote_plus(details['id'])}&first={limit}&sort=time"
        headers = {"Client-ID": TWITCH_ID, "Authorization": f"Bearer {token}"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=12) as resp:
                data = await resp.json()
                if resp.status != 200:
                    log_event("twitch_videos_failed", status=resp.status, body=str(data)[:200])
                    return []
                items = data.get("data") or []
                return [
                    {
                        "title": item.get("title"),
                        "url": item.get("url"),
                        "published_at": item.get("published_at"),
                        "view_count": item.get("view_count"),
                        "duration": item.get("duration"),
                    }
                    for item in items
                ]
    except Exception as error:
        log_event("twitch_videos_error", error=str(error))
        return []

async def fetch_twitch_clips(login: Optional[str], limit: int = 5) -> list[dict[str, Any]]:
    if not login:
        return []
    token = await _get_twitch_app_token()
    if not token or not TWITCH_ID:
        return []
    details = await fetch_twitch_channel_details(login)
    if not details or not details.get("id"):
        return []
    try:
        url = f"https://api.twitch.tv/helix/clips?broadcaster_id={quote_plus(details['id'])}&first={limit}"
        headers = {"Client-ID": TWITCH_ID, "Authorization": f"Bearer {token}"}
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=12) as resp:
                data = await resp.json()
                if resp.status != 200:
                    log_event("twitch_clips_failed", status=resp.status, body=str(data)[:200])
                    return []
                items = data.get("data") or []
                return [
                    {
                        "title": item.get("title"),
                        "url": item.get("url"),
                        "creator": item.get("creator_name"),
                        "view_count": item.get("view_count"),
                        "created_at": item.get("created_at"),
                    }
                    for item in items
                ]
    except Exception as error:
        log_event("twitch_clips_error", error=str(error))
        return []

async def fetch_youtube_streams(channel_id: Optional[str], limit: int = 5) -> list[dict[str, Any]]:
    if not channel_id or not YT_KEY:
        return []
    try:
        url = (
            "https://www.googleapis.com/youtube/v3/search"
            f"?part=snippet&channelId={quote_plus(channel_id)}&type=video"
            f"&eventType=completed&order=date&maxResults={limit}&key={quote_plus(YT_KEY)}"
        )
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=12) as resp:
                data = await resp.json()
                if resp.status != 200:
                    log_event("youtube_streams_failed", status=resp.status, body=str(data)[:200])
                    return []
                items = data.get("items") or []
                return [
                    {
                        "title": item.get("snippet", {}).get("title"),
                        "url": f"https://youtube.com/watch?v={item.get('id', {}).get('videoId')}",
                        "published_at": item.get("snippet", {}).get("publishedAt"),
                    }
                    for item in items
                ]
    except Exception as error:
        log_event("youtube_streams_error", error=str(error))
        return []

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
        return web.json_response({"available": False, "username": None, "id": None})
    try:
        me = await bot.get_me()
        return web.json_response({"available": True, "username": me.username, "id": me.id})
    except Exception as error:
        log_event("bot_info_failed", error=str(error))
        return web.json_response({"available": False, "username": None, "id": None})

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
    request["verified_user"] = verified.get("user") or {}
    return None


async def setup_database():
    if not engine:
        return
    async with engine.begin() as conn:
        try:
            await conn.run_sync(Base.metadata.create_all)
        except Exception as error:
            log_event("db_create_all_failed", error=str(error))
            raise
        try:
            await conn.execute(text("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS donationalerts_name VARCHAR"))
        except Exception as error:
            log_event("db_alter_users_failed", error=str(error))

    required_tables = [
        "users",
        "streamers",
        "channel_connections",
        "notifications",
        "stream_goals",
        "donations",
        "visual_settings",
        "platform_stats",
        "questions",
        "live_banner",
        "stream_sessions",
        "admin_audit_logs",
        "rate_limit_events",
        "donation_events",
        "partner_banner_metrics",
    ]
    missing_tables: list[str] = []
    async with engine.connect() as conn:
        for table_name in required_tables:
            result = await conn.execute(text("SELECT to_regclass(:table_name)"), {"table_name": f"public.{table_name}"})
            if result.scalar_one_or_none() is None:
                missing_tables.append(table_name)
    if missing_tables:
        log_event("db_schema_missing", missing_tables=missing_tables)
        async with engine.begin() as conn:
            for table_name in missing_tables:
                table_key = f"public.{table_name}"
                table = Base.metadata.tables.get(table_key)
                if table is None:
                    continue
                await conn.run_sync(table.create, checkfirst=True)
        # Re-check after attempting to create missing tables
        still_missing: list[str] = []
        async with engine.connect() as conn:
            for table_name in required_tables:
                result = await conn.execute(text("SELECT to_regclass(:table_name)"), {"table_name": f"public.{table_name}"})
                if result.scalar_one_or_none() is None:
                    still_missing.append(table_name)
        if still_missing:
            log_event("db_schema_still_missing", missing_tables=still_missing)
            raise RuntimeError(f"Missing database tables: {', '.join(still_missing)}")

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

def _detect_platform_from_url(url: str) -> str:
    lowered = (url or "").lower()
    if "twitch.tv" in lowered:
        return "twitch"
    if "youtube.com" in lowered or "youtu.be" in lowered:
        return "youtube"
    raise ValueError("Platform not detected")

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
            try:
                me = await bot.get_me()
                member = await bot.get_chat_member(f"@{username}", me.id)
                if member.status not in {"administrator", "creator"}:
                    return web.json_response({"error": "bot_not_admin"}, status=403)
            except TelegramAPIError:
                return web.json_response({"error": "bot_not_admin"}, status=403)
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

    if platform == "kick":
        username = _extract_username(channel_raw)
        if not username:
            return web.json_response({"error": "kick_not_found"}, status=404)
        return web.json_response({
            "status": "ok",
            "platform": "kick",
            "name": username,
            "url": f"https://kick.com/{username}",
            "channel": username,
        })

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

async def connect_channel(request: web.Request):
    try:
        payload = await request.json()
        user_id = int(payload.get("user_id"))
        channel_url = str(payload.get("channel_url") or "").strip()
    except Exception:
        return web.json_response({"error": "bad_request"}, status=400)

    if not channel_url:
        return web.json_response({"error": "bad_request"}, status=400)

    try:
        platform = _detect_platform_from_url(channel_url)
    except ValueError as error:
        return web.json_response({"error": str(error)}, status=400)

    channel_name = _extract_username(channel_url)
    profile_data: dict[str, Any] = {
        "platform": platform,
        "channel_url": channel_url,
        "channel_name": channel_name,
        "connected": True,
    }

    if platform == "twitch":
        resolved = await resolve_twitch_login(channel_name)
        if not resolved:
            return web.json_response({"error": "twitch_not_found"}, status=404)
        details = await fetch_twitch_channel_details(resolved)
        channel_name = (details or {}).get("name") or resolved
        profile_data.update({
            "channel_name": channel_name,
            "avatar": (details or {}).get("avatar"),
            "followers": (details or {}).get("followers"),
            "views": (details or {}).get("views"),
        })
        twitch_name = resolved
        yt_channel_id = None
    else:
        resolved = await resolve_youtube_channel_id(channel_name)
        if not resolved:
            return web.json_response({"error": "youtube_not_found"}, status=404)
        details = await fetch_youtube_channel_details(resolved)
        channel_name = (details or {}).get("name") or resolved
        profile_data.update({
            "channel_name": channel_name,
            "avatar": (details or {}).get("avatar"),
            "subscribers": (details or {}).get("subscribers"),
            "views": (details or {}).get("views"),
        })
        twitch_name = None
        yt_channel_id = resolved
        profile_data["channel_url"] = f"https://youtube.com/channel/{resolved}"

    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)

    async with async_session() as session:
        streamer = await ensure_streamer(session, user_id, None)
        user = await session.get(User, user_id)
        if not user:
            user = User(user_id=user_id)
            session.add(user)

        if twitch_name is not None:
            user.twitch_name = twitch_name
            streamer.twitch_connected = bool(twitch_name)
        if yt_channel_id is not None:
            user.yt_channel_id = yt_channel_id
            streamer.youtube_connected = bool(yt_channel_id)

        connection = await session.get(ChannelConnection, user_id)
        if not connection:
            connection = ChannelConnection(
                user_id=user_id,
                platform=platform,
                channel_url=profile_data["channel_url"],
                channel_name=channel_name,
                connected=True,
            )
            session.add(connection)
        else:
            connection.platform = platform
            connection.channel_url = profile_data["channel_url"]
            connection.channel_name = channel_name
            connection.connected = True
            connection.updated_at = datetime.now(timezone.utc)

        await session.commit()

    return web.json_response(profile_data)

async def get_channel(request: web.Request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "no_uid"}, status=400)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        connection = await session.get(ChannelConnection, int(user_id))
        if not connection or not connection.connected:
            return web.json_response({"connected": False}, status=404)
        return web.json_response({
            "platform": connection.platform,
            "channel_url": connection.channel_url,
            "channel_name": connection.channel_name,
            "connected": connection.connected,
        })

async def get_dashboard_stats(request: web.Request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "no_uid"}, status=400)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        connection = await session.get(ChannelConnection, int(user_id))
        if not connection or not connection.connected:
            return web.json_response({"connected": False}, status=404)
        user = await session.get(User, int(user_id))
        platform = connection.platform
        stats: dict[str, Any] = {"platform": platform}
        if platform == "twitch":
            twitch_data = await fetch_twitch(user.twitch_name if user else None)
            profile = await fetch_twitch_profile(user.twitch_name if user else None)
            stats.update({
                "online": bool(twitch_data.get("online")),
                "viewers": int(twitch_data.get("viewers", 0)),
                "followers": int(profile.get("followers") or 0) if profile else 0,
                "views": int(profile.get("views") or 0) if profile else 0,
            })
        if platform == "youtube":
            yt_data = await fetch_youtube(user.yt_channel_id if user else None)
            stats.update({
                "subscribers": int(yt_data.get("subscribers") or 0),
            })
                note_title = "Stream live" if stats.get("online") else "Stream offline"
        existing = await session.execute(
            select(Notification)
            .where(Notification.user_id == int(user_id), Notification.title == note_title)
            .order_by(desc(Notification.created_at))
            .limit(1)
        )
        last_note = existing.scalars().first()
        if not last_note or (datetime.now(timezone.utc) - last_note.created_at).total_seconds() > 600:
            notification = Notification(user_id=int(user_id), title=note_title, body=f"Platform: {platform}")
            session.add(notification)
            await session.commit()
        return web.json_response(stats)

async def get_streams(request: web.Request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "no_uid"}, status=400)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        connection = await session.get(ChannelConnection, int(user_id))
        if not connection or not connection.connected:
            return web.json_response({"connected": False}, status=404)
        user = await session.get(User, int(user_id))
        platform = connection.platform
        if platform == "twitch":
            items = await fetch_twitch_videos(user.twitch_name if user else None)
        else:
            items = await fetch_youtube_streams(user.yt_channel_id if user else None)
        return web.json_response({"platform": platform, "items": items})

async def get_clips(request: web.Request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "no_uid"}, status=400)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        connection = await session.get(ChannelConnection, int(user_id))
        if not connection or not connection.connected:
            return web.json_response({"connected": False}, status=404)
        user = await session.get(User, int(user_id))
        if connection.platform != "twitch":
            return web.json_response({"platform": connection.platform, "items": []})
        items = await fetch_twitch_clips(user.twitch_name if user else None)
        return web.json_response({"platform": "twitch", "items": items})

async def get_notifications(request: web.Request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "no_uid"}, status=400)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        query = select(Notification).where(Notification.user_id == int(user_id)).order_by(desc(Notification.created_at)).limit(10)
        result = await session.execute(query)
        items = result.scalars().all()
        return web.json_response([
            {
                "title": item.title,
                "body": item.body,
                "created_at": item.created_at.isoformat(),
            }
            for item in items
        ])

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
                if OWNER_TELEGRAM_ID:
                    try:
                        session.add(
                            Donation(
                                streamer_id=int(OWNER_TELEGRAM_ID),
                                donor_name=event["donor"],
                                amount=int(event["amount"]),
                            )
                        )
                    except Exception:
                        pass
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


async def get_donations(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error
    uid = request.query.get("user_id")
    if not uid:
        return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid):
        return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    items: list[dict[str, Any]] = []
    async with async_session() as session:
        query = select(Donation).where(Donation.streamer_id == int(uid)).order_by(desc(Donation.timestamp)).limit(50)
        rows = (await session.execute(query)).scalars().all()
        items = [
            {
                "id": str(row.id),
                "donor": row.donor_name,
                "amount": row.amount,
                "currency": "RUB",
                "message": "",
                "source": "donation",
                "createdAt": row.timestamp.isoformat(),
            }
            for row in rows
        ]
    return web.json_response({"items": items, "configured": bool(DONATALERTS_ACCESS_TOKEN)})


async def get_stream_goals(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error
    uid = request.query.get("user_id")
    if not uid:
        return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid):
        return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        goals = (await session.execute(select(StreamGoal).where(StreamGoal.streamer_id == int(uid)))).scalars().all()
        return web.json_response([
            {
                "id": g.id,
                "goal_type": g.goal_type,
                "current_value": g.current_value,
                "target_value": g.target_value,
            }
            for g in goals
        ])


async def generate_stream_goals(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error
    uid = request.query.get("user_id")
    if not uid:
        try:
            payload = await request.json()
            uid = str(payload.get("user_id") or "")
        except Exception:
            uid = ""
    if not uid:
        return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid):
        return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    defaults = {
        "followers": 50,
        "online": 100,
        "subscriptions": 10,
    }
    async with async_session() as session:
        existing = (await session.execute(select(StreamGoal).where(StreamGoal.streamer_id == int(uid)))).scalars().all()
        if existing:
            return web.json_response({"status": "ok"})
        for goal_type, target in defaults.items():
            session.add(StreamGoal(streamer_id=int(uid), goal_type=goal_type, current_value=0, target_value=target))
        await session.commit()
    return web.json_response({"status": "ok"})


async def get_preferences(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error
    uid = request.query.get("user_id")
    if not uid:
        return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid):
        return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        streamer = await ensure_streamer(session, int(uid), (request.get("verified_user") or {}).get("username"))
        visual = (await session.execute(select(VisualSetting).where(VisualSetting.streamer_id == int(uid)))).scalars().first()
        return web.json_response({
            "language": streamer.language,
            "liquid_glow": visual.liquid_glow if visual else 50,
        })


async def save_preferences(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "bad_request"}, status=400)
    uid = payload.get("user_id")
    if not uid:
        return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid):
        return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    language = payload.get("language")
    liquid_glow = payload.get("liquid_glow")
    async with async_session() as session:
        streamer = await ensure_streamer(session, int(uid), (request.get("verified_user") or {}).get("username"))
        if language:
            streamer.language = str(language)
        visual = (await session.execute(select(VisualSetting).where(VisualSetting.streamer_id == int(uid)))).scalars().first()
        if not visual:
            visual = VisualSetting(streamer_id=int(uid), liquid_glow=int(liquid_glow or 50))
            session.add(visual)
        else:
            if liquid_glow is not None:
                visual.liquid_glow = int(liquid_glow)
        await session.commit()
    return web.json_response({"status": "ok"})


async def get_platforms(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error:
        return auth_error
    uid = request.query.get("user_id")
    if not uid:
        return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid):
        return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session:
        return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        stats = (await session.execute(select(PlatformStat).where(PlatformStat.streamer_id == int(uid)))).scalars().all()
        return web.json_response([
            {"platform": s.platform, "followers": s.followers, "views": s.views, "streams": s.streams}
            for s in stats
        ])


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
    kick_name = payload.kick_name
    telegram_channel = payload.telegram_channel

    if twitch_name:
        if not all([TWITCH_ID, TWITCH_SECRET]):
            return web.json_response({"error": "twitch_validation_not_configured"}, status=500)
        try:
            resolved_twitch = await resolve_twitch_login(twitch_name)
        except Exception as error:
            log_event("twitch_resolve_failed", error=str(error))
            return web.json_response({"error": "twitch_resolve_failed"}, status=502)
        if not resolved_twitch:
            return web.json_response({"error": "twitch_not_found"}, status=400)
        twitch_name = resolved_twitch

    if yt_channel_id:
        if not YT_KEY:
            return web.json_response({"error": "youtube_validation_not_configured"}, status=500)
        try:
            resolved_youtube = await resolve_youtube_channel_id(yt_channel_id)
        except Exception as error:
            log_event("youtube_resolve_failed", error=str(error))
            return web.json_response({"error": "youtube_resolve_failed"}, status=502)
        if not resolved_youtube:
            return web.json_response({"error": "youtube_not_found"}, status=400)
        yt_channel_id = resolved_youtube

    if donationalerts_name:
        if not DONATALERTS_ACCESS_TOKEN:
            return web.json_response({"error": "donatealerts_not_configured"}, status=500)
        donationalerts_name = _extract_username(donationalerts_name)

    try:
        async with async_session() as session:
            streamer = await ensure_streamer(session, payload.user_id, (request.get("verified_user") or {}).get("username"))
            user = await session.get(User, payload.user_id)
            if not user:
                user = User(user_id=payload.user_id)
                session.add(user)

            user.twitch_name = twitch_name
            user.yt_channel_id = yt_channel_id
            user.donationalerts_name = donationalerts_name

            if twitch_name is not None:
                streamer.twitch_connected = bool(twitch_name)
            if yt_channel_id is not None:
                streamer.youtube_connected = bool(yt_channel_id)
            if telegram_channel is not None:
                streamer.telegram_channel = telegram_channel
                streamer.telegram_connected = bool(telegram_channel)
            if kick_name is not None:
                streamer.kick_connected = bool(kick_name)
                streamer.kick_name = kick_name
            await session.commit()
    except Exception as error:
        log_event("save_settings_failed", error=str(error))
        return web.json_response({"error": "save_settings_failed"}, status=500)

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
            "kick_name": kick_name,
            "telegram_channel": telegram_channel,
        }
    )

# ... (rest of the API endpoints remain the same)

@web.middleware
async def cache_control_middleware(request, handler):
    response = await handler(request)
    if isinstance(response, web.FileResponse):
        path = request.path
        response.headers["Cache-Control"] = "no-store, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        if path == "/" or path.endswith(".html"):
            response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if path.startswith("/assets/"):
            response.headers["X-Content-Type-Options"] = "nosniff"
            content_type, _ = mimetypes.guess_type(path)
            if content_type:
                response.content_type = content_type
    return response


def build_app():
    mimetypes.add_type("text/css", ".css")
    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("application/javascript", ".mjs")
    mimetypes.add_type("application/json", ".map")
    app = web.Application(middlewares=[cache_control_middleware])
    
    # Health check for cron-job
    app.router.add_get("/health", health_check)

    # API routes
    app.router.add_post("/api/ping", api_ping)
    app.router.add_get("/api/bot_info", get_bot_info)
    app.router.add_get("/api/stats", get_all_stats)
    app.router.add_get("/api/settings", get_settings)
    app.router.add_get("/api/analytics", get_analytics)
    app.router.add_get("/api/stream_goals", get_stream_goals)
    app.router.add_post("/api/stream_goals/generate", generate_stream_goals)
    app.router.add_get("/api/preferences", get_preferences)
    app.router.add_post("/api/preferences", save_preferences)
    app.router.add_get("/api/platforms", get_platforms)
    app.router.add_get("/api/questions", get_questions)
    app.router.add_post("/api/questions/answer", answer_question)
    app.router.add_post("/api/live_banner", set_live_banner)
    app.router.add_get("/api/live_banner", get_live_banner)
    app.router.add_post("/api/verify_channel", verify_channel)
    app.router.add_post("/api/channel/connect", connect_channel)
    app.router.add_get("/api/channel", get_channel)
    app.router.add_get("/api/dashboard_stats", get_dashboard_stats)
    app.router.add_get("/api/streams", get_streams)
    app.router.add_get("/api/clips", get_clips)
    app.router.add_get("/api/notifications", get_notifications)
    app.router.add_post("/api/save_settings", save_settings)
    app.router.add_post("/api/donations/webhook", donations_webhook)
    app.router.add_get("/api/donations/live", get_donations_live)
    app.router.add_get("/api/donations", get_donations)
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
        streamer = await ensure_streamer(session, int(uid), (request.get("verified_user") or {}).get("username"))
        user = await session.get(User, int(uid))
        if not user: return web.json_response({"is_linked": False, "clicks": 0, "twitch": {"online": False, "viewers": 0}, "youtube": {"subscribers": 0}})
        twitch_data = await fetch_twitch(user.twitch_name)
        if user.twitch_name:
            profile = await fetch_twitch_profile(user.twitch_name)
            if profile.get("followers") is not None:
                twitch_data["followers"] = profile.get("followers")
            if profile.get("views") is not None:
                twitch_data["views"] = profile.get("views")
            twitch_data["url"] = f"https://twitch.tv/{user.twitch_name}"
            await upsert_platform_stat(
                session,
                streamer.id,
                "twitch",
                followers=int(profile.get("followers") or 0) if profile else 0,
                views=int(profile.get("views") or 0) if profile else 0,
                streams=0,
            )
        youtube_data = await fetch_youtube(user.yt_channel_id)
        if user.yt_channel_id:
            await upsert_platform_stat(
                session,
                streamer.id,
                "youtube",
                followers=int(youtube_data.get("subscribers") or 0),
                views=0,
                streams=0,
            )
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
        streamer = await ensure_streamer(session, int(uid), (request.get("verified_user") or {}).get("username"))
        user = await session.get(User, int(uid))
        if not user:
            return web.json_response({
                "is_linked": False,
                "twitch_name": None,
                "yt_channel_id": None,
                "donationalerts_name": None,
                "telegram_channel": streamer.telegram_channel,
                "kick_connected": streamer.kick_connected,
                "kick_name": streamer.kick_name,
                "language": streamer.language,
            })
        return web.json_response({
            "is_linked": bool(user.twitch_name or user.yt_channel_id or streamer.kick_connected or streamer.telegram_connected),
            "twitch_name": user.twitch_name,
            "yt_channel_id": user.yt_channel_id,
            "donationalerts_name": user.donationalerts_name,
            "telegram_channel": streamer.telegram_channel,
            "kick_connected": streamer.kick_connected,
            "kick_name": streamer.kick_name,
            "language": streamer.language,
        })

async def get_analytics(request: web.Request):
    auth_error = await _require_verified_user(request)
    if auth_error: return auth_error
    uid = request.query.get("user_id")
    period = (request.query.get("period") or "today").lower()
    if not uid: return web.json_response({"error": "no_uid"}, status=400)
    if REQUIRE_INIT_DATA and request.get("verified_user_id") and request["verified_user_id"] != str(uid): return web.json_response({"error": "user_mismatch"}, status=403)
    if not async_session: return web.json_response({"error": "db_not_configured"}, status=500)
    async with async_session() as session:
        now = datetime.now(timezone.utc)
        start = None
        end = None
        if period == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "yesterday":
            start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
        elif period == "7d":
            start = now - timedelta(days=7)
        elif period == "30d":
            start = now - timedelta(days=30)

        base_query = select(StreamSession).where(StreamSession.user_id == int(uid))
        if start:
            base_query = base_query.where(StreamSession.started_at >= start)
        if end:
            base_query = base_query.where(StreamSession.started_at < end)
        sessions_query = base_query.order_by(desc(StreamSession.started_at)).limit(50)
        sessions = (await session.execute(sessions_query)).scalars().all()

        sessions_all_query = (
            select(StreamSession)
            .where(StreamSession.user_id == int(uid))
            .order_by(desc(StreamSession.started_at))
            .limit(365)
        )
        sessions_all = (await session.execute(sessions_all_query)).scalars().all()
        user = await session.get(User, int(uid))
        clicks = user.clicks if user else 0
        streams_count = len(sessions)
        max_peak = max((s.peak_viewers for s in sessions), default=0)
        avg_peak = int(sum((s.peak_viewers for s in sessions), 0) / streams_count) if streams_count else 0
        total_hours = sum((s.ended_at - s.started_at).total_seconds() / 3600.0 for s in sessions if s.started_at and s.ended_at)
        timeline = [{"time": s.started_at.isoformat(), "viewers": s.peak_viewers, "event": "start"} for s in sessions[:24] if s.started_at]

        last_stream_at = sessions_all[0].started_at.isoformat() if sessions_all and sessions_all[0].started_at else None
        stream_dates_set = {s.started_at.date() for s in sessions_all if s.started_at}
        stream_dates = sorted(stream_dates_set)
        longest_streak = 0
        current = 0
        prev = None
        for day in stream_dates:
            if prev and (day - prev).days == 1:
                current += 1
            else:
                current = 1
            longest_streak = max(longest_streak, current)
            prev = day
        today = datetime.now(timezone.utc).date()
        current_streak = 0
        day_cursor = today
        while day_cursor in stream_dates_set:
            current_streak += 1
            day_cursor = day_cursor - timedelta(days=1)
        return web.json_response({
            "streams_count": streams_count,
            "max_peak": max_peak,
            "avg_peak": avg_peak,
            "hours_streamed": round(total_hours, 1),
            "clicks": clicks,
            "timeline": list(reversed(timeline)),
            "last_stream_at": last_stream_at,
            "current_streak_days": current_streak,
            "longest_streak_days": longest_streak,
        })

if __name__ == "__main__":
    try:
        print("--- Bot startup ---")
        asyncio.run(main())
    except Exception as error:
        print(f"!!! Startup error: {error}")

# Force update



