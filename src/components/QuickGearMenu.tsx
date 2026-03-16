import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeadphonesIcon, Link2, Megaphone, Settings, Settings2, ShieldCheck, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { getCurrentTelegramId, hasAdminSession, isOwnerTelegramId } from "@/lib/adminAccess";

export function QuickGearMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentTelegramId = getCurrentTelegramId();
  const showAdmin = isOwnerTelegramId(currentTelegramId) || hasAdminSession(currentTelegramId);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const actions = useMemo(() => {
    const base = [
      { to: "/announcements", icon: Megaphone, label: t("quickActions.announce", "Announcements") },
      { to: "/integrations", icon: Link2, label: t("quickActions.integrations", "Integrations") },
      { to: "/settings", icon: Settings, label: t("quickActions.settings", "Settings") },
      { to: "/support", icon: HeadphonesIcon, label: t("quickActions.support", "Support") },
    ];
    if (showAdmin) {
      base.push({ to: "/admin", icon: ShieldCheck, label: t("quickActions.admin", "Admin Center") });
    }
    return base;
  }, [showAdmin, t]);

  return (
    <div className="fixed bottom-[calc(5.2rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-6">
      <motion.button
        type="button"
        aria-label={t("quickActions.title", "Quick actions")}
        onClick={() => setOpen((v) => !v)}
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={cn(
          "relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(16,42,22,0.35)]",
          open && "shadow-[0_0_32px_rgba(34,197,94,0.45)]",
        )}
      >
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="inline-flex"
        >
          {open ? <X size={20} /> : <Settings2 size={20} />}
        </motion.span>
        <span className="pointer-events-none absolute -inset-2 rounded-full bg-primary/10 blur-xl" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-14 right-0 w-64 origin-bottom-right rounded-2xl border border-white/10 bg-[hsl(var(--card))/0.95] p-3 shadow-[0_24px_70px_rgba(3,12,24,0.55)] backdrop-blur-2xl"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles size={12} className="text-primary" />
              {t("quickActions.title", "Quick actions")}
            </div>
            <div className="grid gap-1.5">
              {actions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 active:scale-[0.98]"
                >
                  <action.icon size={16} className="text-primary" />
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
