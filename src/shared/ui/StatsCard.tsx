import { motion, useSpring, useTransform, animate } from "framer-motion";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useEffect, useRef } from "react";

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString(),
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest;
      }
    });
    return unsubscribe;
  }, [display]);

  return (
    <h2 className="mt-0.5 text-2xl font-bold font-heading text-foreground sm:mt-1 sm:text-4xl">
      <span ref={ref} />
      {suffix && <span className="ml-1 text-lg sm:text-2xl">{suffix}</span>}
    </h2>
  );
}

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  delay?: number;
  change?: number;
  loading?: boolean;
  suffix?: string;
}

export function StatsCard({ icon: Icon, label, value, delay = 0, change, loading, suffix }: StatsCardProps) {
  const { t } = useI18n();
  
  const vsPrev = t("statsCard.vsPrev", "vs previous stream");

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border/10 bg-background/60 p-3 backdrop-blur-lg sm:p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-5 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      className="card-glow group relative overflow-hidden rounded-2xl border border-border/10 bg-background/60 p-3 backdrop-blur-lg sm:p-6"
    >
      <div className="absolute right-2 top-2 opacity-[0.07] transition-opacity group-hover:opacity-[0.12] sm:right-3 sm:top-3">
        <Icon size={40} className="sm:h-14 sm:w-14" />
      </div>
      <Icon className="mb-2 text-primary sm:mb-3" size={18} />
      <p className="text-[10px] font-mono font-semibold uppercase leading-tight tracking-wider text-muted-foreground sm:text-xs">{label}</p>
      <AnimatedNumber value={value} suffix={suffix} />
      {change !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.4 }}
          className={`mt-2 flex items-center gap-1 text-xs font-mono font-semibold ${
            change >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"
          }`}
        >
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{change >= 0 ? "+" : ""}{change}% {vsPrev}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
