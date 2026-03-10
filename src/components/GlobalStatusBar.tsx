import { useEffect, useState } from "react";
import { Eye, Bell, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamInfo } from "@/hooks/useStreamInfo";
import { supabase } from "@/integrations/supabase/client";

export function GlobalStatusBar() {
  const { data } = useStreamInfo("today");
  const [hasNewEvent, setHasNewEvent] = useState(false);

  const isLive = data?.twitch?.online ?? false;
  const viewers = data?.twitch?.viewers ?? 0;

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data: rows } = await supabase
        .from("event_logs")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!alive) return;
      const latest = rows?.[0]?.created_at ?? null;
      if (latest) setHasNewEvent(false);
    };

    void load();

    const channel = supabase
      .channel("global_status_events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_logs" }, () => {
        setHasNewEvent(true);
      })
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [isLive]);

  return (
    <div className="sticky top-12 z-30 flex h-11 items-center justify-center gap-8 border-b bg-background/80 px-4 backdrop-blur-xl">
      <motion.div
        animate={{ scale: isLive ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "flex items-center gap-2 text-sm font-mono font-bold",
          isLive ? "text-green-400" : "text-muted-foreground"
        )}
      >
        <Radio size={15} className={cn(isLive && "fill-current")} />
        <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
      </motion.div>

      <div className="flex items-center gap-2 text-sm font-mono text-foreground">
        <Eye size={15} className="text-muted-foreground" />
        <span className="font-bold">{viewers}</span>
      </div>

      <motion.button
        onClick={() => setHasNewEvent(false)}
        animate={{ scale: hasNewEvent ? [1, 1.1, 1, 1.1, 1] : 1 }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="flex items-center gap-2 text-xs font-mono text-muted-foreground"
      >
        <Bell size={15} className={cn(hasNewEvent && "fill-yellow-400 text-yellow-400")} />
      </motion.button>
    </div>
  );
}
