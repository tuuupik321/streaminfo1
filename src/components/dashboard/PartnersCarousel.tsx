import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";

type SettingsRow = {
  key: string;
  value: string;
};

type PartnerSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
    };
  };
};

const KEYS = [
  "partner_icon",
  "partner_link",
  "partner_title",
  "partner_subtitle",
  "partner_icon_2",
  "partner_link_2",
  "partner_title_2",
  "partner_subtitle_2",
  "partner_icon_3",
  "partner_link_3",
  "partner_title_3",
  "partner_subtitle_3",
  "partner_slides",
];

const parseSlidesJson = (raw: string | undefined): PartnerSlide[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const image = typeof row.image === "string" ? row.image : "";
        const link = typeof row.link === "string" ? row.link : "";
        if (!image || !link) return null;
        return {
          id: `json-${index}`,
          image,
          link,
          title: typeof row.title === "string" ? row.title : "Partner",
          subtitle: typeof row.subtitle === "string" ? row.subtitle : "Current offer",
        } as PartnerSlide;
      })
      .filter(Boolean) as PartnerSlide[];
  } catch {
    return [];
  }
};

export function PartnersCarousel() {
  const { t } = useI18n();
  const copy = {
    go: t("partners.go", "Реклама"),
    partner: t("partners.partner", "Партнер"),
    offer: t("partners.offer", "Актуальное предложение"),
  };

  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<{ impressions: number; clicks: number; ctr: number } | null>(null);
  const isAdminSession =
    typeof window !== "undefined" &&
    sessionStorage.getItem("admin_auth") === "true" &&
    Boolean(sessionStorage.getItem("admin_token"));

  useEffect(() => {
    let alive = true;

    const applyRows = (rows: SettingsRow[]) => {
      if (!alive) return;
      setSettingsMap((prev) => {
        const next = { ...prev };
        rows.forEach((row) => {
          next[row.key] = row.value;
        });
        return next;
      });
    };

    const load = async () => {
      const { data } = await supabase.from("settings").select("key, value").in("key", KEYS);
      if (data) applyRows(data as SettingsRow[]);
    };

    void load();

    const channel = supabase
      .channel("partners_carousel_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, (payload) => {
        const row = payload.new as SettingsRow | null;
        if (!row || !KEYS.includes(row.key)) return;
        applyRows([row]);
      })
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const slides = useMemo(() => {
    const rows = [
      {
        id: "base-1",
        image: settingsMap.partner_icon || "",
        link: settingsMap.partner_link || "",
        title: settingsMap.partner_title || copy.partner,
        subtitle: settingsMap.partner_subtitle || copy.offer,
      },
      {
        id: "base-2",
        image: settingsMap.partner_icon_2 || "",
        link: settingsMap.partner_link_2 || "",
        title: settingsMap.partner_title_2 || `${copy.partner} 2`,
        subtitle: settingsMap.partner_subtitle_2 || copy.offer,
      },
      {
        id: "base-3",
        image: settingsMap.partner_icon_3 || "",
        link: settingsMap.partner_link_3 || "",
        title: settingsMap.partner_title_3 || `${copy.partner} 3`,
        subtitle: settingsMap.partner_subtitle_3 || copy.offer,
      },
      ...parseSlidesJson(settingsMap.partner_slides),
    ];

    const deduped: PartnerSlide[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      if (!row.image || !row.link) continue;
      const key = `${row.image}::${row.link}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(row);
    }
    return deduped;
  }, [copy.offer, copy.partner, settingsMap]);

  const activeSlide = slides[0];

  useEffect(() => {
    if (!activeSlide?.image) return;
    const accent = resolveAccent(activeSlide.image, activeSlide.link);
    window.dispatchEvent(new CustomEvent("partner-accent", { detail: { accent } }));
    const initData = (window as TelegramWindow).Telegram?.WebApp?.initData || "";
    void fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "impression", init_data: initData }),
    }).catch(() => undefined);
  }, [activeSlide?.image, activeSlide?.link]);

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

  if (slides.length === 0 || !activeSlide) return null;
  const imageSrc = proxiedImage(activeSlide.image);

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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card className="card-glass group relative overflow-hidden rounded-xl">
        <CardContent className="relative p-0">
          <div className="relative h-44 w-full overflow-hidden rounded-xl bg-black/20">
            <img src={imageSrc} alt={activeSlide.title} className="h-full w-full object-contain p-2" loading="lazy" />
            {isAdminSession && stats && (
              <div className="absolute left-2 top-2 rounded-md border border-white/20 bg-black/80 px-2 py-1 text-[10px] leading-tight text-white/85 backdrop-blur">
                <div>I {stats.impressions}</div>
                <div>C {stats.clicks}</div>
                <div>CTR {stats.ctr}%</div>
              </div>
            )}
            <Button
              type="button"
              size="sm"
              asChild
              className="absolute bottom-3 right-3 h-8 rounded-md border border-white/70 bg-black/85 px-3 text-xs font-semibold tracking-widest text-white uppercase transition-all duration-200 hover:bg-white hover:text-black"
            >
              <a href={activeSlide.link} target="_blank" rel="noopener noreferrer" onClick={handleClick} className="gap-1.5">
                {copy.go} <ExternalLink size={12} />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
