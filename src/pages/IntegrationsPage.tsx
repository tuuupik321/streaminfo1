import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Twitch, Youtube, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Ripple = { id: number; x: number; y: number };
type Platform = "twitch" | "youtube" | "telegram";
type PlatformConfig = { key: Platform; label: string; color: string; placeholder: string; icon: typeof Twitch };
type VerifyResult = { name: string; url: string; platform: Platform };

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
  { key: "telegram", label: "Telegram", color: "#00B2FF", placeholder: "@username", icon: Send },
];

function IntegrationCard({
  label,
  color,
  icon: Icon,
  onOpen,
}: {
  label: string;
  color: string;
  icon: typeof Twitch;
  onOpen: () => void;
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
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex h-56 w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0f] shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
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

  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;
  const initData = tg?.initData || "";

  const closeModal = () => {
    setActivePlatform(null);
    setInputValue("");
    setStatus("idle");
    setResult(null);
  };

  const verify = async () => {
    if (!inputValue.trim()) {
      setStatus("error");
      return;
    }
    if (!activePlatform || !userId) {
      setStatus("error");
      return;
    }
    setStatus("verifying");
    try {
      const response = await fetch("/api/verify_channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          platform: activePlatform.key,
          channel: inputValue.trim(),
          init_data: initData,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) {
        setStatus("error");
        return;
      }
      setResult({
        name: data.name || inputValue.trim(),
        url: data.url || "",
        platform: activePlatform.key,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[70dvh] max-w-5xl flex-col items-center justify-center px-4 py-10 md:py-16">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center text-2xl font-black font-heading md:text-4xl"
      >
        {t("integrations.title", "Интеграции")}
      </motion.h1>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        {platforms.map((platform) => (
          <IntegrationCard
            key={platform.key}
            label={platform.label}
            color={platform.color}
            icon={platform.icon}
            onOpen={() => {
              setActivePlatform(platform);
              setStatus("idle");
              setResult(null);
              setInputValue("");
            }}
          />
        ))}
      </div>

      <p className="mt-8 max-w-xl text-center text-sm text-muted-foreground">
        {t(
          "integrations.description",
          "Подключайте каналы одним касанием. Премиальные карточки с живым свечением и мягкими анимациями.",
        )}
      </p>

      {activePlatform && (
        <IntegrationModal
          platform={activePlatform}
          inputValue={inputValue}
          setInputValue={setInputValue}
          status={status}
          result={result}
          onClose={closeModal}
          onVerify={verify}
        />
      )}
    </div>
  );
}

function IntegrationModal({
  platform,
  inputValue,
  setInputValue,
  status,
  result,
  onClose,
  onVerify,
}: {
  platform: PlatformConfig;
  inputValue: string;
  setInputValue: (value: string) => void;
  status: "idle" | "verifying" | "success" | "error";
  result: VerifyResult | null;
  onClose: () => void;
  onVerify: () => void;
}) {
  const { label, color, placeholder, icon: Icon } = platform;
  const glow = `0 0 60px ${color}55`;
  const particles = useMemo(() => Array.from({ length: 6 }, (_, i) => i), []);

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
                <h3 className="text-lg font-bold">Connect your {label} channel</h3>
                <p className="text-xs text-white/60">Secure verification with premium effects.</p>
              </div>
            </div>

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
                Verify Channel
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
                  Channel not found. Please check username or link
                </motion.p>
              )}
              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10" />
                    <div>
                      <p className="text-sm font-semibold">{result?.name || `${label} channel`}</p>
                      <p className="text-xs text-white/60">{result?.url || "Verified"}</p>
                    </div>
                  </div>
                  <button
                    className="mt-4 w-full rounded-2xl bg-white/10 py-2 text-sm font-semibold"
                    style={{ boxShadow: glow }}
                  >
                    Connect channel ✔
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
