import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

type StatsApiResponse = {
  is_linked?: boolean;
  clicks?: number;
  twitch?: { online?: boolean; viewers?: number; followers?: number; views?: number };
  youtube?: { subscribers?: number };
};

type AnalyticsApiResponse = {
  timeline?: Array<{ time: string; viewers: number; event?: "start" | "end" | "tg" | "donate" | null }>;
};

type CombinedStreamInfo = StatsApiResponse & {
  timeline?: AnalyticsApiResponse["timeline"];
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: { id?: number } };
    };
  };
};

const fetchStreamInfo = async (userId: number, period: string, initData: string): Promise<CombinedStreamInfo> => {
  if (!userId || !initData) {
    return { is_linked: false };
  }

  const [statsResponse, analyticsResponse] = await Promise.all([
    fetch(`/api/stats?user_id=${userId}&period=${period}&init_data=${encodeURIComponent(initData)}`),
    fetch(`/api/analytics?user_id=${userId}&period=${period}&init_data=${encodeURIComponent(initData)}`),
  ]);

  if (!statsResponse.ok) {
    throw new Error("Failed to fetch stats");
  }

  const statsPayload: StatsApiResponse = await statsResponse.json();
  const analyticsPayload: AnalyticsApiResponse = analyticsResponse.ok ? await analyticsResponse.json() : {};

  return {
    ...statsPayload,
    timeline: analyticsPayload.timeline,
  };
};

export function useStreamInfo(period: string) {
  const [userId, setUserId] = useState<number | undefined>();
  const [initData, setInitData] = useState<string | undefined>();

  useEffect(() => {
    const tg = (window as TelegramWindow).Telegram?.WebApp;
    setUserId(tg?.initDataUnsafe?.user?.id);
    setInitData(tg?.initData);
  }, []);

  return useQuery<CombinedStreamInfo, Error>({
    queryKey: ["streamInfo", userId, period],
    queryFn: () => fetchStreamInfo(userId!, period, initData!),
    enabled: !!userId && !!initData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
