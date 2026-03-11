import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DollarSign, Gift, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
      text: `${donation.donor} ${t("donations.donated", "donated")} ${new Intl.NumberFormat("ru-RU").format(donation.amount)} ${donation.currency || "RUB"}`,
      kind: "donation",
    }));
  }, [data?.items, t]);

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

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-2.5 py-2.5 pb-24 sm:px-3 sm:py-3 md:p-8">
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
    return <EmptyState icon={DollarSign} title={t("donations.errorTitle")} description={t("donations.errorDescription")} />;
  }

  if (!data?.configured) {
    return <EmptyState icon={Gift} title={t("donations.notConfiguredTitle")} description={t("donations.notConfiguredDescription")} />;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl px-2.5 py-2.5 pb-24 sm:px-3 sm:py-3 md:p-6">
      <motion.h1 variants={item} className="mb-4 font-heading text-xl font-black md:text-2xl">
        {t("donations.title")}
      </motion.h1>

      <motion.div variants={item} className="saas-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("donations.recent", "Recent Activity")}</p>
            <h2 className="mt-2 text-lg font-semibold">{t("donations.feedTitle", "Donations Feed")}</h2>
          </div>
          <div className="liquid-glow flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <DollarSign size={16} />
          </div>
        </div>

        <div className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
          {activity.length ? (
            activity.map((entry, index) => <ActivityRow key={entry.id} item={entry} index={index} />)
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
              {t("donations.emptyFeed", "No donations yet. Your feed will appear here.")}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={item} className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
        <div className="saas-card">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("donations.topSupporters", "Top supporters")}</p>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            {topDonors.length ? (
              topDonors.map((donor, index) => (
                <div key={donor.donor} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10" />
                  <span>
                    {index + 1}. {donor.donor} - {new Intl.NumberFormat("ru-RU").format(donor.total)} {data?.items?.[0]?.currency || "RUB"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/50">{t("donations.noTopSupporters", "No donors yet.")}</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
