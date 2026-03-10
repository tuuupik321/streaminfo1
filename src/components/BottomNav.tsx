import { BarChart3, Info, LifeBuoy, MoreHorizontal, Puzzle, Settings, ShieldCheck, Star, Megaphone } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { getCurrentTelegramId, hasAdminSession, isOwnerTelegramId } from "@/lib/adminAccess";

const mainTabs = [
  { icon: Info, key: "info", path: "/" },
  { icon: BarChart3, key: "analytics", path: "/analytics" },
  { icon: Star, key: "donations", path: "/donations" },
  { icon: Megaphone, key: "announcements", path: "/announcements" },
];

const moreMenuItems = [
  { icon: Puzzle, key: "integrations", path: "/integrations" },
  { icon: Settings, key: "settings", path: "/settings" },
  { icon: LifeBuoy, key: "support", path: "/support" },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useI18n();
  const currentPath = location.pathname;
  const currentTelegramId = getCurrentTelegramId();
  const canSeeAdmin = isOwnerTelegramId(currentTelegramId) || hasAdminSession(currentTelegramId);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[calc(var(--safe-bottom)_+_0.75rem)] md:hidden">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-4">
        <div className="grid h-16 grid-cols-5 items-center rounded-2xl border border-white/10 bg-background/85 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        {mainTabs.map((tab) => {
          const isActive = tab.path === "/" ? currentPath === "/" : currentPath.startsWith(tab.path);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={cn(
                "group mx-1 flex h-12 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-white/5 active:scale-95",
                isActive && "bg-violet-500/25 text-violet-200 shadow-[0_8px_24px_rgba(124,58,237,0.35)]",
              )}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="transition-transform duration-200 group-active:scale-110" />
              <span className={cn("text-[11px] font-mono transition-colors", isActive && "font-semibold text-violet-100")}>
                {t(`bottomNav.${tab.key}`)}
              </span>
            </NavLink>
          );
        })}

        <Drawer>
          <DrawerTrigger asChild>
            <button className="group mx-1 flex h-12 flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-white/5 active:scale-95">
              <MoreHorizontal size={20} strokeWidth={1.8} className="transition-transform duration-200 group-active:scale-110" />
              <span className="text-[11px] font-mono">{t("bottomNav.more")}</span>
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t("bottomNav.menuTitle")}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <ul className="space-y-2">
                {moreMenuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                      <item.icon size={20} className="text-muted-foreground" />
                      <span>{t(`bottomNav.${item.key}`)}</span>
                    </Link>
                  </li>
                ))}
                {canSeeAdmin && (
                  <li>
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                      <ShieldCheck size={20} className="text-muted-foreground" />
                      <span>{t("bottomNav.admin")}</span>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </DrawerContent>
        </Drawer>
        </div>
      </div>
    </nav>
  );
}
