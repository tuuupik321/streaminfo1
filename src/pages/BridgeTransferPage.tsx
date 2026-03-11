import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Twitch, Youtube } from "lucide-react";
import { makeFadeUp, makeStagger } from "@/shared/motion";
import { CardShell } from "@/shared/ui/CardShell";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      HapticFeedback?: {
        notificationOccurred?: (kind: "error" | "success" | "warning") => void;
        impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
      };
    };
  };
};

export default function BridgeTransferPage() {
  const [running, setRunning] = useState(false);
  const [arrived, setArrived] = useState(false);
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  const tgHaptic = (window as TelegramWindow).Telegram?.WebApp?.HapticFeedback;
  const packets = useMemo(() => Array.from({ length: 10 }).map((_, i) => i), []);

  const start = () => {
    setArrived(false);
    setRunning(true);
    tgHaptic?.notificationOccurred?.("success");
    tgHaptic?.impactOccurred?.("light");

    const pulse = window.setInterval(() => tgHaptic?.impactOccurred?.("soft"), 220);
    window.setTimeout(() => {
      window.clearInterval(pulse);
      setRunning(false);
      setArrived(true);
      tgHaptic?.impactOccurred?.("medium");
    }, 2600);
  };

  useEffect(() => {
    return () => {
      setRunning(false);
    };
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-4xl px-4 py-8">
      <motion.div variants={item}>
        <CardShell className="relative overflow-hidden p-6">
          <h1 className="mb-2 text-xl font-bold text-white">Cross-Platform Bridge</h1>
          <p className="mb-6 text-sm text-white/60">Twitch to YouTube data transfer simulation</p>

          <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-black">
            <div className="absolute left-8 top-1/2 -translate-y-1/2">
              <div className="rounded-xl border border-[#9146ff]/40 bg-black p-3 text-[#9146ff]">
                <Twitch size={28} />
              </div>
            </div>

            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className={`rounded-xl border p-3 transition-all duration-300 ${arrived ? "border-red-500 bg-red-500/20 text-red-400" : "border-red-500/40 bg-black text-red-500"}`}>
                <Youtube size={28} />
              </div>
            </div>

            <div className="absolute left-24 right-24 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[#9146ff] via-white/70 to-red-500" />

            {running && packets.map((packet) => (
              <motion.span
                key={packet}
                className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]"
                initial={{ left: 96, opacity: 0 }}
                animate={{ left: "calc(100% - 108px)", opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1, delay: packet * 0.14, repeat: 1 }}
              />
            ))}

            {arrived && (
              <motion.div
                initial={{ opacity: 0, y: 8, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                className="absolute right-24 top-12 rounded-xl border border-white/15 bg-black/70 px-3 py-2 backdrop-blur"
              >
                <span className="text-gradient-primary text-sm font-bold [background-size:200%_100%] animate-[shimmer_1.2s_linear_infinite]">StreamInfo</span>
              </motion.div>
            )}
          </div>

          <button
            type="button"
            onClick={start}
            className="mt-5 rounded-xl border border-white/30 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white uppercase transition-all hover:bg-white hover:text-black"
          >
            Start Transfer
          </button>
        </CardShell>
      </motion.div>
    </motion.div>
  );
}
