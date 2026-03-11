import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CalendarDays, Copy, DollarSign, Eye, Link2, Megaphone, MoreHorizontal, MousePointerClick, Radio, RefreshCw, Share2, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataPoint, ViewerChart } from "@/components/dashboard/ViewerChart";
import { LockedOverlay } from "@/components/dashboard/LockedOverlay";
import { useI18n } from "@/lib/i18n";
import { getCurrentTelegramId, hasAdminSession, isOwnerTelegramId } from "@/lib/adminAccess";
import { useStreamInfo } from "@/hooks/useStreamInfo";
import { EmptyState } from "@/shared/ui/EmptyState";
import { cn } from "@/lib/utils";
import { KpiTile } from "@/shared/ui/KpiTile";
import { makeFadeUp, makeStagger } from "@/shared/motion";

type Donation = {
  id: string;
  donor: string;
  amount: number;
  currency: string;
  message: string;
  source: string;
  createdAt: string;
};

type DonationsApiResponse = {
  items: Donation[];
  configured: boolean;
  error?: string;
};

type ActivityItem = { id: string; text: string; time: string };

type StreamGoal = {
  id: number;
  goal_type: "followers" | "online" | "subscriptions";
  current_value: number;
  target_value: number;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: { id?: number } };
    };
  };
};

const fetchDonations = async (userId: number, initData: string): Promise<DonationsApiResponse> => {
  const response = await fetch(`/api/donations?user_id=${userId}&init_data=${encodeURIComponent(initData)}`);
  if (!response.ok) {
    throw new Error("Failed to fetch donations");
  }
  return response.json();
};

const fetchGoals = async (userId: number, initData: string): Promise<StreamGoal[]> => {
  const response = await fetch(`/api/stream_goals?user_id=${userId}&init_data=${encodeURIComponent(initData)}`);
  if (!response.ok) {
    throw new Error("Failed to fetch goals");
  }
  const data = await response.json();
  if (Array.isArray(data) && data.length === 0) {
    await fetch(`/api/stream_goals/generate?user_id=${userId}&init_data=${encodeURIComponent(initData)}`, { method: "POST" });
  }
  return Array.isArray(data) ? data : [];
};

