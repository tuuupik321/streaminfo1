import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  color?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction, color }: EmptyStateProps) {
  const iconColor = color || "hsl(var(--primary))";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.1 }}
        className="relative mb-5"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon size={28} style={{ color: iconColor }} />
        </div>
        {/* Subtle floating particles */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [-4, 4, -4],
              x: [i === 0 ? -3 : i === 1 ? 3 : 0, i === 0 ? 3 : i === 1 ? -3 : 0, i === 0 ? -3 : i === 1 ? 3 : 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: iconColor,
              top: i === 0 ? -4 : i === 1 ? "50%" : "auto",
              bottom: i === 2 ? -4 : "auto",
              left: i === 0 ? "30%" : i === 2 ? "70%" : "auto",
              right: i === 1 ? -6 : "auto",
            }}
          />
        ))}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-bold font-heading mb-1.5"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground font-mono max-w-xs leading-relaxed mb-5"
      >
        {description}
      </motion.p>

      {actionLabel && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {actionTo ? (
            <Link to={actionTo}>
              <Button variant="default" size="sm" className="font-mono text-sm gap-1.5">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="default" size="sm" className="font-mono text-sm gap-1.5" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
