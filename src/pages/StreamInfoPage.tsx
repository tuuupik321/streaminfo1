import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, DollarSign, Eye, Link2, MousePointerClick, RefreshCw, ShieldCheck, TrendingUp, UserCheck, Users, MoreHorizontal, Radio, PlusCircle, Twitch, Youtube, Send, Share2, Copy, Megaphone, Sparkles } from "lucide-react";
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
import { EmptyState } from "@/shared/ui/EmptyState";

type ActivityItem = { id: string; text: string; type: "donation" | "follow" | "click" | "sub" };

const activitySeed: ActivityItem[] = [
  { id: "a1", text: "User123 donated 120 ₽", type: "donation" },
  { id: "a2", text: "User77 followed", type: "follow" },
  { id: "a3", text: "User22 clicked Twitch link", type: "click" },
  { id: "a4", text: "User10 subscribed", type: "sub" },
];

function AddWidgetCard({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  const streamUrl = "https://twitch.tv/username";
  const streamDuration = "02:14";
  const viewersNow = data?.twitch?.viewers ?? 0;
  const clicksToday = data?.clicks ?? 0;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
    } catch {
      // ignore
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Stream", url: streamUrl }).catch(() => undefined);
      return;
    }
    handleCopyLink();
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:p-4 md:p-8">
      <section className={cn("saas-card relative overflow-hidden", isLive ? "pulse-live" : "")}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
              <span className={cn("h-2 w-2 rounded-full", isLive ? "bg-red-500" : "bg-white/30")} />
              LIVE STATUS
            </div>
            <h2 className="mt-2 text-xl font-bold">{title}</h2>
            <p className="text-xs text-white/60">Channel: {streamUrl}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
              <span>Viewers: <span className="text-white font-semibold">{viewersNow}</span></span>
              <span>Stream time: <span className="text-white font-semibold">{streamDuration}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button size="sm" variant="outline" onClick={() => navigate("/announcements")} className="gap-2">
              <Megaphone size={14} /> Start announcement
            </Button>
            <Button size="sm" variant="outline" onClick={handleShare} className="gap-2">
              <Share2 size={14} /> Share stream
            </Button>
            <Button size="sm" onClick={handleCopyLink} className="gap-2">
              <Copy size={14} /> Copy stream link
            </Button>
          </div>
        </div>
      </section>

      <WidgetManager open={isWidgetManagerOpen} onOpenChange={setWidgetManagerOpen} />
      <div className="mb-4 mt-6 flex items-center justify-between sm:mb-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-gradient-primary text-xl">{t("streamInfo.title")}</h1>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2 space-y-6">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="saas-card">
              <h3 className="text-sm font-semibold">Activity Feed</h3>
              <div className="mt-3 space-y-2">
                {activity.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-white/70">
                    <span>{item.text}</span>
                    <span className="text-[10px] text-white/40">now</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="saas-card">
              <h3 className="text-sm font-semibold">Stream Goals</h3>
              <div className="mt-4 space-y-3 text-xs text-white/70">
                <div>
                  <div className="flex justify-between"><span>🎯 Stream goal</span><span>{clicksToday}/50</span></div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (clicksToday / 50) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between"><span>Donation goal</span><span>124/200 ₽</span></div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-emerald-400" style={{ width: "62%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between"><span>Follower goal</span><span>18/40</span></div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-blue-400" style={{ width: "45%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="saas-card text-xs">
                <div className="flex items-center gap-2 text-white/60"><s.icon size={14} /> {s.label}</div>
                <div className="mt-2 text-lg font-semibold">{isLoading ? "—" : `${s.value ?? 0}${s.suffix ?? ""}`}</div>
              </div>
            ))}
          </div>
          <div className="saas-card">
            <h3 className="text-sm font-semibold">STREAM CENTER</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Button size="sm" variant="outline">Start stream</Button>
              <Button size="sm" variant="outline">Send announcement</Button>
              <Button size="sm" variant="outline">Copy stream link</Button>
              <Button size="sm" variant="outline">Post to Telegram</Button>
            </div>
          </div>
          <div className="saas-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">STREAMER SCORE</h3>
              <Sparkles size={14} className="text-white/60" />
            </div>
            <div className="mt-3 text-2xl font-bold">72 / 100</div>
            <div className="mt-3 space-y-2 text-xs text-white/70">
              <div className="flex justify-between"><span>Activity</span><span>18</span></div>
              <div className="flex justify-between"><span>Clicks</span><span>{clicksToday}</span></div>
              <div className="flex justify-between"><span>Donations</span><span>124 ₽</span></div>
              <div className="flex justify-between"><span>Followers</span><span>18</span></div>
            </div>
          </div>
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