import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Twitch, Youtube, Send, Heart, Sparkles, Flame } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { makeFadeUp, makeStagger } from "@/shared/motion";

type Ripple = { id: number; x: number; y: number };
type Platform = "twitch" | "youtube" | "telegram" | "donatealerts" | "kick";

type PlatformConfig = {
  key: Platform;
  label: string;
  color: string;
  placeholder: string;
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

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: { id?: number } };
    };
  };
};

const platforms: PlatformConfig[] = [
  { key: "twitch", label: "Twitch", color: "#9146FF", placeholder: "https://twitch.tv/username", icon: Twitch },
  { key: "youtube", label: "YouTube", color: "#FF0000", placeholder: "https://youtube.com/@channel", icon: Youtube },
  { key: "telegram", label: "Telegram", color: "#00B2FF", placeholder: "@channel", icon: Send },
  { key: "donatealerts", label: "DonateAlerts", color: "#F57B20", placeholder: "https://donationalerts.com/r/username", icon: Heart },
  { key: "kick", label: "Kick", color: "#53FC18", placeholder: "https://kick.com/username", icon: Flame },
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

function IntegrationCard({
  label,
  color,
  icon: Icon,
  onOpen,
  connected,
  connectedLabel,
}: {
  label: string;
  color: string;
  icon: typeof Twitch;
  onOpen: () => void;
  connected?: boolean;
  connectedLabel: string;
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
        handleRipple(event);
        onOpen();
      }}
      whileHover={{ y: -4, scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex h-56 w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0f] shadow-[0_18px_50px_rgba(0,0,0,0.35)] hover-lift"
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

      <motion.div
        className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl"
        animate={{ x: [0, 1.5, 0, -1.5, 0], y: [0, -1.5, 0, 1.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={54} color="#ffffff" />
      </motion.div>

      {connected && (
        <div className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 shadow-[0_0_18px_rgba(0,178,255,0.5)]">
          {connectedLabel}
        </div>
      )}

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

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-mono uppercase tracking-[0.3em] text-white/70">
        {label}
      </div>

      <div
        className="absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `0 0 60px ${color}55` }}
      />
    </motion.button>
  );
}

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

  const openTelegramLink = (url: string) => {
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
      return;
    }
    window.open(url, "_blank");
  };

  const fetchBotUsername = async () => {
    try {
      const res = await fetch("/api/bot_info");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.username) {
        setBotUsername(data.username);
        return;
      }
    } catch {
      // ignore
    }
    setBotUsername(null);
  };

  const closeModal = () => {
    setActivePlatform(null);
    setInputValue("");
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  };

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
        return {
          name: data.name || data.channel_name || channel,
          url: data.url || data.channel_url || "",
          platform,
          avatar: data.avatar || null,
          followers: data.followers ?? null,
          subscribers: data.subscribers ?? null,
          videos: data.videos ?? null,
          views: data.views ?? null,
          channel: data.channel || null,
        } as VerifyResult;
      }
    } catch {
      // ignore
    }
    return {
      name: channel,
      url: "",
      platform,
    } as VerifyResult;
  }, [userId, initData]);

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
        if (Object.keys(next).length) {
          setConnected((prev) => ({ ...prev, ...next }));
        }
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSaved();
  }, [userId, initData, hydrateConnection]);

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
        setErrorMessage(t("integrations.errorNotFound", "Channel not found. Please check username or link"));
        return;
      }
      setResult({
        name: data.name || data.channel_name || inputValue.trim(),
        url: data.url || data.channel_url || "",
        platform: activePlatform.key,
        avatar: data.avatar || null,
        followers: data.followers ?? null,
        subscribers: data.subscribers ?? null,
        videos: data.videos ?? null,
        views: data.views ?? null,
        channel: data.channel || null,
      });
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(t("integrations.errorNotFound", "Channel not found. Please check username or link"));
    }
  };

  const openAddChannel = () => {
    if (!botUsername) {
      setErrorMessage(t("integrations.errorBotUsername", "Bot username is not available"));
      return;
    }
    openTelegramLink(`https://t.me/${botUsername}?startchannel=true&admin=post_messages`);
  };

  const openAddGroup = () => {
    if (!botUsername) {
      setErrorMessage(t("integrations.errorBotUsername", "Bot username is not available"));
      return;
    }
    openTelegramLink(`https://t.me/${botUsername}?startgroup=true`);
  };

  const confirmConnection = async () => {
    if (!result) return;
    if (userId && initData) {
      if (result.platform === "twitch") {
        const twitchLogin = extractHandle(result.url || result.name);
        await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, twitch_name: twitchLogin, init_data: initData }),
        });
      }
      if (result.platform === "youtube") {
        const youtubeIdOrHandle = extractHandle(result.url || result.name);
        await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, yt_channel_id: youtubeIdOrHandle, init_data: initData }),
        });
      }
      if (result.platform === "donatealerts") {
        const donatealertsName = extractHandle(result.url || result.name);
        await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, donationalerts_name: donatealertsName, init_data: initData }),
        });
      }
      if (result.platform === "telegram") {
        const channel = extractHandle(result.channel || result.name);
        await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, telegram_channel: channel.startsWith("@") ? channel : `@${channel}`, init_data: initData }),
        });
      }
      if (result.platform === "kick") {
        const kickName = extractHandle(result.url || result.name);
        await fetch("/api/save_settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, kick_name: kickName, init_data: initData }),
        });
      }
    }
    setConnected((prev) => ({ ...prev, [result.platform]: result }));
    setSuccessData(result);
    setShowSuccess(true);
    closeModal();
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="relative mx-auto flex min-h-[70dvh] max-w-5xl flex-col items-center justify-center px-3 py-6 md:py-10">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center text-xl font-black font-heading md:text-2xl"
      >
        {t("integrations.title", "Integrations")}
      </motion.h1>

      <motion.div variants={item} className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {platforms.map((platform) => (
          <IntegrationCard
            key={platform.key}
            label={platform.label}
            color={platform.color}
            icon={platform.icon}
            connected={Boolean(connected[platform.key])}
            connectedLabel={t("integrations.connected", "Connected")}
            onOpen={() => {
              setActivePlatform(platform);
              setStatus("idle");
              setResult(null);
              setInputValue("");
              setErrorMessage(null);
            }}
          />
        ))}
      </motion.div>

      <motion.p variants={item} className="mt-8 max-w-xl text-center text-sm text-muted-foreground">
        {t(
          "integrations.description",
          "Connect channels in one tap. Premium cards with liquid glow and floating motion.",
        )}
      </motion.p>
      {loadingSaved && (
        <p className="mt-2 text-xs text-white/50">{t("integrations.loadingSaved", "Loading saved connections...")}</p>
      )}

      {Object.values(connected).some(Boolean) && (
        <motion.div variants={item} className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          {Object.entries(connected).map(([key, value]) =>
            value ? (
              <div key={key} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white/10">
                    {value.avatar ? (
                      <img src={value.avatar} alt={value.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/60">{value.name.slice(0, 1)}</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t("integrations.connected", "Connected")} | {platformLabels[value.platform]}</p>
                    <p className="text-xs text-white/60">{value.channel || value.name}</p>
                  </div>
                </div>
                {buildChannelStats(value.platform, value, t).map((stat) => (
                  <p key={stat.label} className="mt-2 text-xs text-white/60">{stat.label}: {stat.value ?? "--"}</p>
                ))}
                {value.platform === "twitch" && (
                  <p className="mt-2 text-xs text-white/50">{t("integrations.lastStream", "Last stream")}: 2h ago</p>
                )}
                {value.platform === "youtube" && (
                  <p className="mt-2 text-xs text-white/50">{t("integrations.lastVideo", "Last video")}: 1 day ago</p>
                )}
                {value.platform === "telegram" && (
                  <p className="mt-2 text-xs text-white/50">{t("integrations.members", "Members")}: {value.subscribers ?? "--"}</p>
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const config = platforms.find((p) => p.key === value.platform);
                      if (!config) return;
                      setActivePlatform(config);
                      setInputValue(value.url || value.channel || value.name);
                      setStatus("idle");
                      setResult(null);
                      setErrorMessage(null);
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
          onRequestBotUsername={fetchBotUsername}
          onOpenAddChannel={openAddChannel}
          onOpenAddGroup={openAddGroup}
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
}

function IntegrationModal({
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
  onRequestBotUsername,
  onOpenAddChannel,
  onOpenAddGroup,
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
  onRequestBotUsername: () => void;
  onOpenAddChannel: () => void;
  onOpenAddGroup: () => void;
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
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
          className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-[#0c0c12] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
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
                <p className="text-xs text-white/60">{t("integrations.connectSubtitle", "Secure verification with premium effects.")}</p>
              </div>
            </div>

            {key === "telegram" && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
                <p className="font-semibold text-white">{t("integrations.telegramSteps", "Connect Telegram")}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
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
                  {t("integrations.telegramMenuHint", "After adding the bot, enter @channel or @chat username below.")}
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-white/30"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onVerify}
                className="relative w-full overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold"
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
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("integrations.channelFound", "Channel Found")}</p>
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
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/60">
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
          className="relative w-full max-w-sm overflow-hidden rounded-[24px] border border-white/10 bg-[#0c0c12] p-6 text-white"
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
