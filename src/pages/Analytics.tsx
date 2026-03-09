import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, CalendarDays, Clock, Download, Eye, TrendingUp, Users, PieChart } from "lucide-react";
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

  const { data, isLoading } = useAnalyticsData(period);

  const timeline = useMemo(() => mapTimeline(data?.timeline), [data?.timeline]);
  const peak = useMemo(() => Math.max(...timeline.map((p) => p.viewers), 0), [timeline]);

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

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-2xl font-black font-heading md:text-3xl">
        {t("analytics.title")}
      </motion.h1>

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
