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

const fetchDonations = async (): Promise<DonationsApiResponse> => {
  const response = await fetch("/api/donations/live");
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
      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover-lift"
    >
        <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(145,70,255,0.45)]">
          {item.kind === "donation" ? <DollarSign size={16} /> : item.kind === "gift" ? <Gift size={16} /> : <UserCheck size={16} />}
        </div>
        <p className="font-semibold">{item.text}</p>
      </div>
      <div className="h-2 w-2 rounded-full bg-white/30 group-hover:bg-white/70 transition-all duration-300" />
    </motion.div>
  );
}

export default function DonationsPage() {
  const { t } = useI18n();
  const { data, isLoading, error } = useQuery<DonationsApiResponse, Error>({
    queryKey: ["donations"],
    queryFn: fetchDonations,
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

  const goalAmount = 20000;
  const totalRaised = useMemo(() => (data?.items ?? []).reduce((sum, item) => sum + item.amount, 0), [data?.items]);
  const goalPercent = Math.min(100, Math.round((totalRaised / goalAmount) * 100));

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 text-xl font-black font-heading md:text-2xl">
          {t("donations.title")}
        </motion.h1>
        <div className="space-y-4">
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
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl px-3 py-3 md:p-6">
      <motion.h1 variants={item} className="mb-5 text-xl font-black font-heading md:text-2xl">
        {t("donations.title")}
      </motion.h1>

      <motion.div variants={item} className="saas-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("donations.recent", "Recent Activity")}</p>
            <h2 className="mt-2 text-lg font-semibold">{t("donations.feedTitle", "Donations Feed")}</h2>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center liquid-glow">
            <DollarSign size={16} />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {activity.length ? (
            activity.map((item, index) => (
              <ActivityRow key={item.id} item={item} index={index} />
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
              {t("donations.emptyFeed", "No donations yet. Your feed will appear here.")}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={item} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="saas-card">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("donations.topSupporters", "Top supporters")}</p>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            {topDonors.length ? (
              topDonors.map((donor, index) => (
                <div key={donor.donor} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10" />
                  <span>{index + 1}. {donor.donor} — {new Intl.NumberFormat("ru-RU").format(donor.total)} {data?.items?.[0]?.currency || "RUB"}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/50">{t("donations.noTopSupporters", "No donors yet.")}</p>
            )}
          </div>
        </div>
        <div className="saas-card">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("donations.goalTitle", "Donation goal")}</p>
          <p className="mt-3 text-sm text-white/70">{t("donations.goalTarget", "Goal")}: {new Intl.NumberFormat("ru-RU").format(goalAmount)} {data?.items?.[0]?.currency || "RUB"}</p>
          <p className="text-sm text-white/70">{t("donations.goalProgress", "Progress")}: {new Intl.NumberFormat("ru-RU").format(totalRaised)} {data?.items?.[0]?.currency || "RUB"}</p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${goalPercent}%` }} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
