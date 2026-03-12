import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Twitch, Youtube, Send, Heart, Sparkles, Flame, ArrowRight, Link2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { makeFadeUp, makeStagger } from "@/shared/motion";

type Ripple = { id: number; x: number; y: number };
type Platform = "twitch" | "youtube" | "telegram" | "donatealerts" | "kick";
type IntegrationCategory = "platforms" | "donations" | "notifications";

type PlatformConfig = {
  key: Platform;
  label: string;
  color: string;
  placeholder: string;
  description: string;
  category: IntegrationCategory;
  icon: typeof Twitch;
};

type VerifyResult = {
  name: string;
  url: string;
  platform: Platform;
  avatar?: string | null;
  followers?: number | null;
  subscribers?: number | null;
  videos?: number | null;
  views?: number | null;
  channel?: string | null;
  chat_id?: string | null;
  is_verified?: boolean;
};

type TelegramTarget = {
  chat_id: string;
  name: string;
  platform: "telegram";
  url?: string;
  channel?: string | null;
  subscribers?: number | null;
  avatar?: string | null;
  is_verified?: boolean;
};

type VerifyPayload = {
  user_id: number;
  platform: Platform;
  channel: string;
  init_data?: string | null;
};

function buildChannelUrl(platform: Platform, channel: string) {
  const trimmed = channel.trim();
  if (!trimmed) return "";
  if (trimmed.includes("http://") || trimmed.includes("https://")) {
    return trimmed;
  }
  if (platform === "twitch") return `https://twitch.tv/${trimmed}`;
  if (platform === "youtube") return `https://youtube.com/${trimmed}`;
  if (platform === "telegram") return `https://t.me/${trimmed.replace(/^@/, "")}`;
  return trimmed;
}

async function postVerifyChannel(payload: VerifyPayload) {
  const response = await fetch("/api/verify_channel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status !== 404 && response.status !== 405) {
    return response;
  }
  if (payload.platform === "twitch" || payload.platform === "youtube") {
    const channel_url = buildChannelUrl(payload.platform, payload.channel);
    return fetch("/api/channel/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: payload.user_id, channel_url }),
    });
  }
  return response;
}

async function loadTelegramTargets(userId: number, initData: string): Promise<TelegramTarget[]> {
  const response = await fetch(`/api/telegram_targets?user_id=${userId}&init_data=${encodeURIComponent(initData)}`);
  if (!response.ok) {
    return [];
  }
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: { id?: number } };
    };
  };
};

const platforms: PlatformConfig[] = [
  {
    key: "twitch",
    label: "Twitch",
    color: "#9146FF",
    placeholder: "https://twitch.tv/username",
    description: "Импортирует статус эфира, аналитику и историю трансляций.",
    category: "platforms",
    icon: Twitch,
  },
  {
    key: "youtube",
    label: "YouTube",
    color: "#FF0000",
    placeholder: "https://youtube.com/@channel",
    description: "Добавляет аналитику, архивы эфиров и общую картину по площадкам.",
    category: "platforms",
    icon: Youtube,
  },
  {
    key: "telegram",
    label: "Telegram",
    color: "#00B2FF",
    placeholder: "@channel, @group или chat_id",
    description: "Помогает отправлять анонсы, публиковать ссылку и выбирать канал или чат.",
    category: "notifications",
    icon: Send,
  },
  {
    key: "donatealerts",
    label: "DonateAlerts",
    color: "#F57B20",
    placeholder: "https://donationalerts.com/r/username",
    description: "Собирает поддержку, историю донатов и топ донатеров в одном месте.",
    category: "donations",
    icon: Heart,
  },
  {
    key: "kick",
    label: "Kick",
    color: "#53FC18",
    placeholder: "https://kick.com/username",
    description: "Подтягивает статус эфира и помогает сравнивать площадки в аналитике.",
    category: "platforms",
    icon: Flame,
  },
];

