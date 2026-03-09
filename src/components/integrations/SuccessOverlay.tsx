import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

interface SuccessOverlayProps {
  show: boolean;
  onDone: () => void;
  message?: string;
  color?: string;
  duration?: number;
}

const particles = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 360;
  const rad = (angle * Math.PI) / 180;
  const dist = 50 + Math.random() * 30;
  return {
    x: Math.cos(rad) * dist,
    y: Math.sin(rad) * dist,
    rotate: Math.random() * 360,
    scale: 0.4 + Math.random() * 0.6,
    delay: Math.random() * 0.15,
    color: ["hsl(var(--primary))", "hsl(var(--success))", "hsl(264 80% 75%)", "hsl(38 92% 60%)"][i % 4],
  };
});

export default function SuccessOverlay({ show, onDone, message = "Готово!", color, duration = 1800 }: SuccessOverlayProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, duration);
      return () => clearTimeout(t);
    }
  }, [show, onDone, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl"
        >
          {/* Confetti particles */}
          {particles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: [0, p.scale, 0],
                opacity: [0, 1, 0],
                rotate: p.rotate,
              }}
              transition={{ duration: 0.7, delay: 0.1 + p.delay, ease: "easeOut" }}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
          ))}

          {/* Check icon */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.05 }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color ? `${color}20` : "hsl(var(--success) / 0.15)" }}
            >
              <CheckCircle2
                size={36}
                style={{ color: color || "hsl(var(--success))" }}
              />
            </div>
          </motion.div>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 font-semibold text-sm"
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
