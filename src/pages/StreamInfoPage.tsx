import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, DollarSign, Eye, Link2, MousePointerClick, RefreshCw, ShieldCheck, TrendingUp, UserCheck, Users, Sparkles, MoreHorizontal, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatsCard } from "@/shared/ui/StatsCard";
import { DataPoint, ViewerChart } from "@/components/dashboard/ViewerChart";
import { LiveIndicator } from "@/components/dashboard/LiveIndicator";
import { AchievementsBlock } from "@/components/dashboard/AchievementsBlock";
import { PredictionCard } from "@/components/dashboard/PredictionCard";
import { StreamSeriesRail } from "@/components/dashboard/StreamSeriesRail";
import { PartnersCarousel } from "@/components/dashboard/PartnersCarousel";
import { useI18n } from "@/lib/i18n";
import { getCurrentTelegramId, hasAdminSession, isOwnerTelegramId } from "@/lib/adminAccess";
import { useStreamInfo } from "@/hooks/useStreamInfo";

function OnboardingWelcome() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="my-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-background to-background/50 p-6 text-center"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 glow-primary">
        <Sparkles className="text-primary" />
      </div>
      <h2 className="text-xl font-bold font-heading">{t("streamInfo.welcomeTitle")}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t("streamInfo.welcomeSubtitle")}</p>
      <Button onClick={() => navigate("/integrations")} className="mt-6 gap-2">
        <Link2 size={16} /> {t("streamInfo.welcomeButton")}
      </Button>
    </motion.div>
  );
}

export default function StreamInfoPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [period, setPeriod] = useState("today");

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
    { icon: MousePointerClick, label: t("streamInfo.clicks"), value: data?.clicks ?? 0 },
    { icon: Eye, label: t("streamInfo.viewersNow"), value: data?.twitch?.viewers ?? 0 },
    { icon: TrendingUp, label: t("streamInfo.streamStatus"), value: data?.twitch?.online ? 1 : 0 },
    { icon: Users, label: t("streamInfo.ytSubs"), value: data?.youtube?.subscribers ?? 0 },
    { icon: DollarSign, label: t("streamInfo.streamDonations"), value: 0, suffix: "₽" },
    { icon: UserCheck, label: t("streamInfo.peakOnline"), value: Math.max(...timeline.map((i) => i.viewers), 0) },
  ];

  const showOnboarding = data?.is_linked === false && !isLoading;
  const isLive = data?.twitch?.online ?? false;

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:p-4 md:p-8">
      <div className="mb-5 flex items-center justify-between sm:mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-black font-heading sm:text-2xl md:text-3xl">{t("streamInfo.title")}</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <button onClick={() => refetch()} disabled={isRefetching} aria-label={t("streamInfo.refresh")}>
              <RefreshCw size={13} className={isRefetching ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>
        <LiveIndicator isLive={isLive} />
      </div>

      {isLive && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <Button onClick={() => navigate("/live")} className="w-full animate-glow-pulse" size="lg">
            <Radio size={16} className="mr-2" />
            {t("streamInfo.goToLive", "Перейти в режим Live")}
          </Button>
        </motion.div>
      )}

      {showOnboarding ? (
        <OnboardingWelcome />
      ) : (
        <>
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

          <div className="mb-5 grid grid-cols-2 gap-2.5 sm:mb-8 sm:gap-4 lg:grid-cols-3">
            {stats.map((s, i) => (
              <StatsCard key={s.label} icon={s.icon} label={s.label} value={s.value} delay={i * 0.07} loading={isLoading} suffix={s.suffix} />
            ))}
          </div>

          <div className="mb-8"><ViewerChart loading={isLoading} data={timeline} /></div>
          <div className="mb-8"><PartnersCarousel /></div>
          <div className="mb-8"><PredictionCard data={timeline} liveViewers={data?.twitch?.viewers ?? 0} isLive={isLive} /></div>
          <div className="mb-8"><StreamSeriesRail data={timeline} /></div>
          <AchievementsBlock />
        </>
      )}
    </div>
  );
}
