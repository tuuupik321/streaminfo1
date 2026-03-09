import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type PartnerBannerProps = {
  collapsed?: boolean;
  variant?: "sidebar" | "mobile";
  className?: string;
};

type SettingsRow = {
  key: string;
  value: string;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
    };
  };
};

export function PartnerBanner({ collapsed = false, variant = "sidebar", className }: PartnerBannerProps) {
  const [icon, setIcon] = useState("");
  const [link, setLink] = useState("");
  const [stats, setStats] = useState<{ impressions: number; clicks: number; ctr: number } | null>(null);

  const keys = useMemo(() => ["partner_icon", "partner_link", "partner_title", "partner_subtitle", "partner_clicks"], []);
  const isAdminSession =
    typeof window !== "undefined" &&
    sessionStorage.getItem("admin_auth") === "true" &&
    Boolean(sessionStorage.getItem("admin_token"));

  useEffect(() => {
    let alive = true;

    const applyRows = (rows: SettingsRow[]) => {
      if (!alive) return;
      for (const row of rows) {
        if (row.key === "partner_icon") setIcon(row.value);
        if (row.key === "partner_link") setLink(row.value);
      }
    };

    const load = async () => {
      const { data } = await supabase.from("settings").select("key, value").in("key", keys);
      if (data) applyRows(data as SettingsRow[]);
    };

    void load();

    const channel = supabase
      .channel("partner_banner_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, (payload) => {
        const row = payload.new as SettingsRow | null;
        if (!row || !keys.includes(row.key)) return;
        applyRows([row]);
      })
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [keys]);

  useEffect(() => {
    if (!icon) return;
    const accent = resolveAccent(icon, link);
    window.dispatchEvent(new CustomEvent("partner-accent", { detail: { accent } }));
    const initData = (window as TelegramWindow).Telegram?.WebApp?.initData || "";
    void fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "impression", init_data: initData }),
    }).catch(() => undefined);
  }, [icon, link]);

  useEffect(() => {
    if (!isAdminSession) return;
    const adminToken = sessionStorage.getItem("admin_token") || "";
    const initData = (window as TelegramWindow).Telegram?.WebApp?.initData || "";
    if (!adminToken) return;

    void fetch(
      `/api/admin/partner-stats?admin_token=${encodeURIComponent(adminToken)}&init_data=${encodeURIComponent(initData)}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setStats({
          impressions: Number(data.impressions || 0),
          clicks: Number(data.clicks || 0),
          ctr: Number(data.ctr || 0),
        });
      })
      .catch(() => undefined);
  }, [isAdminSession]);

  const handleClick = async () => {
    const initData = (window as TelegramWindow).Telegram?.WebApp?.initData || "";
    await fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "click", init_data: initData }),
    }).catch(() => undefined);

    if (isAdminSession) {
      setStats((prev) => {
        if (!prev) return prev;
        const nextClicks = prev.clicks + 1;
        const nextCtr = prev.impressions > 0 ? Number(((nextClicks / prev.impressions) * 100).toFixed(2)) : 0;
        return { ...prev, clicks: nextClicks, ctr: nextCtr };
      });
    }
  };

  if (!icon) return null;
  const iconSrc = proxiedImage(icon);

  if (variant === "mobile") {
    return (
      <a
        href={link || "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(
          "group relative block overflow-hidden rounded-[4px] border border-white/10 bg-black before:pointer-events-none before:absolute before:-inset-[1px] before:rounded-[4px] before:bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.06),rgba(255,255,255,0.24),rgba(255,255,255,0.06))] before:[animation:spin_7s_linear_infinite] before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[mask-composite:exclude] before:p-px",
          className,
        )}
      >
        <div className="relative h-36 w-full overflow-hidden rounded-[3px] bg-black shadow-[0_0_26px_rgba(255,255,255,0.08)] transition-shadow duration-200 group-hover:shadow-[0_0_34px_rgba(255,255,255,0.14)]">
          <img src={iconSrc} alt="partner" className="h-full w-full object-contain p-2" loading="lazy" />
          {isAdminSession && stats && <AdminOverlay impressions={stats.impressions} clicks={stats.clicks} ctr={stats.ctr} />}
          <ButtonCta />
        </div>
      </a>
    );
  }

  if (collapsed) {
    return (
      <a
        href={link || "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(
          "mx-1 mb-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-[3px] border border-white/15 bg-black p-0.5 shadow-[0_0_16px_rgba(255,255,255,0.08)] transition-all duration-200 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.14)]",
          className,
        )}
      >
        <img src={iconSrc} alt="partner" className="h-full w-full object-contain" loading="lazy" />
      </a>
    );
  }

  return (
    <a
      href={link || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "group relative mx-3 mb-3 block overflow-hidden rounded-[4px] border border-white/10 bg-black before:pointer-events-none before:absolute before:-inset-[1px] before:rounded-[4px] before:bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.06),rgba(255,255,255,0.24),rgba(255,255,255,0.06))] before:[animation:spin_7s_linear_infinite] before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] before:[mask-composite:exclude] before:p-px",
        className,
      )}
    >
      <div className="relative h-32 w-full overflow-hidden rounded-[3px] bg-black shadow-[0_0_24px_rgba(255,255,255,0.08)] transition-shadow duration-200 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.14)]">
        <img src={iconSrc} alt="partner" className="h-full w-full object-contain p-1.5" loading="lazy" />
        {isAdminSession && stats && <AdminOverlay impressions={stats.impressions} clicks={stats.clicks} ctr={stats.ctr} compact />}
        <ButtonCta compact />
      </div>
    </a>
  );
}

function ButtonCta({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-[3px] border border-white/70 bg-black/85 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-white uppercase transition-all duration-200 group-hover:bg-white group-hover:text-black",
        compact && "bottom-2 right-2 px-2 py-1 text-[9px]",
      )}
    >
      К ПАРТНЕРУ
      <ExternalLink size={compact ? 11 : 12} />
    </span>
  );
}

function AdminOverlay({
  impressions,
  clicks,
  ctr,
  compact = false,
}: {
  impressions: number;
  clicks: number;
  ctr: number;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute left-2 top-2 rounded-[3px] border border-white/20 bg-black/80 px-2 py-1 text-[10px] leading-tight text-white/85 backdrop-blur",
        compact && "left-1.5 top-1.5 px-1.5 py-0.5 text-[9px]",
      )}
    >
      <div>I {impressions}</div>
      <div>C {clicks}</div>
      <div>CTR {ctr}%</div>
    </div>
  );
}

function resolveAccent(image: string, href: string): string {
  const source = `${image} ${href}`.toLowerCase();
  if (source.includes("frog") || source.includes("green") || source.includes("gen")) return "152 69% 47%";
  if (source.includes("youtube") || source.includes("red")) return "0 72% 51%";
  if (source.includes("blue")) return "217 91% 60%";
  return "264 67% 63%";
}

function proxiedImage(url: string): string {
  if (!url) return url;
  const encoded = btoa(url);
  return `/api/m?u=${encodeURIComponent(encoded)}`;
}
