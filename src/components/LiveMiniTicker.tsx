import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Coins, Radio, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type EventLogRow = {
  id: string;
  event_type: string;
  message: string;
  metadata: unknown;
  created_at: string;
};

type StatsApiResponse = {
  twitch?: {
    viewers?: number;
  };
};

type TickerItem = {
  id: string;
  kind: "donation" | "stream" | "viewer" | "other";
  message: string;
  createdAt: string;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: {
        user?: {
          id?: number;
        };
      };
    };
  };
};

const EMPTY_LABEL = {
  ru: "Живых событий пока нет",
  en: "No live events yet",
  uk: "Живих подій поки немає",
};

const LIVE_LABEL = {
  ru: "ЖИВОЙ",
  en: "LIVE",
  uk: "ЖИВИЙ",
};

const NEW_VIEWER_TEMPLATE = {
  ru: (delta: number, total: number) => `Новые зрители: +${delta} • Онлайн: ${total}`,
  en: (delta: number, total: number) => `New viewers: +${delta} • Online: ${total}`,
  uk: (delta: number, total: number) => `Нові глядачі: +${delta} • Онлайн: ${total}`,
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const isDonation = (row: EventLogRow) => {
  const haystack = `${row.event_type} ${row.message}`.toLowerCase();
  return haystack.includes("donat") || haystack.includes("donation") || haystack.includes("донат");
};

const normalizeEvent = (row: EventLogRow): TickerItem | null => {
  const kind = row.event_type.toLowerCase();
  const metadata = asRecord(row.metadata);

  if (isDonation(row)) {
    return {
      id: row.id,
      kind: "donation",
      message: row.message || "Новый донат",
      createdAt: row.created_at,
    };
  }

  if (kind === "stream_live") {
    const username = typeof metadata.username === "string" ? metadata.username : "";
    const platform = typeof metadata.platform === "string" ? metadata.platform : "";
    const text = username ? `${username} вышел в эфир${platform ? ` (${platform})` : ""}` : row.message;
    return { id: row.id, kind: "stream", message: text, createdAt: row.created_at };
  }

  if (kind === "stream_end") {
    const username = typeof metadata.username === "string" ? metadata.username : "";
    const text = username ? `Стрим завершен: ${username}` : row.message;
    return { id: row.id, kind: "stream", message: text, createdAt: row.created_at };
  }

  if (kind.includes("stream") || kind.includes("live")) {
    return { id: row.id, kind: "stream", message: row.message, createdAt: row.created_at };
  }

  return null;
};

function getTime(iso: string, language: string) {
  return new Date(iso).toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" });
}

export function LiveMiniTicker() {
  const { language } = useI18n();
  const [items, setItems] = useState<TickerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const lastViewersRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase
        .from("event_logs")
        .select("id, event_type, message, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(40);

      if (!alive) return;
      const normalized = (data as EventLogRow[] | null)?.map(normalizeEvent).filter(Boolean) as TickerItem[] | undefined;
      setItems(normalized?.slice(0, 20) || []);
    };

    void load();

    const channel = supabase
      .channel("header_live_ticker")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_logs" }, (payload) => {
        const next = normalizeEvent(payload.new as EventLogRow);
        if (!next) return;
        setItems((prev) => [next, ...prev].slice(0, 20));
        setActiveIndex(0);
      })
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const tg = (window as TelegramWindow).Telegram?.WebApp;
    const userId = tg?.initDataUnsafe?.user?.id;
    const initData = tg?.initData || "";
    if (!userId || !initData) return;

    let alive = true;

    const loadStats = async () => {
      try {
        const response = await fetch(`/api/stats?user_id=${userId}&init_data=${encodeURIComponent(initData)}`);
        if (!response.ok) return;
        const payload: StatsApiResponse = await response.json();
        if (!alive) return;

        const viewers = Number(payload?.twitch?.viewers || 0);
        const previous = lastViewersRef.current;
        lastViewersRef.current = viewers;
        if (previous === null || viewers <= previous) return;

        const delta = viewers - previous;
        const tickerItem: TickerItem = {
          id: `viewer-${Date.now()}`,
          kind: "viewer",
          message: NEW_VIEWER_TEMPLATE[language](delta, viewers),
          createdAt: new Date().toISOString(),
        };
        setItems((prev) => [tickerItem, ...prev].slice(0, 20));
        setActiveIndex(0);
      } catch {
        // ignore fetch errors for ticker
      }
    };

    void loadStats();
    const timer = setInterval(loadStats, 45_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [language]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  const current = useMemo(() => items[activeIndex] || null, [activeIndex, items]);

  return (
    <div className="border-t border-border/50 bg-card/55 px-3 py-2">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 sm:px-1">
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
          {LIVE_LABEL[language]}
        </span>
        {current?.kind === "donation" && <Coins size={12} className="shrink-0 text-warning" />}
        {current?.kind === "stream" && <Radio size={12} className="shrink-0 text-success" />}
        {current?.kind === "viewer" && <Users size={12} className="shrink-0 text-info" />}
        {!current && <Activity size={12} className="shrink-0 text-muted-foreground" />}
        <p className="line-clamp-1 flex-1 text-xs text-foreground/90">
          {current ? current.message : EMPTY_LABEL[language]}
        </p>
        {current && <span className="text-[10px] text-muted-foreground">{getTime(current.createdAt, language)}</span>}
      </div>
    </div>
  );
}
