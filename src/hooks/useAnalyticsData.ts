import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

type AnalyticsApiResponse = {
  streams_count?: number;
  max_peak?: number;
  avg_peak?: number;
  hours_streamed?: number;
  clicks?: number;
  timeline?: Array<{ time: string; viewers: number; event?: "start" | "end" | "tg" | "donate" | null }>;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: { id?: number } };
    };
  };
};

const fetchAnalyticsData = async (userId: number, period: string, initData: string): Promise<AnalyticsApiResponse> => {
  if (!userId || !initData) {
    return {};
  }

  const response = await fetch(`/api/analytics?user_id=${userId}&period=${period}&init_data=${encodeURIComponent(initData)}`);

  if (!response.ok) {
    throw new Error("Failed to fetch analytics data");
  }

  return response.json();
};

export function useAnalyticsData(period: string) {
  const [userId, setUserId] = useState<number | undefined>();
  const [initData, setInitData] = useState<string | undefined>();

  useEffect(() => {
    const tg = (window as TelegramWindow).Telegram?.WebApp;
    setUserId(tg?.initDataUnsafe?.user?.id);
    setInitData(tg?.initData);
  }, []);

  return useQuery<AnalyticsApiResponse, Error>({
    queryKey: ["analytics", userId, period],
    queryFn: () => fetchAnalyticsData(userId!, period, initData!),
    enabled: !!userId && !!initData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
