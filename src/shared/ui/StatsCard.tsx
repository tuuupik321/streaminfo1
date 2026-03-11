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
    initial: { opacity: 0, y: 18, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { delay, duration: 0.34, ease: "easeOut" } },
  };

  if (loading) {
    return <div className="h-28 rounded-[22px] bg-secondary/50 shimmer sm:h-32 sm:rounded-[26px]" />;
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative overflow-hidden rounded-[22px] border border-border/55 bg-card/92 p-3.5 shadow-[0_14px_30px_hsla(var(--shadow)/0.2)] sm:rounded-[26px] sm:p-4 sm:shadow-[0_18px_42px_hsla(var(--shadow)/0.22)] ${className}`}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-white/10" />
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-primary/8 blur-2xl sm:h-20 sm:w-20" />
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[1rem] bg-primary/10 text-primary sm:h-9 sm:w-9 sm:rounded-2xl">
          <Icon size={16} />
        </div>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">{label}</p>
      </div>
      <div className="mt-3 text-[1.7rem] font-bold font-heading leading-none text-foreground sm:mt-4 sm:text-[2rem]">
        {value != null ? (
          <>
            <AnimatedCounter from={0} to={value} />
            {suffix && <span className="ml-1 text-lg text-muted-foreground">{suffix}</span>}
          </>
        ) : (
          <span className="text-muted-foreground">--</span>
        )}
      </div>
    </motion.div>
  );
}
