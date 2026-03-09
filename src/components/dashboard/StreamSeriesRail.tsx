import { useMemo } from "react";
import { motion } from "framer-motion";
import { Twitch, Youtube } from "lucide-react";
import type { DataPoint } from "@/components/dashboard/ViewerChart";
import { useI18n } from "@/lib/i18n";

type StreamSeriesRailProps = {
  data?: DataPoint[];
};

type SeriesItem = {
  id: string;
  title: string;
  viewers: number;
  time: string;
  platform: "twitch" | "youtube";
  skin: string;
};

const skins = [
  "from-fuchsia-500/45 via-violet-500/25 to-primary/10",
  "from-cyan-500/45 via-blue-500/25 to-primary/10",
  "from-emerald-500/45 via-teal-500/25 to-primary/10",
  "from-orange-500/45 via-amber-500/25 to-primary/10",
  "from-rose-500/45 via-pink-500/25 to-primary/10",
];

function skinBySeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 33 + seed.charCodeAt(i)) | 0;
  return skins[Math.abs(hash) % skins.length];
}

export function StreamSeriesRail({ data = [] }: StreamSeriesRailProps) {
  const { language } = useI18n();
  const copy = {
    ru: { title: "Серии стрима", cards: "карточек", series: "Серия", viewers: "зрителей" },
    en: { title: "Stream series", cards: "cards", series: "Series", viewers: "viewers" },
    uk: { title: "Серії стріму", cards: "карток", series: "Серія", viewers: "глядачів" },
  }[language];

  const series = useMemo<SeriesItem[]>(() => {
    const source = data.length > 0 ? data : [{ time: "20:00", viewers: 0, event: null }];
    return source
      .slice(-12)
      .reverse()
      .map((point, idx) => {
        const platform: "twitch" | "youtube" = idx % 2 === 0 ? "twitch" : "youtube";
        const id = `${point.time}-${idx}`;
        return {
          id,
          title: `${copy.series} #${String(idx + 1).padStart(2, "0")}`,
          viewers: point.viewers,
          time: point.time,
          platform,
          skin: skinBySeed(id),
        };
      });
  }, [copy.series, data]);

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold font-heading">{copy.title}</h3>
        <span className="text-xs font-mono text-muted-foreground">{series.length} {copy.cards}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {series.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`relative min-w-[175px] overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${item.skin} p-3`}
          >
            <div className="mb-6 flex items-start justify-between gap-2">
              <span className="rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[10px] font-mono">
                {item.time}
              </span>
              <span className="rounded-full border border-border/60 bg-background/50 p-1">
                {item.platform === "twitch" ? <Twitch size={12} /> : <Youtube size={12} />}
              </span>
            </div>
            <p className="text-sm font-semibold font-heading">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.viewers.toLocaleString()} {copy.viewers}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
