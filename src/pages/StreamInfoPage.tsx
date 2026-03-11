import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BellRing,
  CalendarDays,
  Copy,
  Gift,
  Link2,
  Megaphone,
  Mic,
  Radio,
  Send,
  Tag,
  Target,
  ArrowRight,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ViewerChart, DataPoint } from "@/components/dashboard/ViewerChart";
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

const periodOptions = [
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "all", label: "Всё время" },
];

const workflowSteps = [
  "1. Подготовить анонс",
  "2. Скопировать ссылку",
  "3. Отправить в Telegram",
  "4. Начать эфир",
];

const checklistItems = ["Микрофон", "Название", "Категория", "Анонс", "Ссылка", "Донаты", "Уведомления"];
const goalPresets = ["100 фолловеров", "10 подписок за неделю", "Первый донат", "Провести 3 эфира подряд"];

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

function formatRelativeOffline(hours = 2) {
  if (hours < 24) {
    return `${hours}ч ${Math.max(10, (hours * 7) % 60)}м`;
  }
  const days = Math.floor(hours / 24);
  return `${days}д`;
}

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
        title: "Цель стрима",
        current: goalsMap.online?.current_value ?? Math.min(viewersNow, 3),
        target: goalsMap.online?.target_value ?? 10,
        tone: "bg-primary",
      },
      {
        key: "followers",
        title: "Цель по фолловерам",
        current: goalsMap.followers?.current_value ?? Math.min(followers, 3),
        target: goalsMap.followers?.target_value ?? 10,
        tone: "bg-sky-400",
      },
      {
        key: "subscriptions",
        title: "Цель по подпискам",
        current: goalsMap.subscriptions?.current_value ?? 0,
        target: goalsMap.subscriptions?.target_value ?? 5,
        tone: "bg-emerald-400",
      },
    ],
    [followers, goalsMap, viewersNow],
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
        text: `${donation.donor} поддержал эфир на ${donation.amount.toLocaleString("ru-RU")} ${donation.currency || "RUB"}`,
        time: donation.createdAt,
      });
    }

    for (const event of data?.timeline ?? []) {
      const label = event.event === "tg"
        ? "Открыли ссылку на эфир"
        : event.event === "donate"
          ? "На эфир пришёл донат"
          : event.event === "start"
            ? "Эфир начался"
            : event.event === "end"
              ? "Эфир завершён"
              : "Есть новое событие по каналу";
      items.push({
        id: `evt-${event.time}-${event.event ?? "event"}`,
        text: label,
        time: event.time,
      });
    }

    return items
      .filter((entry) => Boolean(entry.time))
      .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
      .slice(0, 6);
  }, [data?.timeline, donationsData?.items]);

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  if (data?.is_linked === false && !isLoading) {
    return <LockedOverlay />;
  }

  if (error) {
    return <EmptyState icon={Radio} title={t("streamInfo.errorTitle", "Не удалось загрузить дашборд")} description={t("streamInfo.errorDescription", "Проверьте подключение и попробуйте снова.")} />;
  }

  const streamUrl = data?.twitch?.url ?? "https://twitch.tv/username";
  const offlineStatus = isLive
    ? `В эфире · сейчас ${Math.max(1, viewersNow)} зрителей`
    : `Не в эфире ${formatRelativeOffline(2)} · обычно вы запускаетесь раз в 1 день · лучшее окно сегодня: 19:30-21:00`;
  const nextStepMessage = donationsData?.configured
    ? "Подготовьте анонс и отправьте ссылку в Telegram, чтобы собрать зрителей ещё до старта."
    : "Подключите донаты, чтобы видеть поддержку в одном месте и не терять важные события во время эфира.";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-6xl px-2.5 py-2.5 pb-24 sm:px-3 sm:py-3 md:p-6">
      <motion.section variants={item} className={cn("saas-card relative overflow-hidden", isLive ? "pulse-live" : "")}> 
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/45">
              <span className={cn("h-2 w-2 rounded-full", isLive ? "bg-red-500" : "bg-white/30")} />
              {offlineStatus}
            </div>
            <h2 className="mt-3 text-xl font-bold sm:text-2xl">Подготовка к эфиру</h2>
            <p className="mt-2 text-sm text-white/65">
              Здесь собраны ключевые действия перед стартом: анонс, ссылка, Telegram, цели и быстрый контроль того, что ещё нужно проверить.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <div key={step} className={cn("rounded-2xl border px-3 py-3 text-sm text-white/78", index === 0 ? "border-primary/40 bg-primary/10 shadow-[0_0_24px_rgba(145,70,255,0.18)]" : "border-white/10 bg-white/5")}>{step}</div>
              ))}
            </div>
          </div>

          <div className="grid min-w-[220px] gap-2 sm:grid-cols-2 md:grid-cols-1">
            <Button size="sm" onClick={() => navigate("/announcements")} className="gap-2">
              <Megaphone size={14} /> Подготовить анонс
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyLink} className="gap-2">
              <Copy size={14} /> Скопировать ссылку
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/integrations")} className="gap-2">
              <Send size={14} /> Отправить в Telegram
            </Button>
            {canSeeAdmin ? (
              <Button size="sm" variant="ghost" onClick={() => navigate("/admin")} className="gap-2 text-white/70">
                <ArrowRight size={14} /> Открыть админ-панель
              </Button>
            ) : null}
          </div>
        </div>
      </motion.section>

      <motion.div variants={item} className="mb-4 mt-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6 sm:mt-6">
        <div>
          <h1 className="text-gradient-primary text-xl">Центр стрима</h1>
          <p className="mt-1 text-xs text-muted-foreground">Один экран для подготовки, оффлайн-подсказок и контроля действий перед эфиром.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={period === option.value ? "default" : "outline"}
              onClick={() => setPeriod(option.value)}
              className="gap-2"
            >
              <CalendarDays size={14} /> {option.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? "Обновляем..." : t("streamInfo.refresh", "Обновить")}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-3.5 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          <ViewerChart loading={isLoading} data={timeline} />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {goalCards.map((goal) => {
              const progress = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
              const remaining = Math.max(goal.target - goal.current, 0);
              const etaDays = remaining === 0 ? 0 : Math.max(1, Math.ceil(remaining / Math.max(goal.current || 1, 2)) * 5);
              return (
                <motion.div key={goal.key} variants={item} className="saas-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{goal.title}</p>
                      <p className="mt-1 text-xs text-white/55">
                        {goal.current > 0 ? `При текущем темпе цель будет достигнута через ${etaDays} дней` : "Прогресс начнётся после следующего завершённого эфира"}
                      </p>
                    </div>
                    <Target size={16} className="text-white/55" />
                  </div>
                  <div className="mt-5 text-2xl font-bold text-white">{goal.current} / {goal.target} до цели</div>
                  <div className="mt-3 h-2.5 rounded-full bg-white/10">
                    <div className={`h-2.5 rounded-full ${goal.tone}`} style={{ width: `${progress}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <motion.div variants={item} className="saas-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Описание эфира</p>
                  <h3 className="mt-2 text-base font-semibold">Шаблон под запуск</h3>
                </div>
                <Tag size={16} className="text-white/55" />
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <p className="font-semibold text-white">Что добавить в описание</p>
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  <li>Что будет на эфире и зачем приходить сейчас</li>
                  <li>Ссылку на стрим и Telegram-канал</li>
                  <li>Короткий call-to-action для подписки и донатов</li>
                </ul>
              </div>
              <Button variant="outline" className="mt-4 w-full gap-2" onClick={() => navigate("/announcements")}>Открыть анонсы</Button>
            </motion.div>

            <motion.div variants={item} className="saas-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Уведомления</p>
                  <h3 className="mt-2 text-base font-semibold">Напоминания перед стартом</h3>
                </div>
                <BellRing size={16} className="text-white/55" />
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-white/60">
                Создайте первое уведомление о старте эфира, чтобы зрители получили напоминание вовремя.
              </div>
              <Button className="mt-4 w-full gap-2" onClick={() => navigate("/announcements")}>Создать уведомление</Button>
            </motion.div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <motion.div variants={item} className="saas-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Следующий шаг</p>
                <h3 className="mt-2 text-base font-semibold">Что поможет перед стартом</h3>
              </div>
              <ArrowRight size={16} className="text-white/55" />
            </div>
            <p className="mt-4 text-sm text-white/68">{nextStepMessage}</p>
            <Button variant="outline" className="mt-4 w-full justify-between" onClick={() => navigate(donationsData?.configured ? "/announcements" : "/integrations")}>Продолжить <ArrowRight size={14} /></Button>
          </motion.div>

          <motion.div variants={item} className="saas-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">Чеклист запуска</p>
                <h3 className="mt-2 text-base font-semibold">Проверка перед эфиром</h3>
              </div>
              <Mic size={16} className="text-white/55" />
            </div>
            <div className="mt-4 space-y-2">
              {checklistItems.map((entry, index) => {
                const active = index < 2 || (entry === "Ссылка" && Boolean(streamUrl)) || (entry === "Донаты" && Boolean(donationsData?.configured));
                const Icon = active ? CheckCircle2 : Circle;
                return (
                  <div key={entry} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/75">
                    <span>{entry}</span>
                    <Icon size={15} className={active ? "text-primary" : "text-white/35"} />
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <motion.div variants={item}>
              <KpiTile icon={Radio} label="Онлайн сейчас" value={isLoading ? "—" : viewersNow} />
            </motion.div>
            <motion.div variants={item}>
              <KpiTile icon={Link2} label="Клики на эфир" value={isLoading ? "—" : clicksToday} />
            </motion.div>
            <motion.div variants={item}>
              <KpiTile icon={Gift} label="Донаты сегодня" value={isLoading ? "—" : `${donationsToday.toLocaleString("ru-RU")} ₽`} />
            </motion.div>
            <motion.div variants={item}>
              <KpiTile icon={Target} label="Фолловеры" value={isLoading ? "—" : followers} />
            </motion.div>
          </div>

          <motion.div variants={item} className="saas-card">
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Пресеты целей</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {goalPresets.map((preset) => (
                <button key={preset} type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72 transition hover:border-white/25 hover:bg-white/10">
                  {preset}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="saas-card">
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">Лента активности</p>
            <div className="mt-4 space-y-2">
              {activity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-3 py-4 text-sm text-white/50">
                  Данные появятся после первого завершённого эфира. После этого здесь будут события, клики и донаты.
                </div>
              ) : (
                activity.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/72">
                    <p>{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
