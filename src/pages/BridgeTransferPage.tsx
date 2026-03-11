import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Twitch, Youtube, Link2, Megaphone, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();

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
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-4xl px-3 py-4 pb-24 sm:p-4 md:p-8">
      <motion.div variants={item} className="mb-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <CardShell className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-primary/90">
            <Link2 size={12} /> Bridge flow
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading text-gradient-primary md:text-3xl">Маршрут зрителя между платформами</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Этот экран показывает, как зритель доходит от платформы до вашего Telegram и анонса. Полезно перед запуском проверить весь путь, а не только сам эфир.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
              <p className="text-sm font-semibold text-foreground">1. Платформа</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Подключите Twitch или YouTube, чтобы видеть статус эфира и аналитику.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
              <p className="text-sm font-semibold text-foreground">2. Telegram</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Добавьте бота в канал или чат, чтобы отправлять анонсы и уведомления.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
              <p className="text-sm font-semibold text-foreground">3. Действие</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Оставьте одну понятную ссылку, которая ведёт зрителя прямо к эфиру.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="gap-2" onClick={start}>
              <Megaphone size={16} /> Запустить демо маршрута
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/integrations")}>
              <Link2 size={16} /> Открыть интеграции
            </Button>
          </div>
        </CardShell>

        <CardShell className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Следующий шаг</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Если путь до эфира кажется длинным, начните с платформы и Telegram. После этого анонс и ссылка начнут реально работать как единый сценарий.
          </p>
        </CardShell>
      </motion.div>

      <motion.div variants={item}>
        <CardShell className="relative overflow-hidden p-6">
          <h2 className="mb-2 text-xl font-bold text-foreground">Демо перехода Twitch → Telegram → эфир</h2>
          <p className="mb-6 text-sm text-muted-foreground">Наглядно показывает, как один анонс и одна ссылка проводят зрителя дальше.</p>

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
                <span className="text-gradient-primary text-sm font-bold [background-size:200%_100%] animate-[shimmer_1.2s_linear_infinite]">Зритель дошёл до эфира</span>
              </motion.div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={start} className="gap-2">
              Повторить демо <ArrowRight size={14} />
            </Button>
            <Button type="button" onClick={() => navigate("/announcements")} className="gap-2">
              Подготовить анонс <Megaphone size={14} />
            </Button>
          </div>
        </CardShell>
      </motion.div>
    </motion.div>
  );
}
