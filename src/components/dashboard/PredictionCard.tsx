import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp } from "lucide-react";
import type { DataPoint } from "@/components/dashboard/ViewerChart";
import { useI18n } from "@/lib/i18n";

type PredictionCardProps = {
  data?: DataPoint[];
  liveViewers?: number;
  isLive?: boolean;
};

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function PredictionCard({ data = [], liveViewers = 0, isLive = false }: PredictionCardProps) {
  const { language } = useI18n();

  const copy = {
    ru: { title: "Прогноз на сегодня", live: "LIVE", expectedPeak: "Ожидаемый пик", bestSlot: "Лучший слот", confidence: "Уверенность" },
    en: { title: "Today forecast", live: "LIVE", expectedPeak: "Expected peak", bestSlot: "Best time slot", confidence: "Confidence" },
    uk: { title: "Прогноз на сьогодні", live: "LIVE", expectedPeak: "Очікуваний пік", bestSlot: "Найкращий слот", confidence: "Впевненість" },
  }[language];

  const prediction = useMemo(() => {
    const viewers = data.map((point) => point.viewers).filter((value) => Number.isFinite(value) && value >= 0);
    const peak = viewers.length > 0 ? Math.max(...viewers) : 0;
    const avg = viewers.length > 0 ? viewers.reduce((a, b) => a + b, 0) / viewers.length : 0;
    const med = median(viewers);

    const predictedPeak = Math.max(Math.round((peak * 0.45 + avg * 0.35 + med * 0.2) * 1.08), liveViewers, 0);

    const topHours = data
      .slice()
      .sort((a, b) => b.viewers - a.viewers)
      .slice(0, 3)
      .map((point) => Number(point.time.slice(0, 2)))
      .filter((value) => Number.isFinite(value));

    const bestHour =
      topHours.length > 0
        ? Math.round(topHours.reduce((sum, hour) => sum + hour, 0) / topHours.length)
        : 20;

    const bestEnd = (bestHour + 2) % 24;
    const bestTime = `${String(bestHour).padStart(2, "0")}:00-${String(bestEnd).padStart(2, "0")}:00`;

    const confidenceBase = viewers.length >= 8 ? 72 : viewers.length >= 4 ? 60 : 45;
    const confidenceLiveBonus = isLive ? 8 : 0;
    const confidenceRangePenalty = peak > 0 ? Math.min(12, Math.round((peak - med) / Math.max(peak, 1) * 20)) : 0;
    const confidence = Math.max(35, Math.min(95, confidenceBase + confidenceLiveBonus - confidenceRangePenalty));

    return { predictedPeak, bestTime, confidence };
  }, [data, liveViewers, isLive]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="linear-card card-glow relative overflow-hidden p-6"
    >
      <div className="absolute right-3 top-3 opacity-[0.07]">
        <Brain size={56} />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <Brain size={20} className="text-primary" />
        <h3 className="text-lg font-bold font-heading">{copy.title}</h3>
        {isLive && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-mono text-primary">{copy.live}</span>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="linear-card p-4 text-center">
          <TrendingUp size={18} className="mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold font-heading text-foreground">{prediction.predictedPeak.toLocaleString()}</p>
          <p className="text-xs font-mono text-muted-foreground">{copy.expectedPeak}</p>
        </div>
        <div className="linear-card p-4 text-center">
          <p className="text-lg font-bold font-heading text-foreground">{prediction.bestTime}</p>
          <p className="mt-1 text-xs font-mono text-muted-foreground">{copy.bestSlot}</p>
        </div>
        <div className="linear-card p-4 text-center">
          <p className="text-2xl font-bold font-heading text-primary">{prediction.confidence}%</p>
          <p className="text-xs font-mono text-muted-foreground">{copy.confidence}</p>
        </div>
      </div>
    </motion.div>
  );
}
