import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// ... (keep all other types and components like EventDot, CustomCursor, etc. the same)
type EventType = "tg" | "donate" | "start" | "end" | null;

export interface DataPoint {
  time: string;
  viewers: number;
  clicks?: number;
  donations?: number;
  event: EventType;
  eventLabel?: string;
}

const eventIcons: Record<string, string> = {
  tg: "📨",
  donate: "💰",
  start: "🟢",
  end: "🔴",
};

const eventColors: Record<string, string> = {
  tg: "hsl(var(--primary))",
  donate: "hsl(var(--warning))",
  start: "hsl(var(--success))",
  end: "hsl(var(--destructive))",
};

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: DataPoint;
}

function EventDot({ cx, cy, payload }: CustomDotProps) {
  if (!cx || !cy || !payload || !payload.event) return null;
  const color = eventColors[payload.event] || "hsl(var(--primary))";
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={color} fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="hsl(var(--card))" strokeWidth={2} />
    </g>
  );
}

function CustomCursor({ points, height }: { points?: { x: number; y: number }[]; height?: number }) {
  if (!points || !points[0]) return null;
  return (
    <line
      x1={points[0].x} y1={0} x2={points[0].x} y2={height || 0}
      stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="4 4" strokeOpacity={0.5}
    />
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: DataPoint }>; label?: string }) {
  const { t } = useI18n();
  if (!active || !payload?.[0]) return null;
  const data: DataPoint = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card/80 px-4 py-3 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-mono text-muted-foreground">🕐 {label}</p>
      <p className="text-lg font-bold font-heading text-foreground">
        {data.viewers.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{t("chart.viewers", "зрителей")}</span>
      </p>
      {data.event && (
        <div className="mt-1.5 flex items-center gap-1.5 border-t border-border pt-1.5">
          <span className="text-xs">{eventIcons[data.event]}</span>
          <span className="text-xs font-mono font-semibold text-primary">{data.eventLabel}</span>
        </div>
      )}
    </div>
  );
}

interface ViewerChartProps {
  loading?: boolean;
  data?: DataPoint[];
}

export function ViewerChart({ loading, data }: ViewerChartProps) {
  const { t } = useI18n();
  const hasData = data && data.length > 1;

  if (loading) {
    return <div className="h-80 rounded-2xl bg-secondary/50 shimmer" />;
  }

  if (!hasData) {
    return (
      <div className="flex h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/30 bg-secondary/30 text-center">
        <BarChart2 size={32} className="mb-4 text-muted-foreground/50" />
        <h4 className="font-bold font-heading text-foreground">{t("chart.noDataTitle", "Нет данных для графика")}</h4>
        <p className="text-sm text-muted-foreground">{t("chart.noDataSubtitle", "Начните стрим, чтобы собрать статистику.")}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="h-80"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="viewerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={<CustomCursor />} />
          <Area
            type="monotone"
            dataKey="viewers"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#viewerGradient)"
            dot={<EventDot />}
            activeDot={{ r: 6, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--background))', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
