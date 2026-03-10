import { useEffect, useMemo, useState } from "react";
import { LiveEvent } from "@/features/live-dashboard/components/EventFeed";
import { supabase } from "@/integrations/supabase/client";

type EventLogRow = {
  id: string;
  event_type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const validTypes: LiveEvent["type"][] = ["follow", "sub", "donation", "raid"];

function toLiveEvent(row: EventLogRow): LiveEvent | null {
  const rawType = row.event_type?.toLowerCase?.() ?? "";
  const type = validTypes.find((t) => rawType.includes(t));
  if (!type) return null;

  const meta = row.metadata || {};
  const user =
    (typeof meta.user === "string" && meta.user) ||
    (typeof meta.username === "string" && meta.username) ||
    row.message?.split?.(" ")?.[0] ||
    "user";

  const event: LiveEvent = {
    id: row.id,
    type,
    user,
  };

  if (type === "donation") {
    const amount = Number(meta.amount ?? meta.sum ?? 0);
    event.amount = Number.isFinite(amount) ? amount : 0;
    event.currency = typeof meta.currency === "string" ? meta.currency : "₽";
  }
  if (type === "sub") {
    event.tier = typeof meta.tier === "string" ? meta.tier : "1";
  }
  if (type === "raid") {
    const viewers = Number(meta.viewers ?? meta.amount ?? 0);
    event.amount = Number.isFinite(viewers) ? viewers : 0;
  }

  return event;
}

export function useLiveEvents() {
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase
        .from("event_logs")
        .select("id, event_type, message, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (!alive) return;
      const mapped = (data || [])
        .map((row) => toLiveEvent(row as EventLogRow))
        .filter(Boolean) as LiveEvent[];
      setEvents(mapped);
    };

    void load();

    const channel = supabase
      .channel("live_events_feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_logs" }, (payload) => {
        const next = toLiveEvent(payload.new as EventLogRow);
        if (!next) return;
        setEvents((prev) => [next, ...prev].slice(0, 30));
      })
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return useMemo(() => events, [events]);
}
