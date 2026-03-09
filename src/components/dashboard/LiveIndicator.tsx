import { motion } from "framer-motion";

interface LiveIndicatorProps {
  isLive: boolean;
}

export function LiveIndicator({ isLive }: LiveIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 rounded-full px-4 py-1.5 border ${
        isLive
          ? "bg-destructive/10 border-destructive/30"
          : "bg-muted/40 border-border"
      }`}
    >
      <span className="relative flex h-3 w-3">
        {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />}
        <span
          className={`relative inline-flex rounded-full h-3 w-3 ${
            isLive ? "bg-destructive" : "bg-muted-foreground"
          }`}
        />
      </span>
      <span
        className={`text-sm font-bold font-mono tracking-wider ${
          isLive ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {isLive ? "LIVE" : "OFFLINE"}
      </span>
    </motion.div>
  );
}
