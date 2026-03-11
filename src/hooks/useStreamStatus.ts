import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StreamStatus {
  platform: string;
  username: string;
  isLive: boolean;
  viewerCount?: number;
  title?: string;
  thumbnailUrl?: string;
}

interface UseStreamStatusOptions {
  accounts: { platform: string; username: string }[];
  interval?: number;
  enabled?: boolean;
}

export function useStreamStatus({ accounts, interval = 60_000, enabled = true }: UseStreamStatusOptions) {
  const [statuses, setStatuses] = useState<Record<string, StreamStatus>>({});
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const streamAccounts = useMemo(
    () => accounts.filter((a) => a.platform === "twitch" || a.platform === "youtube"),
    [accounts],
  );

  const fetchStatuses = useCallback(async () => {
    if (streamAccounts.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-stream-status", {
        body: {
          accounts: streamAccounts.map((a) => ({
            platform: a.platform,
            username: a.username,
          })),
        },
      });

      if (error) {
        console.error("Stream status error:", error);
        return;
      }

      const results: StreamStatus[] = data?.results ?? [];
      const map: Record<string, StreamStatus> = {};
      for (const r of results) {
        map[`${r.platform}:${r.username}`] = r;
      }
      setStatuses(map);
    } catch (err) {
      console.error("Stream status fetch failed:", err);
    } finally {
      setLoading(false);
    }

    try {
      await supabase.functions.invoke("monitor-streams", { body: {} });
    } catch {
      // Monitoring is best-effort and should not break the UI.
    }
  }, [streamAccounts]);

  useEffect(() => {
    if (!enabled || streamAccounts.length === 0) return;

    fetchStatuses();
    intervalRef.current = setInterval(fetchStatuses, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatuses, interval, enabled, streamAccounts.length]);

  const getStatus = (platform: string, username: string): StreamStatus | undefined =>
    statuses[`${platform}:${username}`];

  return { statuses, getStatus, loading, refetch: fetchStatuses };
}