export default function StreamInfoPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [period, setPeriod] = useState("today");
  const { data, isLoading, isRefetching, refetch, error } = useStreamInfo(period);
  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;
  const initData = tg?.initData || "";

  const { data: donationsData } = useQuery<DonationsApiResponse, Error>({
    queryKey: ["donations"],
    queryFn: () => fetchDonations(userId!, initData),
    enabled: !!userId && !!initData,
    refetchInterval: 15_000,
  });

  const { data: goalsData } = useQuery<StreamGoal[], Error>({
    queryKey: ["stream-goals", userId],
    queryFn: () => fetchGoals(userId!, initData),
    enabled: !!userId && !!initData,
    refetchInterval: 60_000,
  });

  const currentTelegramId = getCurrentTelegramId();
  const canSeeAdmin = isOwnerTelegramId(currentTelegramId) || hasAdminSession(currentTelegramId);

  const timeline: DataPoint[] = (data?.timeline || []).map((item) => {
    const date = new Date(item.time);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return { time: `${hh}:${mm}`, viewers: item.viewers, event: item.event || null };
  });

  const isLive = data?.twitch?.online ?? false;
  const viewersNow = data?.twitch?.viewers ?? 0;
  const clicksToday = data?.clicks ?? 0;
  const followers = data?.twitch?.followers ?? 0;
  const goalsMap = useMemo(() => {
    const map: Record<string, StreamGoal> = {};
    (goalsData || []).forEach((goal) => {
      map[goal.goal_type] = goal;
    });
    return map;
  }, [goalsData]);
  const goalCards = useMemo(
    () => [
      {
        key: "online",
        title: t("dashboard.goalStream", "Цель стрима"),
        current: goalsMap.online?.current_value ?? 0,
        target: goalsMap.online?.target_value ?? 100,
        tone: "bg-primary",
        note: viewersNow > 0 ? `Сейчас в эфире ${viewersNow}` : "Прогресс начнётся после старта эфира",
      },
      {
        key: "followers",
        title: t("dashboard.goalFollowers", "Цель по фолловерам"),
        current: goalsMap.followers?.current_value ?? 0,
        target: goalsMap.followers?.target_value ?? 50,
        tone: "bg-sky-400",
        note: `База канала: ${followers.toLocaleString("ru-RU")}`,
      },
      {
        key: "subscriptions",
        title: t("dashboard.goalSubscriptions", "Цель по подпискам"),
        current: goalsMap.subscriptions?.current_value ?? 0,
        target: goalsMap.subscriptions?.target_value ?? 10,
        tone: "bg-emerald-400",
        note: "Отдельный счётчик для платных подписок",
      },
    ],
    [followers, goalsMap, t, viewersNow],
  );

  const donationsToday = useMemo(() => {
    const items = donationsData?.items ?? [];
    const now = Date.now();
    return items
      .filter((item) => {
        const ts = Date.parse(item.createdAt);
        return Number.isFinite(ts) && now - ts < 24 * 60 * 60 * 1000;
      })
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [donationsData?.items]);

  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    for (const donation of donationsData?.items ?? []) {
      items.push({
        id: `don-${donation.id}`,
        text: `${donation.donor} ${t("donations.donated", "donated")} ${donation.amount.toLocaleString()} ${donation.currency || "RUB"}`,
        time: donation.createdAt,
      });
    }

    for (const event of data?.timeline ?? []) {
      const label = event.event === "tg"
        ? t("dashboard.activity.click", "clicked stream link")
        : event.event === "donate"
        ? t("dashboard.activity.donation", "donation received")
        : event.event === "start"
        ? t("dashboard.activity.start", "stream started")
        : event.event === "end"
        ? t("dashboard.activity.end", "stream ended")
        : t("dashboard.activity.update", "activity update");
      items.push({
        id: `evt-${event.time}-${event.event ?? "event"}`,
        text: label,
        time: event.time,
      });
    }

    return items
      .filter((item) => Boolean(item.time))
      .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
      .slice(0, 20);
  }, [data?.timeline, donationsData?.items, t]);

  const streamerScore = useMemo(() => {
    const score = Math.round(Math.min(100, clicksToday / 2 + donationsToday / 50 + followers / 5 + activity.length));
    return Math.max(0, score);
  }, [clicksToday, donationsToday, followers, activity.length]);

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  if (data?.is_linked === false && !isLoading) {
    return <LockedOverlay />;
  }

  if (error) {
    return <EmptyState icon={ShieldCheck} title={t("streamInfo.errorTitle", "Failed to load dashboard")} description={t("streamInfo.errorDescription", "Check your connection and try again.")} />;
  }

  const streamUrl = data?.twitch?.url ?? "https://twitch.tv/username";
  const streamDuration = t("dashboard.streamTimeValue", "02:14");

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
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-6xl px-3 py-3 md:p-6">
      <motion.section variants={item} className={cn("saas-card relative overflow-hidden", isLive ? "pulse-live" : "")}> 
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
              <span className={cn("h-2 w-2 rounded-full", isLive ? "bg-red-500" : "bg-white/30")} />
              {t("dashboard.liveStatus", "LIVE STATUS")}
            </div>
            <h2 className="mt-2 text-xl font-bold">{t("dashboard.heroTitle", "Stream Center")}</h2>
            <p className="text-xs text-white/60">{t("dashboard.channel", "Channel")}: {streamUrl}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
              <span>{t("dashboard.viewers", "Viewers")}: <span className="text-white font-semibold">{viewersNow}</span></span>
              <span>{t("dashboard.streamTime", "Stream time")}: <span className="text-white font-semibold">{streamDuration}</span></span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button size="sm" variant="outline" onClick={() => navigate("/announcements")} className="gap-2">
              <Megaphone size={14} /> {t("dashboard.startAnnouncement", "Start announcement")}
            </Button>
            <Button size="sm" variant="outline" onClick={handleShare} className="gap-2">
              <Share2 size={14} /> {t("dashboard.shareStream", "Share stream")}
            </Button>
            <Button size="sm" onClick={handleCopyLink} className="gap-2">
              <Copy size={14} /> {t("dashboard.copyStreamLink", "Copy stream link")}
            </Button>
          </div>
        </div>
      </motion.section>

      <motion.div variants={item} className="mb-4 mt-6 flex items-center justify-between sm:mb-6">
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
      </motion.div>

      <motion.div variants={item} className="mb-5 flex gap-2.5 sm:mb-6 sm:gap-3">
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
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="viewerChart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ViewerChart loading={isLoading} data={timeline} />
            </motion.div>
          </AnimatePresence>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <motion.div variants={item} className="saas-card">
              <h3 className="text-sm font-semibold">{t("dashboard.activityFeed", "Activity Feed")}</h3>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                {activity.length === 0 ? (
                  <p className="text-xs text-white/50">{t("dashboard.activityEmpty", "No activity yet")}</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-white/70">
                      <span>{item.text}</span>
                      <span className="text-[10px] text-white/40">{new Date(item.time).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
            <motion.div variants={item} className="saas-card">
              <h3 className="text-sm font-semibold">{t("dashboard.streamGoals", "Stream Goals")}</h3>
              <div className="mt-4 space-y-3">
                {goalCards.map((goal) => {
                  const progress = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
                  return (
                    <div key={goal.key} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/75">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{goal.title}</p>
                          <p className="mt-1 text-[11px] text-white/50">{goal.note}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-white">{goal.current} из {goal.target}</div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">goal</div>
                        </div>
                      </div>
                      <div className="mt-3 h-2.5 rounded-full bg-white/10">
                        <div className={`h-2.5 rounded-full ${goal.tone}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <motion.div variants={item}>
              <KpiTile icon={Eye} label={t("dashboard.kpi.viewersToday", "Viewers today")} value={isLoading ? "—" : viewersNow} />
            </motion.div>
            <motion.div variants={item}>
              <KpiTile icon={MousePointerClick} label={t("dashboard.kpi.clicksToStream", "Clicks to stream")} value={isLoading ? "—" : clicksToday} />
            </motion.div>
            <motion.div variants={item}>
              <KpiTile icon={DollarSign} label={t("dashboard.kpi.donationsToday", "Donations today")} value={isLoading ? "—" : `${donationsToday.toLocaleString()} ₽`} />
            </motion.div>
            <motion.div variants={item}>
              <KpiTile icon={UserCheck} label={t("dashboard.kpi.newFollowers", "New followers")} value={isLoading ? "—" : followers} />
            </motion.div>
          </div>
          <motion.div variants={item} className="saas-card">
            <h3 className="text-sm font-semibold">{t("dashboard.streamCenter", "STREAM CENTER")}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Button size="sm" variant="outline">{t("dashboard.startStream", "Start stream")}</Button>
              <Button size="sm" variant="outline">{t("dashboard.sendAnnouncement", "Send announcement")}</Button>
              <Button size="sm" variant="outline" onClick={handleCopyLink}>{t("dashboard.copyStreamLink", "Copy stream link")}</Button>
              <Button size="sm" variant="outline">{t("dashboard.postToTelegram", "Post to Telegram")}</Button>
            </div>
          </motion.div>
          <motion.div variants={item} className="saas-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t("dashboard.streamerScore", "STREAMER SCORE")}</h3>
              <Sparkles size={14} className="text-white/60" />
            </div>
            <div className="mt-3 text-2xl font-bold">{streamerScore} / 100</div>
            <div className="mt-3 space-y-2 text-xs text-white/70">
              <div className="flex justify-between"><span>{t("dashboard.score.activity", "Activity")}</span><span>{activity.length}</span></div>
              <div className="flex justify-between"><span>{t("dashboard.score.clicks", "Clicks")}</span><span>{clicksToday}</span></div>
              <div className="flex justify-between"><span>{t("dashboard.score.donations", "Donations")}</span><span>{donationsToday.toLocaleString()} ₽</span></div>
              <div className="flex justify-between"><span>{t("dashboard.score.followers", "Followers")}</span><span>{followers}</span></div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
