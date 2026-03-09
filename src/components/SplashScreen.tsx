import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";

interface SplashScreenProps {
  show: boolean;
}

export function SplashScreen({ show }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background overflow-hidden"
        >
          {/* Radial glow layers */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 0.12 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
          />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.06 }}
            transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
            className="absolute w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(290 70% 55%) 0%, transparent 70%)' }}
          />

          {/* Dot pattern */}
          <div className="absolute inset-0 pattern-dots opacity-30" />

          <div className="relative flex flex-col items-center gap-5">
            {/* Logo */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10 overflow-hidden"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Activity size={34} className="text-white relative z-10" />
                <div className="absolute inset-0 opacity-20 animate-glow-pulse" style={{ background: 'hsl(0 0% 100%)' }} />
              </motion.div>
              
              {/* Pulse rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
                  className="absolute inset-0 rounded-2xl"
                  style={{ border: '1px solid hsl(var(--primary) / 0.25)' }}
                />
              ))}
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <h1 className="text-3xl font-black font-heading tracking-tight">
                <span className="text-gradient-primary">Stream</span>
                <span className="text-foreground">Info</span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-muted-foreground font-mono mt-1.5 tracking-wide"
              >
                управление стримами
              </motion.p>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="w-32 h-[3px] rounded-full overflow-hidden mt-2"
              style={{ background: 'hsl(var(--muted))' }}
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                className="w-1/2 h-full rounded-full"
                style={{ background: 'var(--gradient-primary)' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
