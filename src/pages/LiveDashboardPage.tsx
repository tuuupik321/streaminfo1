import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { EventFeed } from "@/features/live-dashboard/components/EventFeed";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { ChatPulseCharts } from "@/components/dashboard/ChatPulseCharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Link2, Megaphone, Settings, ShieldCheck } from "lucide-react";
import { getCurrentTelegramId, hasAdminSession, isOwnerTelegramId } from "@/lib/adminAccess";
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
  const currentTelegramId = getCurrentTelegramId();
  const canSeeAdmin = isOwnerTelegramId(currentTelegramId) || hasAdminSession(currentTelegramId);
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

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl p-4 md:p-8">
      <motion.h1 variants={item} className="mb-6 text-2xl font-black font-heading md:text-3xl text-gradient-primary">
        {t("liveDashboard.title", "Live Dashboard")}
      </motion.h1>

      <motion.div variants={item} className="mb-8">
        <CardShell>
          <ChatPulseCharts />
        </CardShell>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader title={t("liveDashboard.liveFeed", "Лента событий")} subtitle={t("liveDashboard.title", "Live Dashboard")} />
          <CardShell className="mt-4">
            <EventFeed events={events} />
          </CardShell>
        </div>
        <div className="space-y-6">
          <div>
            <SectionHeader title={t("liveDashboard.chatHighlights", "Вопросы из чата")} subtitle={t("liveDashboard.title", "Live Dashboard")} />
            <CardShell className="mt-4 min-h-[16rem]">
              {highlights.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center mt-8">Пока нет сообщений</p>
              ) : (
                <div className="space-y-3">
                  {highlights.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border/20 bg-background/40 p-2.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{formatTime(item.created_at)}</span>
                      <p className="text-xs text-foreground/90 line-clamp-2">{item.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardShell>
          </div>
          <div>
            <SectionHeader title={t("liveDashboard.quickActions", "Быстрые действия")} subtitle={t("liveDashboard.title", "Live Dashboard")} />
            <CardShell className="mt-4">
              <div className="grid grid-cols-1 gap-3">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate("/integrations")}>
                  <Link2 size={16} /> Подключить источники
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate("/announcements")}>
                  <Megaphone size={16} /> Сделать объявление
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate("/settings")}>
                  <Settings size={16} /> Настройки стрима
                </Button>
                {canSeeAdmin && (
                  <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate("/admin")}>
                    <ShieldCheck size={16} /> Админ-центр
                  </Button>
                )}
              </div>
            </CardShell>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
