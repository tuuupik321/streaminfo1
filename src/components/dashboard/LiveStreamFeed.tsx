import { motion, AnimatePresence } from "framer-motion";
import { Activity, Gamepad2, Clock, MessageSquare, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface StreamEvent {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

const eventEmoji: Record<string, string> = {
  stream_start: "🟢",
  stream_end: "🔴",
  donation: "💰",
  peak_viewers: "📈",
  raid: "⚔️",
  follow: "➕",
  subscribe: "⭐",
  message: "💬",
  default: "📌",
};

const eventColor: Record<string, string> = {
  stream_start: "text-[hsl(var(--success))]",
  stream_end: "text-destructive",
  donation: "text-[hsl(var(--warning))]",
  peak_viewers: "text-primary",
  raid: "text-[hsl(var(--info))]",
};

export function LiveStreamFeed() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [streamInfo, setStreamInfo] = useState({
    game: "—",
    uptime: "—",
    chatRate: 0,
  });

  useEffect(() => {
    loadEvents();
    loadStreamInfo();

    // Realtime subscription
    const channel = supabase
      .channel("live-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_logs" },
        (payload) => {
          const newEvent = payload.new as StreamEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    const interval = setInterval(loadStreamInfo, 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from("event_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setEvents(data as StreamEvent[]);
  };

  const loadStreamInfo = async () => {
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["current_game", "stream_start_time", "chat_rate"]);

    const map: Record<string, string> = {};
    data?.forEach((r) => { map[r.key] = r.value; });

    // Also check localStorage
    const game = map["current_game"] || localStorage.getItem("current_game") || "—";
    const startTime = map["stream_start_time"] || localStorage.getItem("stream_start_time");
    const chatRate = parseInt(map["chat_rate"] || localStorage.getItem("chat_rate") || "0");

    let uptime = "—";
    if (startTime) {
      try {
        uptime = formatDistanceToNow(new Date(startTime), { locale: ru, addSuffix: false });
      } catch { uptime = "—"; }
    }

    setStreamInfo({ game, uptime, chatRate });
  };

  const displayEvents = expanded ? events : events.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Stream info bar */}
      <div className="grid grid-cols-3 divide-x divide-border/30 border-b border-border/30">
        <div className="p-3 text-center">
          <Gamepad2 size={14} className="text-primary mx-auto mb-1" />
          <p className="text-xs font-bold font-heading text-foreground truncate">{streamInfo.game}</p>
          <p className="text-[9px] text-muted-foreground font-mono">Категория</p>
        </div>
        <div className="p-3 text-center">
          <Clock size={14} className="text-primary mx-auto mb-1" />
          <p className="text-xs font-bold font-heading text-foreground">{streamInfo.uptime}</p>
          <p className="text-[9px] text-muted-foreground font-mono">Аптайм</p>
        </div>
        <div className="p-3 text-center">
          <MessageSquare size={14} className="text-primary mx-auto mb-1" />
          <p className="text-xs font-bold font-heading text-foreground">{streamInfo.chatRate}/мин</p>
          <p className="text-[9px] text-muted-foreground font-mono">Чат</p>
        </div>
      </div>

      {/* Events feed */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-primary" />
          <h4 className="text-sm font-bold font-heading">Живая лента</h4>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]" />
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">LIVE</span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-6">
            <Zap size={20} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-mono">Событий пока нет</p>
            <p className="text-[10px] text-muted-foreground mt-1">Начните стрим или добавьте интеграции</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {displayEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="flex items-start gap-2.5 py-2 px-2.5 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <span className="text-sm mt-0.5 shrink-0">
                      {eventEmoji[event.event_type] || eventEmoji.default}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium truncate ${eventColor[event.event_type] || "text-foreground"}`}>
                        {event.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(event.created_at), { locale: ru, addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {events.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mx-auto mt-3 text-xs font-mono text-primary hover:text-primary/80 transition-colors"
              >
                {expanded ? <><ChevronUp size={14} /> Свернуть</> : <><ChevronDown size={14} /> Показать все ({events.length})</>}
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
