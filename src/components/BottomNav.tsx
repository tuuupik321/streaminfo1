import { motion } from "framer-motion";
import { Activity, BarChart3, Info, Settings, Star } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useRef } from "react";

const mainTabs = [
  { icon: Activity, key: "dashboard", path: "/" },
  { icon: Info, key: "info", path: "/info" },
  { icon: BarChart3, key: "analytics", path: "/analytics" },
  { icon: Star, key: "donations", path: "/donations" },
];

export function BottomNav({ onOpenSettings }: { onOpenSettings?: (anchor: DOMRect | null) => void }) {
  const location = useLocation();
  const { t } = useI18n();
  const currentPath = location.pathname;
  const settingsRef = useRef<HTMLButtonElement | null>(null);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-auto max-w-sm px-2.5 pb-[calc(env(safe-area-inset-bottom)+0.7rem)]">
        <div className="relative grid grid-cols-5 gap-0.5 rounded-[1.75rem] border border-white/8 bg-[hsl(var(--card))/0.94] p-1.5 shadow-[0_18px_48px_rgba(3,12,24,0.42)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-white/12">
          {mainTabs.map((tab) => {
            const isActive = tab.path === "/" ? currentPath === "/" : currentPath.startsWith(tab.path);
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="group relative flex h-[3.2rem] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[1.2rem]"
              >
                {isActive ? (
                  <motion.span
                    layoutId="tg-bottom-active"
                    className="absolute inset-0 rounded-[1.2rem] border border-white/10 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(0,0,0,0.18)]"
                    transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  />
                ) : null}
                <tab.icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 2}
                  className={cn(
                    "relative z-10 transition-all duration-200",
                    isActive ? "-translate-y-0.5 text-foreground" : "text-muted-foreground/90 group-active:scale-95",
                  )}
                />
                <span
                  className={cn(
                    "relative z-10 text-[9px] font-medium leading-none tracking-tight transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground/80",
                  )}
                >
                  {t(`bottomNav.${tab.key}`)}
                </span>
              </NavLink>
            );
          })}

          <button
            type="button"
            ref={settingsRef}
            onClick={() => onOpenSettings?.(settingsRef.current?.getBoundingClientRect() ?? null)}
            className="group relative flex h-[3.2rem] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[1.2rem] text-muted-foreground/90 transition-all duration-200 active:scale-95"
            aria-label={t("bottomNav.more")}
          >
            <span className="absolute inset-0 rounded-[1.2rem] transition-colors duration-200 group-hover:bg-white/[0.05]" />
            <Settings size={19} strokeWidth={2} className="relative z-10 transition-transform duration-200 group-active:rotate-12" />
            <span className="relative z-10 text-[9px] font-medium leading-none tracking-tight">{t("bottomNav.more")}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