const buildChannelStats = (platform: Platform, data: VerifyResult, t: (key: string, fallback?: string) => string) => {
  if (platform === "youtube") {
    return [
      { label: t("integrations.subscribers", "Subscribers"), value: data.subscribers },
      { label: t("integrations.views", "Views"), value: data.views },
      { label: t("integrations.videos", "Videos"), value: data.videos },
    ];
  }
  if (platform === "twitch") {
    return [
      { label: t("integrations.followers", "Followers"), value: data.followers },
      { label: t("integrations.views", "Views"), value: data.views },
      { label: t("integrations.videos", "Videos"), value: data.videos },
    ];
  }
  if (platform === "telegram") {
    return [
      { label: t("integrations.subscribers", "Subscribers"), value: data.subscribers },
      { label: t("integrations.views", "Views"), value: data.views },
      { label: t("integrations.videos", "Videos"), value: data.videos },
    ];
  }
  return [
    { label: t("integrations.followers", "Followers"), value: data.followers },
    { label: t("integrations.views", "Views"), value: data.views },
    { label: t("integrations.videos", "Videos"), value: data.videos },
  ];
};

const extractHandle = (value: string) => {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.startsWith("@")) return raw.slice(1);
  if (raw.includes("twitch.tv/")) {
    return raw.split("twitch.tv/")[1].split(/[/?#]/)[0];
  }
  if (raw.includes("youtube.com/@")) {
    return raw.split("youtube.com/@")[1].split(/[/?#]/)[0];
  }
  if (raw.includes("youtube.com/channel/")) {
    return raw.split("youtube.com/channel/")[1].split(/[/?#]/)[0];
  }
  if (raw.includes("donationalerts.com/r/")) {
    return raw.split("donationalerts.com/r/")[1].split(/[/?#]/)[0];
  }
  if (raw.includes("kick.com/")) {
    return raw.split("kick.com/")[1].split(/[/?#]/)[0];
  }
  return raw;
};

function mapIntegrationError(
  errorCode: string | null | undefined,
  platform: Platform,
  t: (key: string, fallback?: string) => string,
) {
  if (!errorCode) return t("integrations.errorUnknown", "Не удалось выполнить действие. Попробуйте ещё раз.");
  if (errorCode === "bot_not_admin") {
    return t("integrations.errorBotAdmin", "Добавьте бота в канал или группу и дайте ему нужные права.");
  }
  if (errorCode === "telegram_bot_not_configured") {
    return t("integrations.errorTelegramBot", "Telegram-бот ещё не настроен на сервере.");
  }
  if (errorCode === "telegram_unreachable" || errorCode === "bot_info_unavailable") {
    return t("integrations.errorTelegramUnavailable", "Сервер сейчас не может связаться с Telegram API. Это проблема окружения, а не канала.");
  }
  if (errorCode === "save_settings_failed") {
    return t("integrations.errorSave", "Не удалось сохранить подключение в настройках.");
  }
  if (errorCode === "rate_limited") {
    return t("integrations.errorRateLimit", "Слишком много попыток подряд. Подождите немного и повторите.");
  }
  if (errorCode === "user_mismatch") {
    return t("integrations.errorTelegram", "Откройте приложение через Telegram для проверки.");
  }
  if (platform === "telegram" && errorCode === "telegram_not_found") {
    return t("integrations.errorTelegramTarget", "Не нашли канал или группу. Добавьте бота и выберите цель из списка ниже.");
  }
  if (platform === "twitch" && errorCode === "twitch_validation_not_configured") {
    return t("integrations.errorTwitchConfig", "Проверка Twitch ещё не настроена на сервере.");
  }
  if (platform === "youtube" && errorCode === "youtube_validation_not_configured") {
    return t("integrations.errorYouTubeConfig", "Проверка YouTube ещё не настроена на сервере.");
  }
  if (platform === "donatealerts" && errorCode === "donatealerts_not_configured") {
    return t("integrations.errorDonateAlertsConfig", "DonateAlerts ещё не настроен на сервере.");
  }
  return t("integrations.errorNotFound", "Channel not found. Please check username or link");
}

function IntegrationCard({
  label,
  description,
  color,
  icon: Icon,
  onOpen,
  connected,
  statusText,
  actionLabel,
  connectedLabel,
  disabled = false,
}: {
  label: string;
  description: string;
  color: string;
  icon: typeof Twitch;
  onOpen: () => void;
  connected?: boolean;
  statusText: string;
  actionLabel: string;
  connectedLabel: string;
  disabled?: boolean;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 650);
  };

  return (
    <motion.button
      type="button"
      onClick={(event) => {
        if (disabled) return;
        handleRipple(event);
        onOpen();
      }}
      whileHover={disabled ? undefined : { y: -4, scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      disabled={disabled}
      className="group relative flex min-h-[13.75rem] w-full items-start justify-between overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#0b0b0f] p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,0.35)] hover-lift disabled:cursor-not-allowed disabled:opacity-75 sm:min-h-[15.75rem] sm:rounded-3xl sm:p-5"
    >
      <motion.div
        className="absolute -inset-8 opacity-70 blur-3xl"
        style={{
          background: `radial-gradient(60% 60% at 50% 50%, ${color}55 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.45, 0.8, 0.45], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -inset-16 opacity-40 blur-2xl"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, ${color}66, transparent, ${color}66)`,
        }}
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex w-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 shadow-[0_0_28px_rgba(0,0,0,0.24)] sm:h-14 sm:w-14">
            <motion.div
              animate={{ x: [0, 1.5, 0, -1.5, 0], y: [0, -1.5, 0, 1.5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon size={30} color="#ffffff" />
            </motion.div>
          </div>
          <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${connected ? "bg-white/10 text-white/80 shadow-[0_0_18px_rgba(0,178,255,0.35)]" : "border border-white/10 bg-black/20 text-white/55"}`}>
            {statusText}
          </span>
        </div>

        <div>
          <p className="text-base font-semibold text-white sm:text-lg">{label}</p>
          <p className="mt-2 max-w-[16rem] text-sm leading-5 text-white/62 sm:leading-6">{description}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/42 sm:text-xs sm:tracking-[0.24em]">{connected ? connectedLabel : "Не подключено"}</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72">
            {actionLabel}
            <ArrowRight size={12} />
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0">
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute h-10 w-10 rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              background: `${color}33`,
              border: `1px solid ${color}88`,
            }}
            initial={{ scale: 0, opacity: 0.9, x: "-50%", y: "-50%" }}
            animate={{ scale: 10, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `0 0 60px ${color}55` }}
      />
    </motion.button>
  );
}

const integrationCategoryMeta = {
  platforms: {
    title: "Платформы",
    description: "Подключите Twitch, YouTube и Kick, чтобы открыть аналитику, историю эфиров и AI-рекомендации.",
  },
  donations: {
    title: "Донаты",
    description: "Подключите сервис поддержки, чтобы видеть историю, среднюю сумму и топ донатеров в одном месте.",
  },
  notifications: {
    title: "Уведомления",
    description: "Подключите Telegram, чтобы отправлять анонсы и выбирать, куда публиковать ссылку на эфир.",
  },
} as const;

export default function IntegrationsPage() {
  const { t } = useI18n();
  const [activePlatform, setActivePlatform] = useState<PlatformConfig | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState<Record<Platform, VerifyResult | null>>({
    twitch: null,
    youtube: null,
    telegram: null,
    donatealerts: null,
    kick: null,
  });
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [botInfoError, setBotInfoError] = useState<string | null>(null);
  const [telegramTargets, setTelegramTargets] = useState<TelegramTarget[]>([]);
  const [loadingTelegramTargets, setLoadingTelegramTargets] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const platformLabels = useMemo(() => {
    return platforms.reduce<Record<Platform, string>>((acc, p) => {
      acc[p.key] = p.label;
      return acc;
    }, { twitch: "Twitch", youtube: "YouTube", telegram: "Telegram", donatealerts: "DonateAlerts", kick: "Kick" });
  }, []);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<VerifyResult | null>(null);

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;
  const initData = tg?.initData || "";
  const canManageIntegrations = Boolean(userId && initData);

  const openTelegramLink = (url: string) => {
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
      return;
    }
    window.open(url, "_blank");
  };

  const fetchBotUsername = useCallback(async () => {
    try {
      const res = await fetch("/api/bot_info");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.username) {
        setBotUsername(data.username);
        setBotInfoError(null);
        return;
      }
      setBotInfoError((data?.error as string | undefined) || "bot_info_unavailable");
    } catch {
      setBotInfoError("bot_info_unavailable");
    }
    setBotUsername(null);
  }, []);

  const closeModal = () => {
    setActivePlatform(null);
    setInputValue("");
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  };

  const makeVerifyResult = useCallback(
    (platform: Platform, channel: string, data: Record<string, unknown>) =>
      ({
        name: (data.name as string) || (data.channel_name as string) || channel,
        url: (data.url as string) || (data.channel_url as string) || "",
        platform,
        avatar: (data.avatar as string) || null,
        followers: (data.followers as number | null | undefined) ?? null,
        subscribers: (data.subscribers as number | null | undefined) ?? null,
        videos: (data.videos as number | null | undefined) ?? null,
        views: (data.views as number | null | undefined) ?? null,
        channel: (data.channel as string | null | undefined) ?? null,
        chat_id: (data.chat_id as string | null | undefined) ?? null,
        is_verified: (data.is_verified as boolean | undefined) ?? true,
      }) as VerifyResult,
    [],
  );

  const fetchTelegramTargetsList = useCallback(async () => {
    if (!userId || !initData) return;
    setLoadingTelegramTargets(true);
    try {
      const targets = await loadTelegramTargets(userId, initData);
      setTelegramTargets(targets);
    } finally {
      setLoadingTelegramTargets(false);
    }
  }, [initData, userId]);

  const hydrateConnection = useCallback(async (platform: Platform, channel: string) => {
    if (!userId || !initData) {
      return {
        name: channel,
        url: "",
        platform,
      } as VerifyResult;
    }
    try {
      const response = await postVerifyChannel({
        user_id: userId,
        platform,
        channel,
        init_data: initData,
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && !data?.error) {
        return makeVerifyResult(platform, channel, data);
      }
    } catch {
      // ignore
    }
    return {
      name: channel,
      url: "",
      platform,
    } as VerifyResult;
  }, [userId, initData, makeVerifyResult]);

  useEffect(() => {
    const loadSaved = async () => {
      if (!userId || !initData) return;
      setLoadingSaved(true);
      try {
        const res = await fetch(`/api/settings?user_id=${userId}&init_data=${encodeURIComponent(initData)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const next: Partial<Record<Platform, VerifyResult>> = {};
        const tasks: Promise<void>[] = [];
        if (data?.twitch_name) {
          tasks.push(
            hydrateConnection("twitch", data.twitch_name).then((payload) => {
              next.twitch = payload;
            }),
          );
        }
        if (data?.yt_channel_id) {
          tasks.push(
            hydrateConnection("youtube", data.yt_channel_id).then((payload) => {
              next.youtube = payload;
            }),
          );
        }
        if (data?.donationalerts_name) {
          tasks.push(
            hydrateConnection("donatealerts", data.donationalerts_name).then((payload) => {
              next.donatealerts = payload;
            }),
          );
        }
        if (data?.telegram_channel) {
          tasks.push(
            hydrateConnection("telegram", data.telegram_channel).then((payload) => {
              next.telegram = payload;
            }),
          );
        }
        if (data?.kick_name) {
          tasks.push(
            hydrateConnection("kick", data.kick_name).then((payload) => {
              next.kick = payload;
            }),
          );
        }
        await Promise.all(tasks);
        await fetchTelegramTargetsList();
        if (Object.keys(next).length) {
          setConnected((prev) => ({ ...prev, ...next }));
        }
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSaved();
  }, [userId, initData, hydrateConnection, fetchTelegramTargetsList]);

  const openPlatform = useCallback((platform: PlatformConfig, presetValue = "") => {
    setActivePlatform(platform);
    setStatus("idle");
    setResult(null);
    setInputValue(presetValue);
    setErrorMessage(null);
    if (platform.key === "telegram") {
      void fetchTelegramTargetsList();
    }
  }, [fetchTelegramTargetsList]);

  const verify = async () => {
    if (!inputValue.trim()) {
      setStatus("error");
      setErrorMessage(t("integrations.errorEmpty", "Enter a username or link"));
      return;
    }
    if (!activePlatform || !userId) {
      setStatus("error");
      setErrorMessage(t("integrations.errorTelegram", "Open the app via Telegram to verify"));
      return;
    }
    setStatus("verifying");
    setErrorMessage(null);
    try {
      const response = await postVerifyChannel({
        user_id: userId,
        platform: activePlatform.key,
        channel: inputValue.trim(),
        init_data: initData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) {
        setStatus("error");
        setErrorMessage(mapIntegrationError((data?.error as string | undefined) || null, activePlatform.key, t));
        return;
      }
      setResult(makeVerifyResult(activePlatform.key, inputValue.trim(), data));
      setStatus("success");
      if (activePlatform.key === "telegram") {
        await fetchTelegramTargetsList();
      }
    } catch {
      setStatus("error");
      setErrorMessage(mapIntegrationError(null, activePlatform.key, t));
    }
  };

  const openAddChannel = () => {
    if (!botUsername) {
      setErrorMessage(mapIntegrationError(botInfoError || "bot_info_unavailable", "telegram", t));
      return;
    }
    openTelegramLink(`https://t.me/${botUsername}?startchannel=true&admin=post_messages+edit_messages+delete_messages+manage_chat`);
  };

  const openAddGroup = () => {
    if (!botUsername) {
      setErrorMessage(mapIntegrationError(botInfoError || "bot_info_unavailable", "telegram", t));
      return;
    }
    openTelegramLink(`https://t.me/${botUsername}?startgroup=true&admin=manage_chat+delete_messages`);
  };

  const confirmConnection = async () => {
    if (!result) return;
    if (userId && initData) {
      let response: Response | null = null;
      if (result.platform === "twitch") {
        const twitchLogin = extractHandle(result.url || result.name);
        response = await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, twitch_name: twitchLogin, init_data: initData }),
        });
      }
      if (result.platform === "youtube") {
        const youtubeIdOrHandle = extractHandle(result.url || result.name);
        response = await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, yt_channel_id: youtubeIdOrHandle, init_data: initData }),
        });
      }
      if (result.platform === "donatealerts") {
        const donatealertsName = extractHandle(result.url || result.name);
        response = await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, donationalerts_name: donatealertsName, init_data: initData }),
        });
      }
      if (result.platform === "telegram") {
        const channel = result.chat_id || result.channel || result.name;
        response = await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, telegram_channel: channel, init_data: initData }),
        });
      }
      if (result.platform === "kick") {
        const kickName = extractHandle(result.url || result.name);
        response = await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, kick_name: kickName, init_data: initData }),
        });
      }
      const savePayload = response ? await response.json().catch(() => ({})) : {};
      if (response && (!response.ok || savePayload?.error)) {
        setStatus("error");
        setErrorMessage(mapIntegrationError((savePayload?.error as string | undefined) || null, result.platform, t));
        return;
      }
    }
    setConnected((prev) => ({ ...prev, [result.platform]: result }));
    setSuccessData(result);
    setShowSuccess(true);
    if (result.platform === "telegram") {
      await fetchTelegramTargetsList();
    }
    closeModal();
  };

  const groupedPlatforms = useMemo(
    () =>
      (Object.keys(integrationCategoryMeta) as Array<keyof typeof integrationCategoryMeta>).map((key) => ({
        key,
        ...integrationCategoryMeta[key],
        items: platforms.filter((platform) => platform.category === key),
      })),
    [],
  );

  const primaryPlatform = useMemo(
    () => platforms.find((platform) => platform.category === "platforms" && !connected[platform.key]) ?? platforms.find((platform) => !connected[platform.key]) ?? platforms[0],
    [connected],
  );

  const primaryNextStep = !canManageIntegrations
    ? "Откройте приложение через Telegram, чтобы подтверждать подключения и выбирать каналы для публикации."
    : connected.twitch || connected.youtube || connected.kick
      ? "Подключите ещё одну площадку, чтобы видеть общую аналитику по платформам."
      : "Подключите платформу, чтобы открыть аналитику, историю эфиров и AI-рекомендации.";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="relative mx-auto flex min-h-[70dvh] max-w-[1520px] flex-col px-2.5 py-5 sm:px-4 md:px-6 md:py-9">
      <motion.section variants={item} className="saas-card mb-6 overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">Интеграции</div>
            <h1 className="mt-3 text-2xl font-black text-white md:text-3xl">Подключения, которые открывают весь mini app</h1>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Подключите платформы, чтобы открыть аналитику, историю эфиров и AI-рекомендации. Donates и Telegram добавят поддержку, анонсы и быстрые публикации в одном месте.
            </p>
            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/80">
                  <Link2 size={18} />
                </div>
                <div>
                  <p className="font-semibold text-white">Следующий шаг</p>
                  <p className="mt-1 text-white/60">{primaryNextStep}</p>
                </div>
              </div>
            </div>
            {!canManageIntegrations ? (
              <div className="mt-4 rounded-[22px] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                Откройте этот экран через Telegram Mini App, чтобы подтверждать каналы, сохранять подключения и видеть найденные чаты.
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-3 lg:min-w-[220px]">
            <Button onClick={() => openPlatform(primaryPlatform)} className="w-full gap-2 lg:w-auto" disabled={!canManageIntegrations}>
              Подключить платформу
              <ArrowRight size={14} />
            </Button>
            <Button
              variant="outline"
              onClick={() => openPlatform(platforms.find((platform) => platform.key === "telegram") || platforms[0])}
              className="w-full gap-2 lg:w-auto"
              disabled={!canManageIntegrations}
            >
              Подключить Telegram
            </Button>
            {loadingSaved ? <p className="text-xs text-white/50">{t("integrations.loadingSaved", "Загружаем сохранённые подключения...")}</p> : null}
          </div>
        </div>
      </motion.section>

      <motion.div variants={item} className="space-y-6">
        {groupedPlatforms.map((group) => (
          <section key={group.key} className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">{group.title}</h2>
                <p className="mt-1 text-sm text-white/55">{group.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {group.items.map((platform) => {
                const isConnected = Boolean(connected[platform.key]);
                const statusText = isConnected ? "Подключено" : botInfoError && platform.key === "telegram" ? "Проверить" : "Не подключено";
                const actionLabel = isConnected ? "Управлять" : "Подключить";
                return (
                  <IntegrationCard
                    key={platform.key}
                    label={platform.label}
                    description={platform.description}
                    color={platform.color}
                    icon={platform.icon}
                    connected={isConnected}
                    statusText={!canManageIntegrations ? "Mini App" : statusText}
                    actionLabel={!canManageIntegrations ? "Открыть в Telegram" : actionLabel}
                    connectedLabel={t("integrations.connected", "Уже подключено")}
                    disabled={!canManageIntegrations}
                    onOpen={() => openPlatform(platform)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </motion.div>

      {Object.values(connected).some(Boolean) && (
        <motion.div variants={item} className="mt-8 grid w-full grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Object.entries(connected).map(([key, value]) =>
            value ? (
              <div key={key} className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 text-sm text-white/80 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white/10">
                    {value.avatar ? (
                      <img src={value.avatar} alt={value.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/60">{value.name.slice(0, 1)}</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Подключено · {platformLabels[value.platform]}</p>
                    <p className="text-xs text-white/60">{value.channel || value.name}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/60 sm:grid-cols-3">
                  {buildChannelStats(value.platform, value, t).map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                      <p className="text-[10px] uppercase">{stat.label}</p>
                      <p className="text-sm text-white">{stat.value ?? "--"}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const config = platforms.find((platform) => platform.key === value.platform);
                      if (!config) return;
                      openPlatform(config, value.chat_id || value.url || value.channel || value.name);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:bg-white/10"
                  >
                    {t("integrations.reconnect", "Reconnect")}
                  </button>
                </div>
              </div>
            ) : null,
          )}
        </motion.div>
      )}

      {activePlatform && (
        <IntegrationModal
          platform={activePlatform}
          inputValue={inputValue}
          setInputValue={setInputValue}
          status={status}
          result={result}
          errorMessage={errorMessage}
          onClose={closeModal}
          onVerify={verify}
          onConfirm={confirmConnection}
          botUsername={botUsername}
          botInfoError={botInfoError}
          telegramTargets={telegramTargets}
          loadingTelegramTargets={loadingTelegramTargets}
          onRequestBotUsername={fetchBotUsername}
          onOpenAddChannel={openAddChannel}
          onOpenAddGroup={openAddGroup}
          onSelectTelegramTarget={(target) => {
            setInputValue(target.chat_id || target.channel || target.name);
            setErrorMessage(null);
            setStatus("idle");
          }}
        />
      )}

      {showSuccess && successData && (
        <SuccessModal
          platform={successData.platform}
          onClose={() => setShowSuccess(false)}
          title={t("integrations.successTitle", "Channel Connected")}
          description={t("integrations.successDesc", "Your channel has been successfully connected.")}
          actionLabel={t("actions.continue", "Continue")}
        />
      )}
    </motion.div>
  );
}function IntegrationModal({
  platform,
  inputValue,
  setInputValue,
  status,
  result,
  errorMessage,
  onClose,
  onVerify,
  onConfirm,
  botUsername,
  botInfoError,
  telegramTargets,
  loadingTelegramTargets,
  onRequestBotUsername,
  onOpenAddChannel,
  onOpenAddGroup,
  onSelectTelegramTarget,
}: {
  platform: PlatformConfig;
  inputValue: string;
  setInputValue: (value: string) => void;
  status: "idle" | "verifying" | "success" | "error";
  result: VerifyResult | null;
  errorMessage: string | null;
  onClose: () => void;
  onVerify: () => void;
  onConfirm: () => void;
  botUsername: string | null;
  botInfoError: string | null;
  telegramTargets: TelegramTarget[];
  loadingTelegramTargets: boolean;
  onRequestBotUsername: () => void;
  onOpenAddChannel: () => void;
  onOpenAddGroup: () => void;
  onSelectTelegramTarget: (target: TelegramTarget) => void;
}) {
  const { t } = useI18n();
  const { label, color, placeholder, icon: Icon, key } = platform;
  const glow = `0 0 60px ${color}55`;
  const particles = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);

  const stats = result ? buildChannelStats(key, result, t) : [];

  useEffect(() => {
    if (key === "telegram" && !botUsername) {
      onRequestBotUsername();
    }
  }, [key, botUsername, onRequestBotUsername]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[22px] border border-white/10 bg-[#0c0c12] p-4 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[24px] sm:p-6"
          style={{ boxShadow: glow }}
        >
          <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-40 blur-3xl" style={{ background: `${color}` }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl p-3" style={{ background: `${color}22` }}>
                <Icon size={26} color="#fff" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{t("integrations.connectTitle", "Connect your channel")}: {label}</h3>
                <p className="text-xs text-white/60">{t("integrations.connectSubtitle", "Проверьте канал и сохраните подключение в пару шагов.")}</p>
              </div>
            </div>

            {key === "telegram" && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                <p className="font-semibold text-white">{t("integrations.telegramSteps", "Connect Telegram")}</p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onOpenAddChannel}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10"
                  >
                    {t("integrations.telegramMenuChannel", "Add to Channel")}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAddGroup}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10"
                  >
                    {t("integrations.telegramMenuGroup", "Add to Group")}
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-white/60">
                  {t("integrations.telegramMenuHint", "After adding the bot, select the found channel or group below, or enter @username manually.")}
                </p>
                {botInfoError ? (
                  <p className="mt-2 text-[11px] text-amber-300">
                    {mapIntegrationError(botInfoError, "telegram", t)}
                  </p>
                ) : null}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                      {t("integrations.telegramAvailableTargets", "Available targets")}
                    </p>
                    {loadingTelegramTargets ? <span className="text-[10px] text-white/40">{t("integrations.loadingSaved", "Загружаем сохранённые подключения...")}</span> : null}
                  </div>
                  {telegramTargets.length ? (
                    telegramTargets.map((target) => (
                      <button
                        key={target.chat_id}
                        type="button"
                        onClick={() => onSelectTelegramTarget(target)}
                        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left transition hover:border-white/25 hover:bg-white/10"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{target.name}</p>
                          <p className="text-[11px] text-white/50">{target.channel || target.chat_id}</p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/60">
                          {t("integrations.useTarget", "Use")}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-3 py-3 text-[11px] text-white/45">
                      {t("integrations.telegramTargetsEmpty", "Когда бот будет добавлен в канал или группу, цель появится здесь автоматически.")}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition focus:border-white/30"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onVerify}
                className="relative w-full overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-semibold"
                style={{
                  background: status === "verifying" ? `${color}66` : `${color}`,
                  boxShadow: `0 0 40px ${color}66`,
                }}
              >
                {t("integrations.verify", "Verify Channel")}
                {status === "verifying" && <span className="absolute inset-0 animate-pulse bg-white/10" />}
              </motion.button>
              {status === "verifying" && (
                <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full"
                    style={{ background: color }}
                    initial={{ x: "-60%" }}
                    animate={{ x: "120%" }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {particles.map((p) => (
                    <motion.span
                      key={p}
                      className="absolute -top-1 h-3 w-3 rounded-full"
                      style={{ background: `${color}88` }}
                      initial={{ x: 0, opacity: 0 }}
                      animate={{ x: [0, 120], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.2, delay: p * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              )}
              {status === "error" && (
                <motion.p
                  initial={{ x: -8, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-sm text-red-400"
                >
                  {errorMessage || t("integrations.errorNotFound", "Channel not found. Please check username or link")}
                </motion.p>
              )}
              {status === "success" && result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("integrations.channelFound", "Канал найден")}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-white/10">
                      {result.avatar ? (
                        <img src={result.avatar} alt={result.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/60">{result.name.slice(0, 1)}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{result.name}</p>
                      <p className="text-xs text-white/60">{result.url || t("integrations.verified", "Verified")}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/60 sm:grid-cols-3">
                    {stats.map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                        <p className="text-[10px] uppercase">{stat.label}</p>
                        <p className="text-sm text-white">{stat.value ?? "--"}</p>
                      </div>
                    ))}
                  </div>
                  {key === "telegram" && result.channel && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                      <p className="font-semibold text-white">{t("integrations.telegramConnected", "Telegram Connected")}</p>
                      <p>{t("integrations.channelLabel", "Channel")}: {result.channel}</p>
                      {result.subscribers !== null && (
                        <p>{t("integrations.subscribers", "Subscribers")}: {result.subscribers.toLocaleString()}</p>
                      )}
                    </div>
                  )}
                  <button
                    className="mt-4 w-full rounded-2xl bg-white/10 py-2 text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,178,255,0.4)]"
                    style={{ boxShadow: glow }}
                    onClick={onConfirm}
                  >
                    {t("integrations.confirm", "Confirm connection")}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SuccessModal({
  platform,
  title,
  description,
  actionLabel,
  onClose,
}: {
  platform: Platform;
  title: string;
  description: string;
  actionLabel: string;
  onClose: () => void;
}) {
  const glowColor = platform === "twitch" ? "#9146FF" : platform === "youtube" ? "#FF0000" : platform === "telegram" ? "#00B2FF" : "#F57B20";
  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  const confetti = useMemo(() => Array.from({ length: 18 }, (_, i) => i), []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-sm overflow-hidden rounded-[22px] border border-white/10 bg-[#0c0c12] p-5 text-white sm:rounded-[24px] sm:p-6"
          style={{ boxShadow: `0 0 80px ${glowColor}55` }}
        >
          <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 20%, ${glowColor}55, transparent 70%)` }} />
          {particles.map((p) => (
            <motion.span
              key={p}
              className="absolute h-2 w-2 rounded-full"
              style={{ background: glowColor, left: `${10 + p * 6}%`, top: `${15 + (p % 6) * 10}%` }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 0], y: [-4, -12, -22] }}
              transition={{ duration: 1.6, delay: p * 0.08, repeat: Infinity }}
            />
          ))}
          {confetti.map((c) => (
            <motion.span
              key={`c-${c}`}
              className="absolute h-2 w-1.5 rounded-sm"
              style={{ background: glowColor, left: `${5 + c * 5}%`, top: `${10 + (c % 6) * 8}%` }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: [0, 1, 0], y: [0, 20, 40], rotate: [0, 120, 240] }}
              transition={{ duration: 1.4, delay: c * 0.03, repeat: Infinity }}
            />
          ))}
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Sparkles size={20} /> {title}
            </div>
            <p className="mt-2 text-sm text-white/70">{description}</p>
            <Button className="mt-6 w-full hover-lift" onClick={onClose}>
              {actionLabel}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


