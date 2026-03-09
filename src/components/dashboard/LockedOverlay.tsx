import { motion } from "framer-motion";
import { Lock, Puzzle, Twitch, Youtube, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const floatingVariants = {
  animate: (i: number) => ({
    y: [0, -8, 0],
    rotate: [0, i % 2 === 0 ? 5 : -5, 0],
    transition: {
      duration: 3 + i * 0.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: i * 0.3,
    },
  }),
};

const COPY = {
  ru: {
    title: "Подключите платформу",
    description: "Привяжите Twitch или YouTube, чтобы разблокировать статистику, графики и аналитику в реальном времени.",
    cta: "Перейти в интеграции",
    hint: "Достаточно привязать одну платформу",
  },
  en: {
    title: "Connect a platform",
    description: "Link Twitch or YouTube to unlock live stats, charts, and analytics.",
    cta: "Go to integrations",
    hint: "Linking one platform is enough",
  },
  uk: {
    title: "Підключіть платформу",
    description: "Прив’яжіть Twitch або YouTube, щоб розблокувати статистику, графіки та аналітику в реальному часі.",
    cta: "Перейти в інтеграції",
    hint: "Достатньо прив’язати одну платформу",
  },
};

export function LockedOverlay() {
  const { language } = useI18n();
  const t = COPY[language];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="pointer-events-none select-none" aria-hidden>
        <div className="mb-5 grid grid-cols-2 gap-2.5 blur-[6px] opacity-30 sm:grid-cols-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card p-4" />
          ))}
        </div>
        <div className="mb-5 h-72 rounded-2xl border border-border bg-card p-6 opacity-30 blur-[6px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring" as const, stiffness: 260, damping: 22, delay: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="mx-4 max-w-md rounded-2xl border border-border bg-card/95 p-6 text-center shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-10">
          <div className="mb-6 flex items-center justify-center gap-6">
            <motion.div custom={0} variants={floatingVariants} animate="animate">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#9146FF]/20 bg-[#9146FF]/10">
                <Twitch size={22} className="text-[#9146FF]" />
              </div>
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 20, delay: 0.4 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
                <Lock size={24} className="text-primary" />
              </div>
            </motion.div>
            <motion.div custom={1} variants={floatingVariants} animate="animate">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF0000]/20 bg-[#FF0000]/10">
                <Youtube size={22} className="text-[#FF0000]" />
              </div>
            </motion.div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-2 text-xl font-black font-heading sm:text-2xl"
          >
            {t.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 text-sm font-mono leading-relaxed text-muted-foreground"
          >
            {t.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/integrations">
              <Button size="lg" className="group gap-2 text-sm font-mono glow-primary">
                <Puzzle size={16} />
                {t.cta}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 text-[11px] font-mono text-muted-foreground/60"
          >
            {t.hint}
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
