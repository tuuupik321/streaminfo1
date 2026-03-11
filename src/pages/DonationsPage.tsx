import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DollarSign, Gift, UserCheck } from "lucide-react";
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
      return [
        { id: "demo-1", text: "John donated 750 ₽", kind: "donation" },
        { id: "demo-2", text: "Mike subscribed", kind: "subscription" },
        { id: "demo-3", text: "Alex gifted 5 subs", kind: "gift" },
        { id: "demo-4", text: "Kate donated 420 ₽", kind: "donation" },
      ];
    }
    return data.items.map((donation) => ({
      id: donation.id,
      text: `${donation.donor} ${t("donations.donated", "donated")} ${donation.amount.toLocaleString()} ₽`,
      kind: "donation",
    }));
  }, [data?.items, t]);

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

  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

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
          {activity.map((item, index) => (
            <ActivityRow key={item.id} item={item} index={index} />
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="saas-card">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("donations.topSupporters", "Top supporters")}</p>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10" />
              <span>1. Alex — 12 000 ₽</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10" />
              <span>2. Mike — 8 000 ₽</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10" />
              <span>3. Sam — 4 400 ₽</span>
            </div>
          </div>
        </div>
        <div className="saas-card">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("donations.goalTitle", "Donation goal")}</p>
          <p className="mt-3 text-sm text-white/70">{t("donations.goalTarget", "Goal")}: 20 000 ₽</p>
          <p className="text-sm text-white/70">{t("donations.goalProgress", "Progress")}: 12 400 ₽</p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-emerald-400" style={{ width: "62%" }} />
          </div>
        </div>
        <div className="saas-card">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("donations.obsWidget", "OBS Widget")}</p>
          <p className="mt-3 text-sm text-white/70">{t("donations.obsCopy", "Copy OBS widget link")}</p>
          <Button size="sm" variant="outline" className="mt-3 w-full">{t("donations.obsCopyButton", "Copy widget link")}</Button>
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">{t("donations.obsPreview", "Preview widget")}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
