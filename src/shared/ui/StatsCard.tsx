import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | null | undefined;
  delay?: number;
  loading?: boolean;
  suffix?: string;
  className?: string;
}

export function StatsCard({ icon: Icon, label, value, delay = 0, loading, suffix, className }: StatsCardProps) {
  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { delay, duration: 0.4, ease: "easeOut" } },
  };

  const hoverVariants = {
    hover: { scale: 1.05, y: -5, boxShadow: "0 10px 20px -5px hsla(var(--primary) / 0.1), 0 4px 6px -2px hsla(var(--primary) / 0.05)" },
  };

  if (loading) {
    return <div className="h-32 rounded-2xl bg-secondary/50 shimmer" />;
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className={`relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-sm ${className}`}
    >
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon size={16} className="text-primary" />
        </div>
        <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <div className="mt-4 text-3xl font-bold font-heading text-foreground">
        {value != null ? (
          <>
            <AnimatedCounter from={0} to={value} />
            {suffix && <span className="ml-1 text-xl text-muted-foreground">{suffix}</span>}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    </motion.div>
  );
}
