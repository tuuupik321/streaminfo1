import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/shared/ui/EmptyState";
import { DollarSign, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const fetchDonations = async (): Promise<DonationsApiResponse> => {
  const response = await fetch("/api/donations/live");
  if (!response.ok) {
    throw new Error("Failed to fetch donations");
  }
  return response.json();
};

function DonationCard({ donation, delay }: { donation: Donation; delay: number }) {
  const { t } = useI18n();
  const formattedDate = new Date(donation.createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-glass rounded-lg p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-bold font-heading">{donation.donor}</p>
          <p className="text-sm text-primary font-semibold">
            {donation.amount.toLocaleString()} {donation.currency}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">{formattedDate}</div>
      </div>
      {donation.message && <p className="mt-2 text-sm bg-secondary/50 p-3 rounded-md">{donation.message}</p>}
    </motion.div>
  );
}

export default function DonationsPage() {
  const { t } = useI18n();
  const { data, isLoading, error } = useQuery<DonationsApiResponse, Error>({
    queryKey: ["donations"],
    queryFn: fetchDonations,
    refetchInterval: 15_000, // Refresh every 15 seconds
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (error) {
      return <EmptyState icon={DollarSign} title={t("donations.errorTitle")} description={t("donations.errorDescription")} />;
    }

    if (!data?.configured) {
      return <EmptyState icon={Gift} title={t("donations.notConfiguredTitle")} description={t("donations.notConfiguredDescription")} />;
    }

    if (data.items.length === 0) {
      return <EmptyState icon={DollarSign} title={t("donations.emptyTitle")} description={t("donations.emptyDescription")} />;
    }

    return (
      <div className="space-y-4">
        {data.items.map((donation, index) => (
          <DonationCard key={donation.id} donation={donation} delay={index * 0.05} />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-2xl font-black font-heading md:text-3xl">
        {t("donations.title")}
      </motion.h1>
      {renderContent()}
    </div>
  );
}
