import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, CalendarDays, Clock, Download, Eye, TrendingUp, Users, PieChart, Flame, Award } from "lucide-react";
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

export default function Analytics() {
  const { t } = useI18n();
  const [period, setPeriod] = useState("today");
  const [combinedChart, setCombinedChart] = useState(false);

  const { data, isLoading, error } = useAnalyticsData(period);

  const timeline = useMemo(() => mapTimeline(data?.timeline), [data?.timeline]);
  const peak = useMemo(() => Math.max(...timeline.map((p) => p.viewers), 0), [timeline]);
  const peakTime = useMemo(() => {
    if (!timeline.length) return "20:00";
    const max = timeline.reduce((acc, cur) => (cur.viewers > acc.viewers ? cur : acc), timeline[0]);
    return max.time;
  }, [timeline]);

  const expectedViewers = useMemo(() => {
    const avg = data?.avg_peak ?? 0;
    const max = data?.max_peak ?? 0;
    if (!avg && !max) return 320;
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

  if (error) {
    return <EmptyState icon={PieChart} title={t("analytics.errorTitle", "Failed to load analytics")} description={t("analytics.errorDescription", "Check your connection and try again.")} />;
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-2xl font-black font-heading md:text-3xl">
        {t("analytics.title")}
      </motion.h1>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("analytics.streamForecast", "Stream Forecast")}</p>
          {isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-white/70">{t("analytics.expectedViewers", "Expected viewers today")}: <span className="text-white font-semibold">{expectedViewers}</span></p>
              <p className="text-sm text-white/70">{t("analytics.peakTime", "Peak time")}: <span className="text-white font-semibold">{peakTime}</span></p>
            </>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
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
              <p className="mt-3 text-sm text-white/70">{t("analytics.currentStreak", "Current streak")}: <span className="text-white font-semibold">5 days</span></p>
              <p className="text-sm text-white/70">{t("analytics.longestStreak", "Longest streak")}: <span className="text-white font-semibold">14 days</span></p>
            </>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
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
        </motion.div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger aria-label={t("analytics.periodSelectLabel")}><CalendarDays size={14} className="mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{t("analytics.periodToday")}</SelectItem>
            <SelectItem value="yesterday">{t("analytics.periodYesterday")}</SelectItem>
            <SelectItem value="7d">{t("analytics.period7d")}</SelectItem>
            <SelectItem value="30d">{t("analytics.period30d")}</SelectItem>
            <SelectItem value="all">{t("analytics.periodAll")}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv} className="gap-2" aria-label={t("analytics.exportCsv")}><Download size={14} />{t("analytics.exportCsv")}</Button>
        <Button variant="outline" onClick={exportPdf} className="gap-2" aria-label={t("analytics.exportPdf")}><Download size={14} />{t("analytics.exportPdf")}</Button>
        <Button variant={combinedChart ? "default" : "secondary"} onClick={() => setCombinedChart((v) => !v)}>
          {combinedChart ? t("analytics.hideCombined") : t("analytics.showCombined")}
        </Button>
      </div>

      {hasData ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
            <StatsCard icon={Eye} label={t("analytics.clicks")} value={data?.clicks ?? 0} delay={0} loading={isLoading} />
            <StatsCard icon={TrendingUp} label={t("analytics.peak")} value={data?.max_peak ?? 0} delay={0.08} loading={isLoading} />
            <StatsCard icon={BarChart3} label={t("analytics.average")} value={data?.avg_peak ?? 0} delay={0.16} loading={isLoading} />
            <StatsCard icon={Clock} label={t("analytics.streamHours")} value={Number(data?.hours_streamed ?? 0)} delay={0.24} loading={isLoading} />
            <StatsCard icon={Users} label={t("analytics.viewersNow")} value={0} delay={0.32} loading={isLoading} />
          </div>

          <div className="mb-8"><ViewerChart loading={isLoading} data={timeline} showCombined={combinedChart} /></div>
          <div className="mb-8"><PredictionCard data={timeline} liveViewers={0} isLive={false} /></div>
          <div className="mb-8"><StreamSeriesRail data={timeline} /></div>
          <div className="mb-8"><LiveEventsFeed /></div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="rounded-2xl border border-border/60 bg-card/65 py-6 text-center font-mono text-sm text-muted-foreground">
            {t("analytics.sessions")}: {data?.streams_count ?? 0} | {t("analytics.peak")}: {peak}
          </motion.div>
        </>
      ) : (
        <EmptyState icon={PieChart} title={t("analytics.emptyTitle")} description={t("analytics.emptyDescription")} />
      )}
    </div>
  );
}
