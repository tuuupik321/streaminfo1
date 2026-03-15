import { motion } from "framer-motion";
import { BarChart3, House, Settings, Video, Wallet } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n";

export function BottomNav({ onOpenSettings }: { onOpenSettings?: (anchor: DOMRect | null) => void }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const settingsRef = useRef<HTMLButtonElement | null>(null);
  const { t } = useI18n();
  const spring = { type: "spring", stiffness: 220, damping: 18 };
  const mainTabs = [
    { icon: House, label: t("bottomNav.dashboard", "Главная"), path: "/" },
    { icon: Video, label: t("bottomNav.info", "Эфиры"), path: "/info" },
    { icon: BarChart3, label: t("bottomNav.analytics", "Аналитика"), path: "/analytics" },
    { icon: Wallet, label: t("bottomNav.donations", "Донаты"), path: "/donations" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden" data-onboarding="bottom-nav">
      <div className="mx-auto max-w-[24rem] px-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)]">
        <div className="relative grid grid-cols-5 gap-1.5 rounded-[1.95rem] border border-white/10 bg-[hsl(var(--card))/0.96] p-2 shadow-[0_26px_60px_rgba(3,12,24,0.5)] backdrop-blur-[26px] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-white/10">
          {mainTabs.map((tab) => {
            const isActive = tab.path === "/" ? currentPath === "/" : currentPath.startsWith(tab.path);
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="group relative flex h-[3.45rem] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[1.3rem]"
              >
                {isActive ? (
                  <>
                    <motion.span
                      layoutId="tg-bottom-active-glow"
                      className="absolute inset-1 rounded-[1.1rem] bg-primary/20 blur-xl opacity-70"
                      transition={spring}
                    />
                    <motion.span
                      layoutId="tg-bottom-active"
                      className="absolute inset-0 rounded-[1.3rem] border border-primary/25 bg-primary/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_26px_hsl(var(--primary)_/_0.35)]"
                      transition={spring}
                    />
                  </>
                ) : null}
                <motion.span
                  className="relative z-10"
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -2.5 : 0 }}
                  transition={spring}
                  whileTap={{ scale: 0.95 }}
                >
                  <tab.icon
                    size={19}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "transition-colors duration-200",
                      isActive ? "text-primary drop-shadow-[0_0_10px_rgba(145,70,255,0.45)]" : "text-muted-foreground/85",
                    )}
                  />
                </motion.span>
                <span
                  className={cn(
                    "relative z-10 text-[10.5px] font-medium leading-none tracking-tight transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground/80",
                  )}
                >
                  {tab.label}
                </span>
              </NavLink>
            );
          })}

          <button
            type="button"
            ref={settingsRef}
            onClick={() => onOpenSettings?.(settingsRef.current?.getBoundingClientRect() ?? null)}
            data-onboarding="settings-tab"
            className="group relative flex h-[3.45rem] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[1.3rem] border border-emerald-400/40 bg-emerald-400/15 text-emerald-50 shadow-[0_14px_34px_rgba(16,185,129,0.35)] transition-all duration-200 active:scale-95"
            aria-label={t("bottomNav.settings", "Настройки")}
          >
            <span className="absolute inset-0 rounded-[1.3rem] bg-emerald-400/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/25">
              <Settings size={18} strokeWidth={2.1} className="transition-transform duration-200 group-active:rotate-12" />
            </span>
            <span className="relative z-10 text-[10px] font-medium leading-none tracking-tight">
              {t("bottomNav.settings", "Настройки")}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
