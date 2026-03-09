import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-12 text-center"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Icon size={32} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold font-heading">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
