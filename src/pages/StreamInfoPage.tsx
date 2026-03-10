import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, DollarSign, Eye, Link2, MousePointerClick, RefreshCw, ShieldCheck, TrendingUp, UserCheck, Users, MoreHorizontal, Radio, PlusCircle, Twitch, Youtube, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatsCard } from "@/shared/ui/StatsCard";
import { DataPoint, ViewerChart } from "@/components/dashboard/ViewerChart";
import { AchievementsBlock } from "@/components/dashboard/AchievementsBlock";
import { PredictionCard } from "@/components/dashboard/PredictionCard";
import { StreamSeriesRail } from "@/components/dashboard/StreamSeriesRail";
import { PartnersCarousel } from "@/components/dashboard/PartnersCarousel";
import { LiveEventsFeed } from "@/components/dashboard/LiveEventsFeed";
import { LiveStreamFeed } from "@/components/dashboard/LiveStreamFeed";
import { LockedOverlay } from "@/components/dashboard/LockedOverlay";
import { WidgetManager } from "@/components/dashboard/WidgetManager";
import { useI18n } from "@/lib/i18n";
import { getCurrentTelegramId, hasAdminSession, isOwnerTelegramId } from "@/lib/adminAccess";
import { useStreamInfo } from "@/hooks/useStreamInfo";
import { useDashboardStore, type Widget } from "@/store/useDashboardStore";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function AddWidgetCard({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.03, backgroundColor: 'hsla(var(--primary) / 0.05)', borderColor: 'hsla(var(--primary) / 0.3)' }}
      className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-border/30 bg-secondary/30 text-center text-muted-foreground transition-colors"
    >
      <PlusCircle size={24} className="mb-2" />
      <span className="text-xs font-medium">{t("streamInfo.addWidget", "Добавить виджет")}</span>
    </motion.div>
  );
}

