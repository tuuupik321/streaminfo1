import { BarChart3, DollarSign, Info, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const COPY = {
  ru: { info: "Инфо", analytics: "Аналитика", donations: "Донаты", settings: "Настройки" },
  en: { info: "Info", analytics: "Analytics", donations: "Donations", settings: "Settings" },
  uk: { info: "Інфо", analytics: "Аналітика", donations: "Донати", settings: "Налаштування" },
};

const tabs = [
  { icon: Info, key: "info" as const, path: "/" },
  { icon: BarChart3, key: "analytics" as const, path: "/analytics" },
  { icon: DollarSign, key: "donations" as const, path: "/donations" },
  { icon: Settings, key: "settings" as const, path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();
  const { language } = useI18n();
  const t = COPY[language];
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/10 bg-background/80 pb-[var(--safe-bottom)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-around">
        {tabs.map((tab) => {
          const isActive = tab.path === "/" ? currentPath === "/" : currentPath.startsWith(tab.path);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn("text-[11px] font-mono", isActive && "font-semibold")}>{t[tab.key]}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
