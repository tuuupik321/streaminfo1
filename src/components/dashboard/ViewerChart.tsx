import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/lib/i18n";

type EventType = "tg" | "donate" | "start" | "end" | null;

export interface DataPoint {
  time: string;
  viewers: number;
  clicks?: number;
  donations?: number;
  event: EventType;
  eventLabel?: string;
}

const defaultData: DataPoint[] = [
  { time: "00:00", viewers: 0, event: null },
  { time: "06:00", viewers: 0, event: null },
  { time: "12:00", viewers: 0, event: null },
  { time: "18:00", viewers: 0, event: null },
  { time: "23:59", viewers: 0, event: null },
];

const eventIcons: Record<string, string> = {
  tg: "📨",
  donate: "💰",
  start: "🟢",
  end: "🔴",
};

const eventColors: Record<string, string> = {
  tg: "hsl(264, 67%, 63%)",
  donate: "hsl(38, 92%, 50%)",
  start: "hsl(152, 69%, 47%)",
  end: "hsl(0, 72%, 51%)",
};

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: DataPoint;
}

function EventDot({ cx, cy, payload }: CustomDotProps) {
  if (!cx || !cy || !payload || !payload.event) return null;
  const color = eventColors[payload.event] || "hsl(264, 67%, 63%)";
  const icon = eventIcons[payload.event] || "📨";
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={color} fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="hsl(240, 5%, 8%)" strokeWidth={2} />
      <text x={cx} y={cy - 18} textAnchor="middle" fontSize={11}>{icon}</text>
    </g>
  );
}

function CustomCursor({ points, height }: { points?: { x: number; y: number }[]; height?: number }) {
  if (!points || !points[0]) return null;
  return (
    <line
      x1={points[0].x} y1={0} x2={points[0].x} y2={height || 0}
      stroke="hsl(264, 67%, 63%)" strokeWidth={1} strokeDasharray="4 4" strokeOpacity={0.5}
    />
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: DataPoint }>; label?: string }) {
  const { language } = useI18n();
  const viewersLabel = {
    ru: "зрителей",
    en: "viewers",
    uk: "глядачів",
  }[language];

  if (!active || !payload?.[0]) return null;
  const data: DataPoint = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs font-mono text-muted-foreground">🕐 {label}</p>
      <p className="text-lg font-bold font-heading text-foreground">
        {data.viewers.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{viewersLabel}</span>
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

function CustomTick({ x, y, payload, source }: { x?: number; y?: number; payload?: { value?: string }; source: DataPoint[] }) {
  if (x === undefined || y === undefined || !payload?.value) return null;
  const point = source.find((d) => d.time === payload.value);
  const icon = point?.event ? eventIcons[point.event] : null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text dy={14} textAnchor="middle" fill="hsl(240, 5%, 35%)" fontSize={11} fontFamily="JetBrains Mono">
        {payload.value}
      </text>
      {icon && <text dy={28} textAnchor="middle" fontSize={10}>{icon}</text>}
    </g>
  );
}

interface ViewerChartProps {
  loading?: boolean;
  data?: DataPoint[];
  showCombined?: boolean;
}

export function ViewerChart({ loading, data, showCombined = false }: ViewerChartProps) {
  const { language } = useI18n();
  const title = {
    ru: "Зрители",
    en: "Viewers",
    uk: "Глядачі",
  }[language];

  const source = data && data.length > 0 ? data : defaultData;

  if (loading) {
    return (
      <div className="linear-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-8 w-20 rounded bg-muted" />
          </div>
          <div className="h-64 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="linear-card p-6"
    >
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-lg font-bold font-heading">{title}</h3>
        <span className="text-3xl font-bold font-heading text-white">
          {Math.max(...source.map((d) => d.viewers)).toLocaleString()}
        </span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={source} margin={{ bottom: 20 }}>
            <defs>
              <linearGradient id="viewerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(264, 67%, 63%)" stopOpacity={0.25} />
                <stop offset="50%" stopColor="hsl(264, 67%, 63%)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="hsl(264, 67%, 63%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="hsl(240, 5%, 35%)"
              tickLine={false}
              axisLine={false}
              tick={<CustomTick source={source} />}
              height={40}
            />
            <YAxis stroke="hsl(240, 5%, 35%)" fontSize={11} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
            <Tooltip content={<CustomTooltip />} cursor={<CustomCursor />} />
            <Area
              type="monotone"
              dataKey="viewers"
              stroke="hsl(264, 67%, 63%)"
              strokeWidth={2.5}
              fill="url(#viewerGradient)"
              dot={<EventDot />}
              activeDot={{ r: 7, fill: "hsl(264, 67%, 63%)", stroke: "hsl(0, 0%, 100%)", strokeWidth: 2 }}
            />
            {showCombined && (
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="hsl(200, 90%, 55%)"
                strokeWidth={1.8}
                fill="none"
                dot={false}
                activeDot={false}
              />
            )}
            {showCombined && (
              <Area
                type="monotone"
                dataKey="donations"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={1.8}
                fill="none"
                dot={false}
                activeDot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