export default function StreamInfoPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [period, setPeriod] = useState("today");
  const [isWidgetManagerOpen, setWidgetManagerOpen] = useState(false);
  const { widgets } = useDashboardStore();

  const { data, isLoading, isRefetching, refetch } = useStreamInfo(period);

  const currentTelegramId = getCurrentTelegramId();
  const canSeeAdmin = isOwnerTelegramId(currentTelegramId) || hasAdminSession(currentTelegramId);

  const timeline: DataPoint[] = (data?.timeline || []).map((item) => {
    const date = new Date(item.time);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return { time: `${hh}:${mm}`, viewers: item.viewers, event: item.event || null };
  });

  const stats = [
    { icon: MousePointerClick, label: t("streamInfo.clicks"), value: data?.clicks },
    { icon: Eye, label: t("streamInfo.viewersNow"), value: data?.twitch?.viewers },
    { icon: TrendingUp, label: t("streamInfo.streamStatus"), value: data?.twitch?.online ? 1 : 0 },
    { icon: Users, label: t("streamInfo.ytSubs"), value: data?.youtube?.subscribers },
    { icon: DollarSign, label: t("streamInfo.streamDonations"), value: null, suffix: "₽" },
    { icon: UserCheck, label: t("streamInfo.peakOnline"), value: Math.max(...timeline.map((i) => i.viewers), 0) },
  ];

  const showOnboarding = data?.is_linked === false && !isLoading;
  const isLive = data?.twitch?.online ?? false;

  const HeroWidget = isLive ? LiveStreamFeed : ViewerChart;
  const heroWidgetName: Widget = isLive ? "liveStreamFeed" : "viewerChart";

  if (showOnboarding) {
    return <LockedOverlay />;
  }

  const title = t("hero.title", "StreamInfo");
  const subtitle = t("hero.subtitle", "Notifications and integrations for Twitch, YouTube, and Telegram");

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(145,70,255,0.25),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(255,0,0,0.22),transparent_35%),radial-gradient(circle_at_60%_80%,rgba(0,178,255,0.2),transparent_40%),linear-gradient(135deg,#0f0f1a,#1a0033,#2b0066)] p-6 sm:p-8 md:p-10 mb-6 sm:mb-10">
        <div className="absolute inset-0 opacity-70 animate-[heroGradient_14s_ease-in-out_infinite]" />
        <div className="relative z-10">
          <motion.h1
            initial="hidden"
            animate="visible"
            className="text-3xl sm:text-4xl md:text-5xl font-black font-heading text-white"
          >
            {title.split("").map((char, index) => (
              <motion.span
                key={`${char}-${index}`}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, delay: index * 0.04 }}
                className="inline-block"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-3 max-w-2xl text-sm sm:text-base text-white/70"
          >
            {subtitle}
          </motion.p>
          <div className="mt-6 flex flex-wrap gap-3">
            <motion.button
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur"
            >
              {t("hero.ctaPrimary", "Launch Bot")}
              <span className="absolute inset-0 rounded-2xl shadow-[0_0_40px_rgba(145,70,255,0.55)] opacity-0 transition-opacity duration-300 hover:opacity-100" />
            </motion.button>
            <motion.button
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={() => navigate("/integrations")}
              className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90"
            >
              {t("hero.ctaSecondary", "Integrations")}
              <span className="absolute inset-0 rounded-2xl shadow-[0_0_40px_rgba(0,178,255,0.45)] opacity-0 transition-opacity duration-300 hover:opacity-100" />
            </motion.button>
          </div>
        </div>
        <motion.div
          className="absolute right-6 top-6 hidden md:flex flex-col gap-4 text-white/70"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Twitch size={26} className="drop-shadow-[0_0_20px_rgba(145,70,255,0.55)]" />
          <Youtube size={26} className="drop-shadow-[0_0_20px_rgba(255,0,0,0.55)]" />
          <Send size={26} className="drop-shadow-[0_0_20px_rgba(0,178,255,0.55)]" />
        </motion.div>
      </section>
      <WidgetManager open={isWidgetManagerOpen} onOpenChange={setWidgetManagerOpen} />
      <div className="mb-5 flex items-center justify-between sm:mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-gradient-primary">{t("streamInfo.title")}</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <button onClick={() => refetch()} disabled={isRefetching} aria-label={t("streamInfo.refresh")}>
              <RefreshCw size={13} className={isRefetching ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>
        {isLive && (
          <Button onClick={() => navigate("/live")} className="animate-glow-pulse gap-2" size="sm">
            <Radio size={14} />
            <span className="hidden sm:inline">{t("streamInfo.goToLive", "Live Dashboard")}</span>
          </Button>
        )}
      </div>

      <div className="mb-5 flex gap-2.5 sm:mb-6 sm:gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="flex-1">
            <CalendarDays size={14} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{t("streamInfo.today")}</SelectItem>
            <SelectItem value="yesterday">{t("streamInfo.yesterday")}</SelectItem>
            <SelectItem value="7d">{t("streamInfo.d7")}</SelectItem>
            <SelectItem value="30d">{t("streamInfo.d30")}</SelectItem>
            <SelectItem value="all">{t("streamInfo.all")}</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/integrations")} className="gap-2">
              <Link2 size={14} /> {t("streamInfo.sources")}
            </DropdownMenuItem>
            {canSeeAdmin && (
              <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2">
                <ShieldCheck size={14} /> {t("streamInfo.admin")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroWidgetName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {widgets.includes(heroWidgetName) && <HeroWidget loading={isLoading} data={timeline} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="space-y-4">
          {widgets.includes("stats") && (
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <StatsCard key={s.label} icon={s.icon} label={s.label} value={s.value} delay={i * 0.07} loading={isLoading} suffix={s.suffix} />
              ))}
            </div>
          )}
          <AddWidgetCard onClick={() => setWidgetManagerOpen(true)} />
        </div>
      </div>

      {widgets.includes("partners") && <div className="my-8"><PartnersCarousel /></div>}
      {widgets.includes("liveEvents") && <div className="my-8"><LiveEventsFeed /></div>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-8 mt-8">
        {widgets.includes("predictions") && <PredictionCard data={timeline} liveViewers={data?.twitch?.viewers ?? 0} isLive={isLive} />}
        {widgets.includes("streamSeries") && <StreamSeriesRail data={timeline} />}
      </div>
      
      {widgets.includes("achievements") && <div className="mt-8"><AchievementsBlock /></div>}
    </div>
  );
}
