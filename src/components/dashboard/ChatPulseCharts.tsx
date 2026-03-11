import { useEffect, useMemo, useState } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type EventLogRow = {
  id: string;
  event_type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type PulsePoint = {
  time: string;
  messages: number;
  authors: number;
  questions: number;
};

const BUCKET_MINUTES = 10;

function isChatEvent(row: EventLogRow) {
  const type = row.event_type?.toLowerCase?.() ?? "";
  return type.includes("message") || type.includes("chat");
}

function extractAuthor(meta: Record<string, unknown> | null, message: string) {
  if (!meta) return message.split(" ")[0] || "";
  if (typeof meta.user === "string") return meta.user;
  if (typeof meta.username === "string") return meta.username;
  return message.split(" ")[0] || "";
}

function buildBuckets(rows: EventLogRow[]): PulsePoint[] {
  const now = Date.now();
  const buckets: PulsePoint[] = Array.from({ length: BUCKET_MINUTES }).map((_, index) => {
    const minsAgo = BUCKET_MINUTES - 1 - index;
    return {
      time: minsAgo === 0 ? "сейчас" : `-${minsAgo}м`,
      messages: 0,
      authors: 0,
      questions: 0,
    };
  });
  const authorSets: Set<string>[] = Array.from({ length: BUCKET_MINUTES }).map(() => new Set());

  rows.forEach((row) => {
    if (!isChatEvent(row)) return;
    const timestamp = new Date(row.created_at).getTime();
    const diffMinutes = Math.floor((now - timestamp) / 60000);
    const bucketIndex = BUCKET_MINUTES - 1 - diffMinutes;
    if (bucketIndex < 0 || bucketIndex >= BUCKET_MINUTES) return;

    buckets[bucketIndex].messages += 1;
    const author = extractAuthor(row.metadata, row.message || "");
    if (author) authorSets[bucketIndex].add(author);
    if (row.message?.includes("?")) buckets[bucketIndex].questions += 1;
  });

  return buckets.map((bucket, index) => ({ ...bucket, authors: authorSets[index].size }));
}

function ChartCard({
  title,
  description,
  data,
  dataKey,
  color,
  icon: Icon,
}: {
  title: string;
  description: string;
  data: PulsePoint[];
  dataKey: keyof PulsePoint;
  color: string;
  icon: typeof MessageSquare;
}) {
  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon size={16} className="text-primary" />
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background) / 0.88)",
                borderColor: "hsl(var(--border))",
                borderRadius: "16px",
                fontSize: "12px",
                boxShadow: "0 18px 36px hsl(var(--shadow) / 0.32)",
              }}
            />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#color-${dataKey})`} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ChatPulseCharts() {
  const [rows, setRows] = useState<EventLogRow[]>([]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const since = new Date(Date.now() - BUCKET_MINUTES * 60_000).toISOString();
      const { data } = await supabase
        .from("event_logs")
        .select("id, event_type, message, metadata, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      if (!alive) return;
      setRows((data as EventLogRow[] | null) || []);
    };

    void load();
    const interval = setInterval(load, 15_000);

    const channel = supabase
      .channel("chat_pulse")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_logs" }, (payload) => {
        const next = payload.new as EventLogRow;
        if (!isChatEvent(next)) return;
        setRows((prev) => [...prev, next].slice(-200));
      })
      .subscribe();

    return () => {
      alive = false;
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, []);

  const data = useMemo(() => buildBuckets(rows), [rows]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <ChartCard
        title="Сообщения за 10 минут"
        description="Показывает, насколько активно двигается чат прямо сейчас."
        data={data}
        dataKey="messages"
        color="hsl(var(--primary))"
        icon={MessageSquare}
      />
      <ChartCard
        title="Уникальные участники"
        description="Сколько разных людей включилось в чат за последние минуты."
        data={data}
        dataKey="authors"
        color="hsl(var(--info))"
        icon={Users}
      />
      <ChartCard
        title="Вопросы из чата"
        description="Помогает заметить моменты, когда зрителям нужен быстрый ответ."
        data={data}
        dataKey="questions"
        color="hsl(var(--warning))"
        icon={HelpCircle}
      />
    </div>
  );
}
