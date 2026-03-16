import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { EventFeed } from "@/features/live-dashboard/components/EventFeed";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { makeFadeUp, makeStagger } from "@/shared/motion";
import { CardShell } from "@/shared/ui/CardShell";
import { SectionHeader } from "@/shared/ui/SectionHeader";

type ChatHighlight = {
  id: string;
  message: string;
  created_at: string;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function LiveDashboardPage() {
  const { t } = useI18n();
  const events = useLiveEvents();
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState<ChatHighlight[]>([]);
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase
        .from("event_logs")
        .select("id, message, created_at, event_type")
        .order("created_at", { ascending: false })
        .limit(12);
      if (!alive) return;
      const filtered = (data || [])
        .filter((row) => (row.event_type || "").toLowerCase().includes("message"))
        .slice(0, 6)
        .map((row) => ({ id: row.id, message: row.message, created_at: row.created_at }));
      setHighlights(filtered);
    };

    void load();
    const channel = supabase
      .channel("live_chat_highlights")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_logs" }, (payload) => {
        const row = payload.new as { id: string; message: string; created_at: string; event_type: string };
        if (!row.event_type?.toLowerCase?.().includes("message")) return;
        setHighlights((prev) => [{ id: row.id, message: row.message, created_at: row.created_at }, ...prev].slice(0, 6));
      })
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const liveSummary = useMemo(
    () => ({
      events: events.length,
      highlights: highlights.length,
    }),
    [events, highlights],
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl px-3 py-4 pb-24 sm:p-4 md:p-8">
      <motion.div variants={item} className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <CardShell className="space-y-4">
          <div>
            <h1 className="text-2xl font-black font-heading md:text-3xl text-gradient-primary">
              {t("liveDashboard.title", "Пульс эфира")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Ключевые события и активность чата в одном месте.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Событий: {liveSummary.events} · Вопросов: {liveSummary.highlights}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="gap-2" onClick={() => navigate("/announcements")}>
              <Megaphone size={16} /> Открыть анонс
            </Button>
          </div>
        </CardShell>

      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader title={t("liveDashboard.activityFeed", "Лента активности")} />
          <CardShell className="mt-4">
            <EventFeed events={events} />
          </CardShell>
        </div>
        <div className="space-y-6">
          <div>
            <SectionHeader title={t("liveDashboard.chatHighlights", "Вопросы из чата")} />
            <CardShell className="mt-4 min-h-[16rem]">
              {highlights.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-secondary/20 p-4 text-center">
                  <p className="mt-3 text-sm font-semibold text-foreground">Пока тихо</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highlights.map((highlight) => (
                    <div key={highlight.id} className="flex items-start gap-3 rounded-lg border border-border/20 bg-background/40 p-2.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{formatTime(highlight.created_at)}</span>
                      <p className="text-xs text-foreground/90 line-clamp-2">{highlight.message}</p>
                    </div>
                  ))}
                </div>
                )}
            </CardShell>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
