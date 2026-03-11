import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, CalendarDays, Clock, Download, Eye, TrendingUp, Users, PieChart, Flame, Award, Sparkles, DollarSign, Heart } from "lucide-react";
import { StatsCard } from "@/shared/ui/StatsCard";
import { DataPoint, ViewerChart } from "@/components/dashboard/ViewerChart";
import { PredictionCard } from "@/components/dashboard/PredictionCard";
import { StreamSeriesRail } from "@/components/dashboard/StreamSeriesRail";
import { LiveEventsFeed } from "@/components/dashboard/LiveEventsFeed";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, Brush, Cell, Line, LineChart, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { makeFadeUp, makeStagger } from "@/shared/motion";
import { cn } from "@/lib/utils";
import { ActivityMap } from "@/components/dashboard/ActivityMap";
import { useQuery } from "@tanstack/react-query";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: { id?: number } };
    };
  };
};

type PlatformStat = {
  platform: string;
  followers: number;
  views: number;
  streams: number;
};

type TimelineItem = {
  time: string;
  viewers: number;
  event?: string | null;
};

function mapTimeline(timeline: TimelineItem[] | undefined): DataPoint[] {
  if (!timeline) return [];
  let clickTotal = 0;
  let donationTotal = 0;
  return timeline.map((item) => {
    const date = new Date(item.time);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    if (item.event === "tg") clickTotal += 1;
    if (item.event === "donate") donationTotal += 1;
    return {
      time: `${hh}:${mm}`,
      viewers: item.viewers,
      clicks: clickTotal,
      donations: donationTotal,
      event: item.event || null,
    } as DataPoint;
  });
}

type ChartType = "clicks" | "donations" | "followers";

