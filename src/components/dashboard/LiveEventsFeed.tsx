import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock3, Coins, Radio, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type EventLog = {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
};

function iconForType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("donat")) return <Coins size={12} className="text-warning" />;
  if (normalized.includes("stream") || normalized.includes("live")) return <Radio size={12} className="text-success" />;
  if (normalized.includes("tg") || normalized.includes("telegram")) return <Send size={12} className="text-info" />;
  return <Activity size={12} className="text-primary" />;
}

function formatEventTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function LiveEventsFeed() {
  const { language } = useI18n();
  const copy = {
    ru: { title: "Живые события", live: "live", empty: "Пока нет живых событий." },
    en: { title: "Live events", live: "live", empty: "No live events yet." },
    uk: { title: "Живі події", live: "live", empty: "Поки немає живих подій." },
  }[language];

  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase
        .from("event_logs")
        .select("id, event_type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(24);
      if (!alive) return;
      setEvents((data as EventLog[] | null) || []);
      setLoading(false);
    };

    void load();

    const channel = supabase
      .channel("live_events_feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_logs" }, (payload) => {
        const next = payload.new as EventLog;
        setEvents((prev) => [next, ...prev].slice(0, 24));
      })
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold font-heading">{copy.title}</h3>
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-mono text-success">{copy.live}</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-secondary/40" />
          <div className="h-10 animate-pulse rounded-lg bg-secondary/30" />
          <div className="h-10 animate-pulse rounded-lg bg-secondary/20" />
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-2">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/35 px-3 py-2"
            >
              {iconForType(event.event_type)}
              <p className="line-clamp-1 flex-1 text-xs">{event.message}</p>
              <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <Clock3 size={10} />
                {formatEventTime(event.created_at)}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{copy.empty}</p>
      )}
    </section>
  );
}
