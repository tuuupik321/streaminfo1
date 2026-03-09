import { useEffect, useState } from "react";
import { HeadphonesIcon, Link2, Settings, Settings2, ShieldCheck, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { getCurrentTelegramId, hasAdminSession, isOwnerTelegramId } from "@/lib/adminAccess";

export function QuickGearMenu() {
  const { language } = useI18n();
  const copy = {
    ru: { admin: "Админ-панель", settings: "Настройки", support: "Поддержка", integrations: "Источники" },
    en: { admin: "Admin panel", settings: "Settings", support: "Support", integrations: "Sources" },
    uk: { admin: "Адмін-панель", settings: "Налаштування", support: "Підтримка", integrations: "Джерела" },
  }[language];

  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentTelegramId = getCurrentTelegramId();
  const showAdmin = isOwnerTelegramId(currentTelegramId) || hasAdminSession(currentTelegramId);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
      <button
        type="button"
        aria-label="Quick menu"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border border-primary/35 bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 active:scale-95",
          open && "rotate-90",
        )}
      >
        {open ? <X size={20} /> : <Settings2 size={20} />}
      </button>

      <div
        className={cn(
          "pointer-events-none absolute bottom-14 right-0 w-56 origin-bottom-right translate-y-2 scale-95 rounded-2xl border border-border/60 bg-card/95 p-2 opacity-0 shadow-xl backdrop-blur transition-all duration-300",
          open && "pointer-events-auto translate-y-0 scale-100 opacity-100",
        )}
      >
        {showAdmin && (
          <Link to="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 hover:bg-primary/10 active:scale-[0.98]">
            <ShieldCheck size={16} className="text-primary" />
            <span>{copy.admin}</span>
          </Link>
        )}
        <Link to="/settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 hover:bg-primary/10 active:scale-[0.98]">
          <Settings size={16} className="text-primary" />
          <span>{copy.settings}</span>
        </Link>
        <Link to="/support" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 hover:bg-primary/10 active:scale-[0.98]">
          <HeadphonesIcon size={16} className="text-primary" />
          <span>{copy.support}</span>
        </Link>
        <Link to="/integrations" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 hover:bg-primary/10 active:scale-[0.98]">
          <Link2 size={16} className="text-primary" />
          <span>{copy.integrations}</span>
        </Link>
      </div>
    </div>
  );
}
