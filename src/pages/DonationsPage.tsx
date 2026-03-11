import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DollarSign, Gift, UserCheck, WalletCards, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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

type ActivityItem = {
  id: string;
  text: string;
  kind: "donation" | "subscription" | "gift";
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

function ActivityRow({ item, index }: { item: ActivityItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group flex items-center justify-between rounded-[1.1rem] border border-white/10 bg-white/5 px-3 py-2.5 text-[13px] text-white/80 hover-lift sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-white/10 shadow-[0_0_20px_rgba(145,70,255,0.45)] sm:h-10 sm:w-10 sm:rounded-xl">
          {item.kind === "donation" ? <DollarSign size={16} /> : item.kind === "gift" ? <Gift size={16} /> : <UserCheck size={16} />}
        </div>
        <p className="font-semibold">{item.text}</p>
      </div>
      <div className="h-2 w-2 rounded-full bg-white/30 transition-all duration-300 group-hover:bg-white/70" />
    </motion.div>
  );
}

export default function DonationsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;
  const initData = tg?.initData || "";

  const { data, isLoading, error } = useQuery<DonationsApiResponse, Error>({
    queryKey: ["donations"],
    queryFn: () => fetchDonations(userId!, initData),
    enabled: !!userId && !!initData,
    refetchInterval: 15_000,
  });

  const activity = useMemo<ActivityItem[]>(() => {
    if (!data?.items?.length) {
      return [];
    }
    return data.items.map((donation) => ({
      id: donation.id,
      text: `${donation.donor} поддержал эфир на ${new Intl.NumberFormat("ru-RU").format(donation.amount)} ${donation.currency || "RUB"}`,
      kind: "donation",
    }));
  }, [data?.items]);

  const topDonors = useMemo(() => {
    if (!data?.items?.length) return [];
    const totals = data.items.reduce<Record<string, number>>((acc, item) => {
      acc[item.donor] = (acc[item.donor] || 0) + item.amount;
      return acc;
    }, {});
    return Object.entries(totals)
      .map(([donor, total]) => ({ donor, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [data?.items]);

  const summary = useMemo(() => {
    const now = Date.now();
    const items = data?.items ?? [];
    const today = items.filter((item) => now - Date.parse(item.createdAt) < 24 * 60 * 60 * 1000);
    const week = items.filter((item) => now - Date.parse(item.createdAt) < 7 * 24 * 60 * 60 * 1000);
    const totalWeek = week.reduce((sum, item) => sum + item.amount, 0);
    const averageDonation = items.length ? Math.round(items.reduce((sum, item) => sum + item.amount, 0) / items.length) : 0;
    const topDonor = topDonors[0]?.donor ?? "—";
    return [
      { label: "Сегодня", value: `${today.reduce((sum, item) => sum + item.amount, 0).toLocaleString("ru-RU")} ₽` },
      { label: "За неделю", value: `${totalWeek.toLocaleString("ru-RU")} ₽` },
      { label: "Средний донат", value: `${averageDonation.toLocaleString("ru-RU")} ₽` },
      { label: "Топ донатер", value: topDonor },
    ];
  }, [data?.items, topDonors]);

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-2.5 py-2.5 pb-24 sm:px-3 sm:py-3 md:p-8">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 font-heading text-xl font-black md:text-2xl">
          {t("donations.title")}
        </motion.h1>
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={DollarSign} title={t("donations.errorTitle", "Не удалось загрузить донаты")} description={t("donations.errorDescription", "Проверьте подключение и попробуйте снова.")} />;
  }

  if (!data?.configured) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl px-2.5 py-2.5 pb-24 sm:px-3 sm:py-3 md:p-6">
        <motion.div variants={item} className="saas-card text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/80">
            <WalletCards size={24} />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Сервис донатов не подключен</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/65">
            Подключите DonationAlerts, Boosty или другой источник, чтобы видеть поддержку в одном месте.
          </p>
          <Button className="mt-5 gap-2" onClick={() => navigate("/integrations")}>Подключить сервис <ArrowRight size={14} /></Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-4xl px-2.5 py-2.5 pb-24 sm:px-3 sm:py-3 md:p-6">
      <motion.div variants={item} className="mb-4 sm:mb-6">
        <h1 className="font-heading text-xl font-black md:text-2xl">Донаты</h1>
        <p className="mt-2 text-sm text-muted-foreground">Здесь собраны история поддержки, средний донат и зрители, которые помогают чаще всего.</p>
      </motion.div>

      <motion.div variants={item} className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 sm:mb-6">
        {summary.map((card) => (
          <div key={card.label} className="saas-card min-h-[118px]">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">{card.label}</p>
            <div className="mt-4 text-2xl font-bold text-white">{card.value}</div>
          </div>
        ))}
      </motion.div>

      {activity.length === 0 ? (
        <motion.div variants={item} className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
          <div className="saas-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white/80">
                <Gift size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Пока пусто</p>
                <h2 className="mt-1 text-lg font-semibold">Донатов пока не было</h2>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/65">
              Когда зрители начнут поддерживать эфиры, здесь появятся история, топ донатеры и средняя сумма.
            </p>
          </div>
          <div className="saas-card">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Топ донатеры</p>
            <p className="mt-4 text-sm text-white/60">После первых 3 донатов здесь появится рейтинг самых активных зрителей.</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.55fr,1fr] lg:gap-6">
          <motion.div variants={item} className="saas-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Сегодня</p>
                <h2 className="mt-2 text-lg font-semibold">Лента донатов</h2>
              </div>
              <div className="liquid-glow flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
              {activity.map((entry, index) => <ActivityRow key={entry.id} item={entry} index={index} />)}
            </div>
          </motion.div>

          <motion.div variants={item} className="space-y-3.5 sm:space-y-4">
            <div className="saas-card">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Топ донатеры</p>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                {topDonors.length ? (
                  topDonors.map((donor, index) => (
                    <div key={donor.donor} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                      <span>{index + 1}. {donor.donor}</span>
                      <strong className="text-white">{new Intl.NumberFormat("ru-RU").format(donor.total)} {data?.items?.[0]?.currency || "RUB"}</strong>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/50">После первых 3 донатов здесь появится рейтинг самых активных зрителей.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
