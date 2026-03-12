import { useEffect, useState } from "react";
import { Bell, Eye, Radio } from "lucide-react";
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
  }, []);

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 rounded-[22px] border border-white/8 bg-[hsl(var(--card))/0.72] p-2 shadow-[0_16px_34px_rgba(6,16,31,0.2)] backdrop-blur-xl sm:grid-cols-3 sm:rounded-[24px]">
      <div className="col-span-2 flex min-h-[54px] items-center gap-3 rounded-[18px] bg-white/[0.04] px-3 py-2 sm:col-span-1 sm:min-h-[58px]">
        <motion.span
          animate={isLive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            isLive ? "bg-emerald-500/14 text-emerald-300" : "bg-white/[0.06] text-muted-foreground",
          )}
        >
          <Radio size={16} className={cn(isLive && "fill-current")} />
        </motion.span>
        <div>
          <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px] sm:tracking-[0.22em]">Статус</div>
          <div className={cn("text-sm font-semibold", isLive ? "text-emerald-300" : "text-foreground")}>{isLive ? "В эфире" : "Оффлайн"}</div>
        </div>
      </div>

      <div className="flex min-h-[54px] items-center gap-3 rounded-[18px] bg-white/[0.04] px-3 py-2 sm:min-h-[58px]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-foreground/85">
          <Eye size={16} />
        </span>
        <div>
          <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px] sm:tracking-[0.22em]">Сейчас</div>
          <div className="text-sm font-semibold text-foreground">{viewers.toLocaleString("ru-RU")}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setHasNewEvent(false)}
        className="flex min-h-[54px] items-center gap-3 rounded-[18px] bg-white/[0.04] px-3 py-2 text-left transition-colors duration-200 hover:bg-white/[0.06] sm:min-h-[58px]"
      >
        <span className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-foreground/85",
          hasNewEvent && "text-amber-300",
        )}>
          <Bell size={16} className={cn(hasNewEvent && "fill-current")} />
          {hasNewEvent ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]" /> : null}
        </span>
        <div>
          <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px] sm:tracking-[0.22em]">События</div>
          <div className="text-sm font-semibold text-foreground">{hasNewEvent ? "Есть новые" : "Тихо"}</div>
        </div>
      </button>
    </div>
  );
}
