import { useEffect, useState } from "react";
import { Eye, Bell, Radio } from "lucide-react";
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_logs" }, (payload) => {
        const createdAt = (payload.new as { created_at?: string }).created_at ?? null;
        if (createdAt) setHasNewEvent(true);
        setHasNewEvent(true);
      })
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [isLive]);

  return (
    <div className="sticky top-12 z-30 flex h-10 items-center justify-center gap-6 border-b bg-background/80 px-4 backdrop-blur-xl">
      <div
        className={cn(
          "flex items-center gap-2 text-xs font-mono font-semibold",
          isLive ? "text-success-foreground" : "text-muted-foreground"
        )}
      >
        <Radio size={14} className={cn(isLive && "animate-pulse fill-current")} />
        <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Eye size={14} />
        <span>{viewers}</span>
      </div>

      <button
        onClick={() => setHasNewEvent(false)}
        className="flex items-center gap-2 text-xs font-mono text-muted-foreground"
      >
        <Bell size={14} className={cn(hasNewEvent && "fill-yellow-400 text-yellow-400")} />
      </button>
    </div>
  );
}
