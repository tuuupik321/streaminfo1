import { useQuery } from "@tanstack/react-query";

export type ServiceHealthStatus = "online" | "offline" | "degraded" | "not_configured";

export type SystemServiceStatus = {
  key: string;
  name: string;
  status: ServiceHealthStatus;
  latency_ms: number | null;
  detail: string;
  configured: boolean;
  critical: boolean;
};

export type SystemSummary = {
  total: number;
  online: number;
  degraded: number;
  offline: number;
  not_configured: number;
};

export type SystemTechnicalStatus = {
  host: string | null;
  public_url: string | null;
  webhook_mode: "webhook" | "polling";
  server_time: string;
  uptime_seconds: number | null;
  uptime_label: string;
  cpu_percent: number | null;
  memory_percent: number | null;
  memory_used_mb: number | null;
  memory_total_mb: number | null;
  disk_percent: number | null;
  disk_used_gb: number | null;
  disk_total_gb: number | null;
  load_average: [number, number, number] | null;
};

export type SystemIssue = {
  key: string;
  name: string;
  status: ServiceHealthStatus;
  detail: string;
};

export type SystemStatusResponse = {
  checked_at: string;
  overall_status: "online" | "degraded" | "offline";
  summary: SystemSummary;
  stats: {
    users: number;
    active_streams: number;
  };
  issues: SystemIssue[];
  services: SystemServiceStatus[];
  technical: SystemTechnicalStatus;
  client_ping_ms: number;
};

async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const response = await fetch("/api/system_status", {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch system status");
  }

  const payload = (await response.json()) as Omit<SystemStatusResponse, "client_ping_ms">;
  const finished = typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    ...payload,
    client_ping_ms: Math.max(0, Math.round(finished - started)),
  };
}

export function useSystemStatus(enabled = true) {
  return useQuery<SystemStatusResponse, Error>({
    queryKey: ["system-status"],
    queryFn: fetchSystemStatus,
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
