import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { useMemo } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => i);

export function ActivityMap() {
  const { t } = useI18n();

  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of days) {
      for (const hour of hours) {
        map.set(`${day}-${hour}`, Math.random() * 100);
      }
    }
    return map;
  }, []);

  const getColor = (value: number) => {
    if (value > 80) return "bg-primary/90";
    if (value > 60) return "bg-primary/70";
    if (value > 40) return "bg-primary/50";
    if (value > 20) return "bg-primary/30";
    return "bg-primary/10";
  };

  return (
    <div className="saas-card">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-4">{t("analytics.activityMap", "Activity Map")}</p>
      <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4">
        <div className="flex flex-col gap-1 text-xs text-white/50">
          {days.map((day) => (
            <div key={day} className="h-6 flex items-center">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-24 gap-1">
          {days.map((day) =>
            hours.map((hour) => {
              const value = data.get(`${day}-${hour}`) ?? 0;
              return (
                <motion.div
                  key={`${day}-${hour}`}
                  className={`h-6 w-full rounded ${getColor(value)}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (days.indexOf(day) * 24 + hour) * 0.01 }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
