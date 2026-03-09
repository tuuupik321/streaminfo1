import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Target, Star, Clock } from "lucide-react";

interface Achievement {
  icon: React.ElementType;
  title: string;
  description: string;
  progress: number; // 0-100
  unlocked: boolean;
}

const achievements: Achievement[] = [
  { icon: Zap, title: "Первые 1 000 кликов", description: "Набрать 1 000 кликов", progress: 100, unlocked: true },
  { icon: Flame, title: "Горячий стрим", description: "500+ зрителей одновременно", progress: 100, unlocked: true },
  { icon: Target, title: "Снайпер", description: "Набрать 10 000 кликов", progress: 84, unlocked: false },
  { icon: Clock, title: "Марафонец", description: "10 часов стримов за неделю", progress: 67, unlocked: false },
  { icon: Star, title: "Звёздный час", description: "1 000 зрителей одновременно", progress: 45, unlocked: false },
  { icon: Trophy, title: "Легенда", description: "100 000 кликов за всё время", progress: 12, unlocked: false },
];

export function AchievementsBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={20} className="text-primary" />
        <h3 className="text-lg font-bold font-heading">Достижения</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            className={`rounded-xl border p-3 relative overflow-hidden transition-colors ${
              a.unlocked
                ? "bg-primary/5 border-primary/30"
                : "bg-secondary/30 border-border/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                a.unlocked ? "bg-primary/20" : "bg-muted"
              }`}>
                <a.icon size={16} className={a.unlocked ? "text-primary" : "text-muted-foreground"} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold font-heading truncate ${a.unlocked ? "text-foreground" : "text-muted-foreground"}`}>{a.title}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{a.description}</p>
            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${a.progress}%` }}
                transition={{ delay: 0.8 + i * 0.05, duration: 0.6 }}
                className={`h-full rounded-full ${a.unlocked ? "bg-primary" : "bg-primary/50"}`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">{a.progress}%</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
