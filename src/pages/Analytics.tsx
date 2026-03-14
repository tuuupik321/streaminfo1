import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, CalendarDays, Download, PieChart, Sparkles, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { makeFadeUp, makeStagger } from "@/shared/motion";
import { ActivityMap } from "@/components/dashboard/ActivityMap";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useI18n } from "@/lib/i18n";
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

const periods = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
  { value: "all", label: "Всё время" },
] as const;

function HeatmapPreview() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 28 }).map((_, index) => (
        <div
          key={index}
          className="aspect-square rounded-xl border border-white/8 bg-white/[0.035]"
          style={{ opacity: 0.25 + ((index % 7) / 10) }}
        />
      ))}
    </div>
  );
}

export default function Analytics() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<(typeof periods)[number]["value"]>("30d");
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

  const platformComparison = useMemo(
    () =>
      (platformStats || [])
        .map((stat) => ({
          name: stat.platform === "youtube" ? "YouTube" : stat.platform === "kick" ? "Kick" : stat.platform === "twitch" ? "Twitch" : stat.platform,
          value: stat.streams > 0 ? Math.round(stat.views / stat.streams) : 0,
        }))
        .filter((item) => Boolean(item.name)),
    [platformStats],
  );

  const donutData = useMemo(
    () =>
      [
        { name: "Twitch", value: platformStats?.find((item) => item.platform === "twitch")?.views ?? 0, color: "#9146FF" },
        { name: "YouTube", value: platformStats?.find((item) => item.platform === "youtube")?.views ?? 0, color: "#FF0000" },
        { name: "Kick", value: platformStats?.find((item) => item.platform === "kick")?.views ?? 0, color: "#53FC18" },
      ].filter((item) => item.value > 0),
    [platformStats],
  );

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  const exportCsv = () => {
    const rows = [["time", "viewers"], ...timeline.map((entry) => [entry.time, String(entry.viewers)])];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return <EmptyState icon={BarChart3} title={t("analytics.errorTitle", "Не удалось загрузить аналитику")} description={t("analytics.errorDescription", "Проверьте подключение и попробуйте снова.")} />;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-[1520px] px-2.5 py-2.5 pb-24 sm:px-4 sm:py-3 md:px-6 md:py-6 lg:px-8">
      <motion.div variants={item} className="mb-5 flex flex-col gap-3 sm:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Аналитика</div>
          <h1 className="mt-2 text-xl font-black font-heading md:text-2xl">Главный экран аналитики</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Сначала короткий итог, потом лучшие часы для запуска, сравнение платформ и подсказка, что делать дальше.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
          {periods.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={period === option.value ? "default" : "outline"}
              onClick={() => setPeriod(option.value)}
              className="shrink-0 gap-2"
            >
              <CalendarDays size={14} /> {option.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={exportCsv} className="hidden shrink-0 gap-2 text-muted-foreground sm:inline-flex">
            <Download size={14} /> CSV
          </Button>
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
        <motion.div variants={item} className="space-y-5">
          <div className="saas-card">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Аналитика появится после первого эфира</p>
                <h2 className="mt-3 text-2xl font-bold text-white">Подключите платформу и завершите хотя бы одну трансляцию</h2>
                <p className="mt-3 text-sm text-white/65">
                  После этого вы увидите средний онлайн, рост зрителей, heatmap по времени и AI-рекомендации.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button className="w-full sm:w-auto" onClick={() => navigate("/integrations")}>Подключить платформу</Button>
                  <Button className="w-full sm:w-auto" variant="outline" onClick={() => navigate("/info")}>Как это работает</Button>
                </div>
              </div>
              <div className="grid min-w-[240px] gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 lg:w-[320px]">
                <div className="rounded-2xl border border-white/8 bg-black/10 p-3 text-sm text-white/60">Средний онлайн</div>
                <div className="rounded-2xl border border-white/8 bg-black/10 p-3 text-sm text-white/60">Рост зрителей</div>
                <div className="rounded-2xl border border-white/8 bg-black/10 p-3 text-sm text-white/60">AI-рекомендации</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="saas-card lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Preview</p>
                  <h3 className="mt-2 text-base font-semibold">Рост зрителей</h3>
                </div>
                <TrendingUp size={16} className="text-white/55" />
              </div>
              <div className="h-72 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex h-full items-end gap-3">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="flex-1 rounded-t-full bg-white/10" style={{ height: `${30 + (index % 5) * 12}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="saas-card">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">AI-анализ</p>
              <h3 className="mt-2 text-base font-semibold">Пока мало данных для AI-анализа</h3>
              <p className="mt-3 text-sm text-white/65">
                Подключите канал и завершите 1-2 эфира - после этого появятся рекомендации по времени, удержанию и росту зрителей.
              </p>
              <Button className="mt-5 w-full" onClick={() => navigate("/integrations")}>Подключить платформу</Button>
            </div>
          </div>
        </motion.div>
      ) : null}

      {hasData ? (
        <>
          <motion.div variants={item} className="mb-5 grid grid-cols-1 gap-3 sm:mb-8 md:grid-cols-3 md:gap-5">
            <div className="saas-card">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Средний онлайн</p>
              <div className="mt-4 text-3xl font-bold text-white">{averageOnline.toLocaleString("ru-RU")}</div>
              <p className="mt-2 text-sm text-white/60">Средний онлайн за последние {period === "7d" ? "7 дней" : period === "90d" ? "90 дней" : period === "all" ? "всё время" : "30 дней"}</p>
            </div>
            <div className="saas-card">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Пик за 30 дней</p>
              <div className="mt-4 text-3xl font-bold text-white">{peak.toLocaleString("ru-RU")}</div>
              <p className="mt-2 text-sm text-white/60">Максимум на последних завершённых эфирах</p>
            </div>
            <div className="saas-card">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Лучшее время для эфира</p>
              <div className="mt-4 text-3xl font-bold text-white">{peakTime}</div>
              <p className="mt-2 text-sm text-white/60">Чаще всего именно в это окно зрители остаются дольше</p>
            </div>
          </motion.div>

          <motion.div variants={item} className="mb-5 grid grid-cols-1 gap-3.5 lg:grid-cols-3 lg:gap-6 sm:mb-8">
            <div className="saas-card lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Рост зрителей</p>
                  <h3 className="mt-2 text-base font-semibold">Как меняется онлайн по времени</h3>
                </div>
                <TrendingUp size={16} className="text-white/55" />
              </div>
              <div className="mt-5 h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="viewers" stroke="#9146FF" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-sm text-white/62">Самый заметный рост был по средам вечером.</p>
            </div>

            <div className="saas-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">AI-инсайт</p>
                  <h3 className="mt-2 text-base font-semibold">Короткий итог</h3>
                </div>
                <Sparkles size={16} className="text-white/55" />
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                <p>Лучшее время для запуска сейчас около <span className="font-semibold text-white">{peakTime}</span>.</p>
                <p>Если хотите увеличить удержание, запланируйте анонс за 20-30 минут до старта.</p>
                <p>Следующий полезный шаг: проверьте интеграции, чтобы собрать аналитику по всем площадкам.</p>
              </div>
              <Button variant="outline" className="mt-5 w-full" onClick={() => navigate("/integrations")}>Подключить платформу</Button>
            </div>
          </motion.div>

          <motion.div variants={item} className="mb-5 grid grid-cols-1 gap-3.5 lg:grid-cols-3 lg:gap-6 sm:mb-8">
            <div className="saas-card lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Heatmap</p>
                  <h3 className="mt-2 text-base font-semibold">Лучшие часы для запуска</h3>
                </div>
                <BarChart3 size={16} className="text-white/55" />
              </div>
              <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-3 sm:p-4">
                {(data?.streams_count ?? 0) >= 2 ? <ActivityMap /> : <HeatmapPreview />}
              </div>
              <p className="mt-4 text-sm text-white/60">
                {(data?.streams_count ?? 0) >= 2
                  ? "Карта уже показывает, в какие часы запускаться выгоднее всего."
                  : "Здесь появится карта лучших часов для запуска, когда накопится история эфиров."}
              </p>
              {(data?.streams_count ?? 0) < 2 ? (
                <Button variant="outline" className="mt-4" onClick={() => navigate("/info")}>Как собрать данные</Button>
              ) : null}
            </div>

            <div className="saas-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Сводка</p>
                  <h3 className="mt-2 text-base font-semibold">Что уже видно</h3>
                </div>
                <Users size={16} className="text-white/55" />
              </div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                <p>Лучшее время для эфира: <span className="font-semibold text-white">{peakTime}</span></p>
                <p>Пик за выбранный период: <span className="font-semibold text-white">{peak.toLocaleString("ru-RU")}</span></p>
                <p>Следующий шаг: закрепите время старта и соберите анонс заранее.</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 gap-3.5 lg:grid-cols-3 lg:gap-6">
            <div className="saas-card lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Сравнение платформ</p>
                  <h3 className="mt-2 text-base font-semibold">Сравнение по среднему отклику за последние 30 дней</h3>
                </div>
                <BarChart3 size={16} className="text-white/55" />
              </div>
              <div className="mt-5 h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformComparison}>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#9146FF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-sm text-white/60">Сравнение показывает, где эфиры получают лучший средний отклик по просмотрам на один запуск.</p>
            </div>

            <div className="saas-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Распределение просмотров</p>
                  <h3 className="mt-2 text-base font-semibold">Как делится внимание</h3>
                </div>
                <PieChart size={16} className="text-white/55" />
              </div>
              <div className="mt-5 h-56 sm:h-64">
                {donutData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={4}>
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/10 text-sm text-white/50">
                    Данные по платформам появятся после подключения хотя бы одной площадки.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </motion.div>
  );
}
