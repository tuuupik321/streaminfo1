import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { EventFeed } from "@/features/live-dashboard/components/EventFeed";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { ChatPulseCharts } from "@/components/dashboard/ChatPulseCharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Link2, Megaphone, Settings, ShieldCheck, Sparkles, MessageSquareText, Radio } from "lucide-react";
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

  const liveSummary = useMemo(
    () => ({
      events: events.length,
      highlights: highlights.length,
      latest: events[0]?.user ?? "чат ждёт движение",
    }),
    [events, highlights],
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl px-3 py-4 pb-24 sm:p-4 md:p-8">
      <motion.div variants={item} className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <CardShell className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-primary/90">
            <Radio size={12} /> Live assistant
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading md:text-3xl text-gradient-primary">
              {t("liveDashboard.title", "Пульс эфира")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Следите за событиями, сообщениями из чата и быстрыми действиями без переключений между экранами.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">События</p>
              <p className="mt-2 text-2xl font-black text-foreground">{liveSummary.events}</p>
              <p className="mt-1 text-xs text-muted-foreground">Новых событий в ленте прямо сейчас.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Вопросы</p>
              <p className="mt-2 text-2xl font-black text-foreground">{liveSummary.highlights}</p>
              <p className="mt-1 text-xs text-muted-foreground">Сообщений, которые стоит заметить первыми.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Фокус</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{liveSummary.latest}</p>
              <p className="mt-1 text-xs text-muted-foreground">Последний заметный участник или статус чата.</p>
            </div>
          </div>
          <div className="rounded-[24px] border border-primary/15 bg-primary/8 p-4 text-sm text-muted-foreground">
            <strong className="block text-foreground">Следующий шаг</strong>
            <span className="mt-2 block leading-6">
              Если эфир ещё не анонсирован, подготовьте короткий пост со ссылкой. Это быстрее поднимает возвращаемость, чем лишние декоративные правки.
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="gap-2" onClick={() => navigate("/announcements")}>
              <Megaphone size={16} /> Подготовить анонс
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/integrations")}>
              <Link2 size={16} /> Проверить источники
            </Button>
          </div>
        </CardShell>

        <CardShell className="space-y-4">
          <SectionHeader title="Оффлайн-помощь" subtitle="Даже когда эфир ещё не начался" />
          <div className="grid gap-3">
            <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
              <p className="text-sm font-semibold text-foreground">Подключите все источники</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Чем полнее интеграции, тем честнее лента событий, аналитика и история эфиров.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
              <p className="text-sm font-semibold text-foreground">Соберите одно действие для зрителя</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Один понятный CTA в Telegram работает лучше, чем несколько конкурирующих ссылок.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/35 p-4">
              <p className="text-sm font-semibold text-foreground">Держите настройки под рукой</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Перед стартом полезно проверить тему, уведомления и доступы, чтобы не чинить это уже в эфире.
              </p>
            </div>
          </div>
        </CardShell>
      </motion.div>

      <motion.div variants={item} className="mt-6">
        <CardShell>
          <ChatPulseCharts />
        </CardShell>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader title={t("liveDashboard.liveFeed", "Лента событий")} subtitle="Новые реакции, подписки, донаты и рейды" />
          <CardShell className="mt-4">
            <EventFeed events={events} />
          </CardShell>
        </div>
        <div className="space-y-6">
          <div>
            <SectionHeader title={t("liveDashboard.chatHighlights", "Вопросы из чата")} subtitle="Что стоит заметить первым" />
            <CardShell className="mt-4 min-h-[16rem]">
              {highlights.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-secondary/20 p-4 text-center">
                  <MessageSquareText size={18} className="mx-auto text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Пока тихо</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Вопросы и заметные сообщения появятся здесь, как только чат оживёт. Во время паузы можно подготовить анонс или проверить интеграции.
                  </p>
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
          <div>
            <SectionHeader title={t("liveDashboard.quickActions", "Быстрые действия")} subtitle="Самое полезное без лишних переходов" />
            <CardShell className="mt-4">
              <div className="grid grid-cols-1 gap-3">
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate("/integrations")}>
                  <Link2 size={16} /> Подключить источники
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate("/announcements")}>
                  <Megaphone size={16} /> Собрать анонс
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate("/settings")}>
                  <Settings size={16} /> Проверить настройки
                </Button>
                {canSeeAdmin && (
                  <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate("/admin")}>
                    <ShieldCheck size={16} /> Открыть админ-центр
                  </Button>
                )}
              </div>
            </CardShell>
          </div>
          <CardShell className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-primary/90">
              <Sparkles size={12} /> Следующий шаг
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Если вы не в эфире, используйте этот экран как быструю станцию подготовки: анонс, ссылка, уведомления и только потом запуск.
            </p>
          </CardShell>
        </div>
      </div>
    </motion.div>
  );
}
