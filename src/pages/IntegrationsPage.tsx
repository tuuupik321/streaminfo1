import { useState } from "react";
import { motion } from "framer-motion";
import { Twitch, Youtube } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Ripple = { id: number; x: number; y: number };

function IntegrationCard({
  label,
  color,
  icon: Icon,
}: {
  label: string;
  color: string;
  icon: typeof Twitch;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
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
      onClick={onClick}
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

  return (
    <div className="relative mx-auto flex min-h-[70dvh] max-w-5xl flex-col items-center justify-center px-4 py-10 md:py-16">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center text-2xl font-black font-heading md:text-4xl"
      >
        {t("integrations.title", "Интеграции")}
      </motion.h1>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <IntegrationCard label="Twitch" color="#9146FF" icon={Twitch} />
        <IntegrationCard label="YouTube" color="#FF0000" icon={Youtube} />
      </div>

      <p className="mt-8 max-w-xl text-center text-sm text-muted-foreground">
        {t(
          "integrations.description",
          "Подключайте каналы одним касанием. Премиальные карточки с живым свечением и мягкими анимациями.",
        )}
      </p>
    </div>
  );
}
