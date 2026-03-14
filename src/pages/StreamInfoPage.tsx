import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Copy, Gift, Link2, Radio, Send, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ViewerChart, DataPoint } from "@/components/dashboard/ViewerChart";
import { LockedOverlay } from "@/components/dashboard/LockedOverlay";
import { useI18n } from "@/lib/i18n";
import { useStreamInfo } from "@/hooks/useStreamInfo";
import { EmptyState } from "@/shared/ui/EmptyState";
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

export default function StreamInfoPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [period, setPeriod] = useState("30d");
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
  const streamUrl = data?.twitch?.url ?? "https://twitch.tv/username";

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

  const recentDonations = useMemo(() => (donationsData?.items ?? []).slice(0, 3), [donationsData?.items]);

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  if (data?.is_linked === false && !isLoading) {
    return <LockedOverlay />;
  }

  if (error) {
    return <EmptyState icon={Radio} title={t("streamInfo.errorTitle", "Не удалось загрузить дашборд")} description={t("streamInfo.errorDescription", "Проверьте подключение и попробуйте снова.")} />;
  }

  const periodOptions = [
    { value: "today", label: t("streamInfo.today", "Сегодня") },
    { value: "7d", label: t("streamInfo.d7", "7 дней") },
    { value: "30d", label: t("streamInfo.d30", "30 дней") },
    { value: "all", label: t("streamInfo.all", "Всё время") },
  ];

  const statusLine = isLive
    ? `${t("streamInfo.liveOn", "LIVE")} · ${t("streamInfo.viewersNow", "Зрителей сейчас")} ${Math.max(1, viewersNow)}`
    : t("streamInfo.liveOff", "Не в эфире");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
    } catch {
      // ignore
    }
  };

  return (
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-[1520px] px-2.5 py-2.5 pb-24 sm:px-4 sm:py-3 md:px-6 md:py-6">
      <motion.section variants={item} className={cn("saas-card relative overflow-hidden", isLive ? "pulse-live" : "")}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/45 sm:text-xs sm:tracking-[0.28em]">
              <span className={isLive ? "h-2 w-2 rounded-full bg-red-500" : "h-2 w-2 rounded-full bg-white/30"} />
              {statusLine}
            </div>
            <h2 className="mt-3 text-xl font-bold sm:text-2xl">{t("streamInfo.summaryTitle", "Сводка эфира")}</h2>
            <p className="mt-2 text-sm text-white/65">
              {t("streamInfo.summaryDesc", "Ключевые метрики по эфиру, кликам и поддержке без лишних блоков.")}
            </p>
          </div>

          <div className="grid min-w-0 gap-2 sm:grid-cols-2 md:grid-cols-1 lg:min-w-[220px]">
            <Button size="sm" onClick={() => navigate("/announcements")} className="min-h-11 justify-start gap-2 sm:justify-center md:justify-start">
              <Send size={14} /> {t("streamInfo.openAnnouncements", "Открыть анонсы")}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyLink} className="min-h-11 justify-start gap-2 sm:justify-center md:justify-start">
              <Copy size={14} /> {t("streamInfo.copyLink", "Скопировать ссылку")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/integrations")} className="min-h-11 justify-start gap-2 sm:justify-center md:justify-start">
              <Link2 size={14} /> {t("streamInfo.openIntegrations", "Интеграции")}
            </Button>
          </div>
        </div>
      </motion.section>

      <motion.div variants={item} className="mb-4 mt-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6 sm:mt-6">
        <div>
          <h1 className="text-gradient-primary text-xl">{t("streamInfo.centerTitle", "Центр эфира")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t("streamInfo.centerDesc", "Сводка, динамика и ключевые сигналы в одном экране.")}</p>
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1 md:w-auto md:flex-wrap md:overflow-visible md:pb-0">
          {periodOptions.map((option) => (
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
          <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isRefetching} className="shrink-0">
            {isRefetching ? t("streamInfo.refreshing", "Обновляем...") : t("streamInfo.refresh", "Обновить")}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-3.5 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          <ViewerChart loading={isLoading} data={timeline} />

          <motion.div variants={item} className="saas-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">{t("streamInfo.donationsBlock", "Донаты сегодня")}</p>
                <h3 className="mt-2 text-base font-semibold">{donationsToday.toLocaleString("ru-RU")} ₽</h3>
              </div>
              <Gift size={18} className="text-white/55" />
            </div>
            <div className="mt-4 space-y-2">
              {recentDonations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-3 py-4 text-sm text-white/50">
                  {t("donations.emptyFeed", "Донатов пока нет. Лента появится здесь автоматически.")}
                </div>
              ) : (
                recentDonations.map((donation) => (
                  <div key={donation.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/72">
                    <p className="font-semibold text-white">{donation.donor}</p>
                    <p className="text-xs text-white/55">{donation.amount.toLocaleString("ru-RU")} {donation.currency || "RUB"}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <motion.div variants={item}>
              <KpiTile icon={Radio} label={t("streamInfo.viewersNow", "Зрителей сейчас")} value={isLoading ? "—" : viewersNow} />
            </motion.div>
            <motion.div variants={item}>
              <KpiTile icon={Link2} label={t("streamInfo.clicks", "Клики на эфир")} value={isLoading ? "—" : clicksToday} />
            </motion.div>
            <motion.div variants={item}>
              <KpiTile icon={Gift} label={t("streamInfo.donationsToday", "Донаты сегодня")} value={isLoading ? "—" : `${donationsToday.toLocaleString("ru-RU")} ₽`} />
            </motion.div>
            <motion.div variants={item}>
              <KpiTile icon={Users} label={t("streamInfo.followers", "Фолловеры")} value={isLoading ? "—" : followers} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


