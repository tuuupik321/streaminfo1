import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { makeFadeUp, makeStagger } from "@/shared/motion";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useI18n } from "@/lib/i18n";

type TimelineItem = {
  time: string;
  viewers: number;
  event?: string | null;
};

const periods = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
  { value: "all", label: "Всё время" },
] as const;

export default function Analytics() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<(typeof periods)[number]["value"]>("30d");
  const { data, isLoading, error } = useAnalyticsData(period);
  const timeline = useMemo(
    () =>
      (data?.timeline || []).map((item: TimelineItem, index) => ({
        time: new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.time)),
        viewers: item.viewers,
        growth: item.viewers + index,
      })),
    [data?.timeline],
  );

  const hasData = !isLoading && (data?.streams_count ?? 0) > 0 && timeline.length > 0;
  const peak = useMemo(() => Math.max(...timeline.map((point) => point.viewers), 0), [timeline]);
  const averageOnline = useMemo(() => {
    if (!timeline.length) return 0;
    return Math.round(timeline.reduce((sum, point) => sum + point.viewers, 0) / timeline.length);
  }, [timeline]);
  const peakTime = useMemo(() => {
    if (!timeline.length) return "20:00";
    return timeline.reduce((best, point) => (point.viewers > best.viewers ? point : best), timeline[0]).time;
  }, [timeline]);

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  if (error) {
    return <EmptyState icon={BarChart3} title={t("analytics.errorTitle", "Не удалось загрузить аналитику")} description={t("analytics.errorDescription", "Проверьте подключение и попробуйте снова.")} />;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-[1520px] px-2.5 py-2.5 pb-24 sm:px-4 sm:py-3 md:px-6 md:py-6 lg:px-8">
      <motion.div variants={item} className="mb-5 flex flex-col gap-3 sm:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-black font-heading md:text-2xl">Аналитика</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Короткий итог и рост онлайна по выбранному периоду.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
          {periods.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={period === option.value ? "default" : "outline"}
              onClick={() => setPeriod(option.value)}
              className="shrink-0"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-[28px]" />
          <Skeleton className="h-32 rounded-[28px]" />
          <Skeleton className="h-32 rounded-[28px]" />
        </motion.div>
      ) : null}

      {!isLoading && !hasData ? (
        <motion.div variants={item} className="saas-card">
          <h2 className="text-2xl font-bold text-white">Аналитика появится после первого эфира</h2>
          <p className="mt-3 text-sm text-white/65">Подключите платформу и завершите одну трансляцию.</p>
          <Button className="mt-5 w-full sm:w-auto" onClick={() => navigate("/integrations")}>Подключить платформу</Button>
        </motion.div>
      ) : null}

      {hasData ? (
        <>
          <motion.div variants={item} className="mb-5 grid grid-cols-1 gap-3 sm:mb-8 md:grid-cols-3 md:gap-5">
            <div className="saas-card">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Средний онлайн</p>
              <div className="mt-4 text-3xl font-bold text-white">{averageOnline.toLocaleString("ru-RU")}</div>
            </div>
            <div className="saas-card">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Пик за 30 дней</p>
              <div className="mt-4 text-3xl font-bold text-white">{peak.toLocaleString("ru-RU")}</div>
            </div>
            <div className="saas-card">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Лучшее время для эфира</p>
              <div className="mt-4 text-3xl font-bold text-white">{peakTime}</div>
            </div>
          </motion.div>

          <motion.div variants={item} className="mb-5">
            <div className="saas-card">
              <h3 className="text-base font-semibold text-white">Рост онлайна</h3>
              <div className="mt-4 h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="viewers" stroke="#9146FF" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

        </>
      ) : null}
    </motion.div>
  );
}
