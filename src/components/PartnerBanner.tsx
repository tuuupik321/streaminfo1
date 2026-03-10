import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type PartnerBannerProps = {
  collapsed?: boolean;
  className?: string;
};

export function PartnerBanner({ collapsed = false, className }: PartnerBannerProps) {
  const [icon, setIcon] = useState("");
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase.from("settings").select("key, value").in("key", ["partner_icon", "partner_link", "partner_title"]);
      if (data && alive) {
        for (const row of data) {
          if (row.key === "partner_icon") setIcon(row.value);
          if (row.key === "partner_link") setLink(row.value);
          if (row.key === "partner_title") setTitle(row.value);
        }
      }
    };
    void load();
    return () => { alive = false; };
  }, []);

  if (!link || !title) return null;

  if (collapsed) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/50 transition-colors hover:bg-secondary", className)}
      >
        {icon ? <img src={icon} alt={title} className="h-5 w-5 object-contain" /> : "🤝"}
      </a>
    );
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("group mx-2 mb-2 flex items-center gap-3 rounded-lg bg-secondary/50 p-2.5 transition-colors hover:bg-secondary", className)}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background/50">
        {icon ? <img src={icon} alt={title} className="h-5 w-5 object-contain" /> : "🤝"}
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">Партнерская ссылка</p>
      </div>
      <ExternalLink size={14} className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}
