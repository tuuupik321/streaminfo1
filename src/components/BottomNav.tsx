import { BarChart3, Info, Settings, Star, Megaphone } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const mainTabs = [
  { icon: Info, key: "info", path: "/" },
  { icon: BarChart3, key: "analytics", path: "/analytics" },
  { icon: Star, key: "donations", path: "/donations" },
  { icon: Megaphone, key: "announcements", path: "/announcements" },
];

export function BottomNav({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const location = useLocation();
  const { t } = useI18n();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[calc(var(--safe-bottom)_+_0.75rem)] md:hidden">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4">
        <div className="grid h-16 grid-cols-5 items-center rounded-2xl border border-white/10 bg-background/80 shadow-[0_12px_42px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        {mainTabs.map((tab) => {
          const isActive = tab.path === "/" ? currentPath === "/" : currentPath.startsWith(tab.path);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={cn(
                "group mx-1 flex h-12 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/5 active:scale-95",
                isActive && "bg-primary/20 text-primary shadow-[0_8px_24px_rgba(34,197,94,0.3)]",
              )}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="transition-transform duration-200 group-active:scale-110" />
              <span className={cn("text-[11px] font-mono transition-colors", isActive && "font-semibold text-primary")}>
                {t(`bottomNav.${tab.key}`)}
              </span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => onOpenSettings?.()}
          className="group mx-1 flex h-12 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/5 hover:text-white hover:shadow-[0_0_22px_rgba(145,70,255,0.5)] active:scale-95"
          aria-label={t("bottomNav.more")}
        >
          <Settings size={18} strokeWidth={1.8} className="transition-transform duration-200 group-active:rotate-[20deg]" />
          <span className="text-[11px] font-mono">{t("bottomNav.more")}</span>
        </button>
        </div>
      </div>
    </nav>
  );
}