export default function Analytics() {
  const { t } = useI18n();
  const [period, setPeriod] = useState("today");
  const [combinedChart, setCombinedChart] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartType>("clicks");

  const { data, isLoading, error } = useAnalyticsData(period);
  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;
  const initData = tg?.initData || "";

  const { data: platformStats } = useQuery<PlatformStat[], Error>({
    queryKey: ["platforms", userId],
    queryFn: async () => {
      const res = await fetch(`/api/platforms?user_id=${userId}&init_data=${encodeURIComponent(initData)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId && !!initData,
    refetchInterval: 60_000,
  });

  const timeline = useMemo(() => mapTimeline(data?.timeline), [data?.timeline]);
  const peak = useMemo(() => Math.max(...timeline.map((p) => p.viewers), 0), [timeline]);
  const peakTime = useMemo(() => {
    if (!timeline.length) return "20:00";
    const max = timeline.reduce((acc, cur) => (cur.viewers > acc.viewers ? cur : acc), timeline[0]);
    return max.time;
  }, [timeline]);

  const lastStreamAt = useMemo(() => (data?.last_stream_at ? new Date(data.last_stream_at) : null), [data?.last_stream_at]);
  const daysSinceLastStream = useMemo(() => {
    if (!lastStreamAt) return null;
    const diffMs = Date.now() - lastStreamAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [lastStreamAt]);

  const expectedViewers = useMemo(() => {
    const avg = data?.avg_peak ?? 0;
    const max = data?.max_peak ?? 0;
    if (!avg && !max) return 0;
    return Math.max(avg, Math.round(max * 0.8));
  }, [data?.avg_peak, data?.max_peak]);

  const achievements = [
    t("analytics.achievementFirstStream", "First Stream"),
    t("analytics.achievement100", "100 viewers"),
    t("analytics.achievement10Donations", "First 10 donations"),
    t("analytics.achievementStreak", "7 day stream streak"),
  ];

  const exportCsv = () => {
    const rows = [["time", "viewers", "clicks", "donations", "event"], ...timeline.map((p) => [p.time, String(p.viewers), String(p.clicks ?? 0), String(p.donations ?? 0), p.event || ""])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const rows = timeline.map((p) => `<tr><td>${p.time}</td><td>${p.viewers}</td><td>${p.clicks ?? 0}</td><td>${p.donations ?? 0}</td><td>${p.event || ""}</td></tr>`).join("");
    const win = window.open("", "_blank", "noopener,noreferrer,width=1000,height=700");
    if (!win) return;
    win.document.write(`<html><head><title>Analytics ${period}</title><style>body{font-family:Arial;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#f4f4f4;text-align:left}</style></head><body><h2>Analytics report (${period})</h2><p>Generated: ${new Date().toLocaleString()}</p><table><thead><tr><th>Time</th><th>Viewers</th><th>Clicks</th><th>Donations</th><th>Event</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const hasData = !isLoading && timeline.length > 0;
  const hasRecentStreams = (data?.streams_count ?? 0) > 0 && (daysSinceLastStream === null || daysSinceLastStream <= 2);
  const chartData = timeline.map((p, index) => ({
    time: p.time,
    viewers: p.viewers,
    clicks: p.clicks ?? 0,
    donations: p.donations ?? 0,
    followers: Math.max(0, Math.round((p.viewers + index) / 8)),
  }));

  const platformMap = useMemo(() => {
    const map: Record<string, PlatformStat> = {};
    (platformStats || []).forEach((stat) => {
      map[stat.platform] = stat;
    });
    return map;
  }, [platformStats]);

  const platformComparison = [
    { name: "Twitch", value: platformMap.twitch?.followers ?? 0 },
    { name: "YouTube", value: platformMap.youtube?.followers ?? 0 },
    { name: "Kick", value: platformMap.kick?.followers ?? 0 },
    { name: "Trovo", value: platformMap.trovo?.followers ?? 0 },
  ];

  const donutData = [
    { name: "Twitch", value: platformMap.twitch?.views ?? 0, color: "#9146FF" },
    { name: "YouTube", value: platformMap.youtube?.views ?? 0, color: "#FF0000" },
    { name: "Kick", value: platformMap.kick?.views ?? 0, color: "#53FC18" },
    { name: "Trovo", value: platformMap.trovo?.views ?? 0, color: "#00B2FF" },
  ];

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  const chartConfig: Record<ChartType, { label: string; color: string; icon: React.ReactNode }> = {
    clicks: { label: t("analytics.clicksToStream", "Clicks to stream"), color: "#00B2FF", icon: <Eye size={14} /> },
    donations: { label: t("analytics.donationsPerStream", "Donations per stream"), color: "#F59E0B", icon: <DollarSign size={14} /> },
    followers: { label: t("analytics.followersPerStream", "Followers per stream"), color: "#34D399", icon: <Heart size={14} /> },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-[1440px] px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <motion.div variants={item} className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-black font-heading md:text-2xl">{t("analytics.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger aria-label={t("analytics.periodSelectLabel")} className="w-[170px]">
              <CalendarDays size={14} className="mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t("analytics.periodToday")}</SelectItem>
              <SelectItem value="yesterday">{t("analytics.periodYesterday")}</SelectItem>
              <SelectItem value="7d">{t("analytics.period7d")}</SelectItem>
              <SelectItem value="30d">{t("analytics.period30d")}</SelectItem>
              <SelectItem value="all">{t("analytics.periodAll")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv} className="gap-2" aria-label={t("analytics.exportCsv")}>
            <Download size={14} />{t("analytics.exportCsv")}
          </Button>
          <Button variant="outline" onClick={exportPdf} className="gap-2" aria-label={t("analytics.exportPdf")}>
            <Download size={14} />{t("analytics.exportPdf")}
          </Button>
          <Button variant={combinedChart ? "default" : "secondary"} onClick={() => setCombinedChart((v) => !v)}>
            {combinedChart ? t("analytics.hideCombined") : t("analytics.showCombined")}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-8 grid grid-cols-1 gap-6">
        <div className="saas-card">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("analytics.streamForecast", "Stream Forecast")}</p>
              {isLoading ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  {hasRecentStreams ? (
                    <>
                      <p className="mt-3 text-sm text-white/70">{t("analytics.expectedViewers", "Expected viewers today")}: <span className="text-white font-semibold">{expectedViewers}</span></p>
                      <p className="text-sm text-white/70">{t("analytics.peakTime", "Peak time")}: <span className="text-white font-semibold">{peakTime}</span></p>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-white/60">{t("analytics.noRecentStreams", "No recent streams to build a forecast.")}</p>
                  )}
                </>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-white">
                <Flame size={18} className="animate-[streakFlame_1.6s_ease-in-out_infinite]" />
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("analytics.streamStreak", "Stream Streak")}</p>
              </div>
              {isLoading ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : (
                <>
                  <p className="mt-3 text-sm text-white/70">{t("analytics.currentStreak", "Current streak")}: <span className="text-white font-semibold">{data?.current_streak_days ?? 0} {t("analytics.days", "days")}</span></p>
                  <p className="text-sm text-white/70">{t("analytics.longestStreak", "Longest streak")}: <span className="text-white font-semibold">{data?.longest_streak_days ?? 0} {t("analytics.days", "days")}</span></p>
                </>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-white">
                <Award size={16} />
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("analytics.achievements", "Achievements")}</p>
              </div>
              {isLoading ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {achievements.map((badge) => (
                    <span key={badge} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white/80 shadow-[0_0_20px_rgba(145,70,255,0.35)]">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {hasData ? (
        <motion.div variants={item} className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-5">
          <StatsCard icon={Eye} label={t("analytics.clicks")} value={data?.clicks ?? 0} delay={0} loading={isLoading} />
          <StatsCard icon={TrendingUp} label={t("analytics.peak")} value={data?.max_peak ?? 0} delay={0.08} loading={isLoading} />
          <StatsCard icon={BarChart3} label={t("analytics.average")} value={data?.avg_peak ?? 0} delay={0.16} loading={isLoading} />
          <StatsCard icon={Clock} label={t("analytics.streamHours")} value={Number(data?.hours_streamed ?? 0)} delay={0.24} loading={isLoading} />
          <StatsCard icon={Users} label={t("analytics.viewersNow")} value={0} delay={0.32} loading={isLoading} />
        </motion.div>
      ) : null}

      <motion.div variants={item} className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="saas-card lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("analytics.viewersGrowth", "Viewers growth")}</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="viewers" stroke="#9146FF" strokeWidth={2} dot={false} />
                <Brush dataKey="time" height={30} stroke="#9146FF" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="saas-card">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("analytics.aiInsight", "AI Insight")}</p>
            <Sparkles size={14} className="text-white/60" />
          </div>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            {hasRecentStreams ? (
              <>
                <p>{t("analytics.bestTime", "Best time to stream")}: <span className="text-white font-semibold">{peakTime}</span></p>
                <p>{t("analytics.bestPlatform", "Best platform today")}: <span className="text-white font-semibold">Twitch</span></p>
                <p>{t("analytics.viewerPeak", "Viewer peak")}: <span className="text-white font-semibold">{peakTime}</span></p>
              </>
            ) : (
              <p className="text-white/60">{t("analytics.noInsights", "No insights yet. Stream to generate analytics.")}</p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-8 grid grid-cols-1 gap-6">
        <div className="saas-card">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">{chartConfig[activeChart].label}</p>
            <div className="flex items-center gap-2">
              {(Object.keys(chartConfig) as ChartType[]).map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={activeChart === key ? "secondary" : "ghost"}
                  onClick={() => setActiveChart(key)}
                  className={cn("gap-2", activeChart === key && "bg-white/10")}
                >
                  {chartConfig[key].icon}
                  <span className="hidden md:inline">{chartConfig[key].label}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === "followers" ? (
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey={activeChart} stroke={chartConfig[activeChart].color} strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey={activeChart} fill={chartConfig[activeChart].color} radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-8">
        {hasData ? <ActivityMap /> : <div className="saas-card text-sm text-muted-foreground">{t("analytics.noHeatmap", "No data for heatmap yet.")}</div>}
      </motion.div>

      <motion.div variants={item} className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="saas-card lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("analytics.platformComparison", "Platform comparison")}</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformComparison}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#9146FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="saas-card">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("analytics.donutChart", "Donut chart")}</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {hasData ? (
        <>
          <motion.div variants={item} className="mb-8"><ViewerChart loading={isLoading} data={timeline} showCombined={combinedChart} /></motion.div>
          <motion.div variants={item} className="mb-8"><PredictionCard data={timeline} liveViewers={0} isLive={false} /></motion.div>
          <motion.div variants={item} className="mb-8"><StreamSeriesRail data={timeline} /></motion.div>
          <motion.div variants={item} className="mb-8"><LiveEventsFeed /></motion.div>

          <motion.div variants={item} className="rounded-2xl border border-border/60 bg-card/65 py-6 text-center font-mono text-sm text-muted-foreground">
            {t("analytics.sessions")}: {data?.streams_count ?? 0} | {t("analytics.peak")}: {peak}
          </motion.div>
        </>
      ) : (
        <EmptyState icon={PieChart} title={t("analytics.emptyTitle")} description={t("analytics.emptyDescription")} />
      )}
    </motion.div>
  );
}
