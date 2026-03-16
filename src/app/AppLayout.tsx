import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import { useRef } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { GlobalStatusBar } from "@/components/GlobalStatusBar";
import { BottomNav } from "@/components/BottomNav";
import { CommandPalette } from "@/components/CommandPalette";
import { PartnerBanner } from "@/components/PartnerBanner";
import { PageTransition } from "@/components/PageTransition";
import { QuickGearMenu } from "@/components/QuickGearMenu";
import { SettingsModal } from "@/components/SettingsModal";
import { TelegramOnboarding } from "@/components/TelegramOnboarding";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<DOMRect | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();
  const { t } = useI18n();

  const headerContent = useMemo(() => {
    if (location.pathname.startsWith("/info")) {
      return {
        eyebrow: t("header.info.eyebrow", "Overview"),
        title: t("header.info.title", "Stream overview"),
        description: t("header.info.description", "Key stream metrics, clicks, and support in one view."),
        chip: t("header.info.chip", "Updates in real time"),
      };
    }
    if (location.pathname.startsWith("/analytics")) {
      return {
        eyebrow: t("header.analytics.eyebrow", "Analytics"),
        title: t("header.analytics.title", "Growth and best windows"),
        description: t("header.analytics.description", "Average viewers, peaks, and best hours to go live."),
        chip: t("header.analytics.chip", "Periods: 7 / 30 / 90 days / all time"),
      };
    }
    if (location.pathname.startsWith("/donations")) {
      return {
        eyebrow: t("header.donations.eyebrow", "Support"),
        title: t("header.donations.title", "Donations and active viewers"),
        description: t("header.donations.description", "Donation history, averages, and top supporters in one screen."),
        chip: t("header.donations.chip", "Next step: connect a donation service"),
      };
    }
    if (location.pathname.startsWith("/announcements")) {
      return {
        eyebrow: t("header.announcements.eyebrow", "Announcements"),
        title: t("header.announcements.title", "Announcements hub"),
        description: t("header.announcements.description", "Short text, a CTA, and a link for channel or mini app."),
        chip: t("header.announcements.chip", "One announcement = one clear action"),
      };
    }
    if (location.pathname.startsWith("/integrations")) {
      return {
        eyebrow: t("header.integrations.eyebrow", "Integrations"),
        title: t("header.integrations.title", "Platforms and services"),
        description: t("header.integrations.description", "Connect platforms, donations, and notifications for the full picture."),
        chip: t("header.integrations.chip", "Connections unlock more mini app blocks"),
      };
    }
    if (location.pathname.startsWith("/settings")) {
      return {
        eyebrow: t("header.settings.eyebrow", "Settings"),
        title: t("header.settings.title", "Quick settings"),
        description: t("header.settings.description", "Theme, language, and integrations without extra depth."),
        chip: t("header.settings.chip", "Change only what impacts the experience"),
      };
    }
    if (location.pathname.startsWith("/support")) {
      return {
        eyebrow: t("header.support.eyebrow", "Support"),
        title: t("header.support.title", "Contact the team"),
        description: t("header.support.description", "Describe an issue or idea and get a reply here."),
        chip: t("header.support.chip", "Add steps, screen, and expected result"),
      };
    }
    if (location.pathname.startsWith("/admin")) {
      return {
        eyebrow: t("header.admin.eyebrow", "Admin"),
        title: t("header.admin.title", "Control center"),
        description: t("header.admin.description", "Support, monitoring, and actions for the project team."),
        chip: t("header.admin.chip", "Admin access only"),
      };
    }
    if (location.pathname.startsWith("/live")) {
      return {
        eyebrow: t("header.live.eyebrow", "Live"),
        title: t("header.live.title", "Live pulse"),
        description: t("header.live.description", "Chat activity and key live signals in one screen."),
        chip: t("header.live.chip", "Next step: respond to chat"),
      };
    }
    if (location.pathname.startsWith("/bridge")) {
      return {
        eyebrow: t("header.bridge.eyebrow", "Bridge"),
        title: t("header.bridge.title", "Audience route"),
        description: t("header.bridge.description", "How to connect platforms, Telegram, and announcements."),
        chip: t("header.bridge.chip", "Next step: open integrations"),
      };
    }
    if (location.pathname.startsWith("/design-agent")) {
      return {
        eyebrow: t("header.designAgent.eyebrow", "Workflow"),
        title: t("header.designAgent.title", "Local design loop"),
        description: t("header.designAgent.description", "How we work with localhost, diff, and live UI checks."),
        chip: t("header.designAgent.chip", "Local preview beats static mocks"),
      };
    }
    if (location.pathname.startsWith("/legacy")) {
      return {
        eyebrow: t("header.legacy.eyebrow", "Legacy"),
        title: t("header.legacy.title", "Archive screen"),
        description: t("header.legacy.description", "Old dashboard kept for reference and comparisons."),
        chip: t("header.legacy.chip", "Main dashboard lives on the new flow"),
      };
    }
    return {
      eyebrow: t("header.default.eyebrow", "Telegram Mini App"),
      title: t("header.default.title", "StreamsInfo"),
      description: t("header.default.description", "Stream overview, history, and analytics in one place."),
      chip: t("header.default.chip", "Available on web and Telegram"),
    };
  }, [location.pathname, t]);

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-svh w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 px-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] md:px-5 md:pt-4">
            <div className="mx-auto flex w-full max-w-[1520px] items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,16,29,0.9),rgba(8,16,29,0.76))] px-3.5 py-2.5 shadow-[0_22px_56px_rgba(3,12,24,0.3)] backdrop-blur-2xl md:rounded-[26px] md:px-5 md:py-3.5">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground/75">
                    {headerContent.eyebrow}
                  </div>
                  <div className="text-base font-semibold text-foreground md:text-lg">{headerContent.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground/70 md:hidden">{headerContent.chip}</div>
                  <div className="hidden text-xs text-muted-foreground/75 md:block">{headerContent.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {location.pathname.startsWith("/settings") && (
                  <button
                    ref={settingsButtonRef}
                    type="button"
                    onClick={() => {
                      setSettingsAnchor(settingsButtonRef.current?.getBoundingClientRect() ?? null);
                      setSettingsOpen(true);
                    }}
                    className="group hidden items-center gap-2 rounded-full border border-primary/35 bg-primary/15 px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-[0_12px_30px_hsl(var(--primary)_/_0.28)] transition hover:bg-primary/25 md:inline-flex md:px-3"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/30">
                      <Settings size={14} className="transition-transform duration-200 group-hover:rotate-12" />
                    </span>
                    <span className="hidden sm:inline">{t("settings.quickButton", "Quick settings")}</span>
                  </button>
                )}
                <div className="hidden items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-muted-foreground md:flex">
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(74,222,128,0.55)]" />
                  {headerContent.chip}
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1520px] px-2.5 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-2.5 md:px-5 md:pb-28 md:pt-4">
            <GlobalStatusBar />
            <PartnerBanner className="mb-4" />
            <PageTransition>{children}</PageTransition>
          </div>
        </SidebarInset>

        <BottomNav />
        <TelegramOnboarding />
        <SettingsModal
          open={settingsOpen}
          anchorRect={settingsAnchor}
          onClose={() => setSettingsOpen(false)}
        />
        <div className="hidden md:block">
          <QuickGearMenu />
        </div>
        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}



