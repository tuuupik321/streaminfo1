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
        eyebrow: t("header.info.eyebrow", "РЎРІРѕРґРєР°"),
        title: t("header.info.title", "РЎРІРѕРґРєР° СЌС„РёСЂР°"),
        description: t("header.info.description", "РљР»СЋС‡РµРІС‹Рµ РјРµС‚СЂРёРєРё РїРѕ СЌС„РёСЂСѓ, РєР»РёРєР°Рј Рё РїРѕРґРґРµСЂР¶РєРµ РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ."),
        chip: t("header.info.chip", "РћР±РЅРѕРІР»СЏРµС‚СЃСЏ РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё"),
      };
    }
    if (location.pathname.startsWith("/analytics")) {
      return {
        eyebrow: t("header.analytics.eyebrow", "РђРЅР°Р»РёС‚РёРєР°"),
        title: t("header.analytics.title", "Р РѕСЃС‚ Рё Р»СѓС‡С€РёРµ РѕРєРЅР°"),
        description: t("header.analytics.description", "РЎСЂРµРґРЅРёР№ РѕРЅР»Р°Р№РЅ, РїРёРєРё Рё Р»СѓС‡С€РёРµ С‡Р°СЃС‹ РґР»СЏ Р·Р°РїСѓСЃРєР° СЌС„РёСЂР°."),
        chip: t("header.analytics.chip", "РџРµСЂРёРѕРґС‹: 7 / 30 / 90 РґРЅРµР№ / РІСЃС‘ РІСЂРµРјСЏ"),
      };
    }
    if (location.pathname.startsWith("/donations")) {
      return {
        eyebrow: t("header.donations.eyebrow", "РџРѕРґРґРµСЂР¶РєР°"),
        title: t("header.donations.title", "Р”РѕРЅР°С‚С‹ Рё Р°РєС‚РёРІРЅС‹Рµ Р·СЂРёС‚РµР»Рё"),
        description: t("header.donations.description", "РСЃС‚РѕСЂРёСЏ РґРѕРЅР°С‚РѕРІ, СЃСЂРµРґРЅРёРµ СЃСѓРјРјС‹ Рё С‚РѕРї РїРѕРґРґРµСЂР¶РєРё РЅР° РѕРґРЅРѕРј СЌРєСЂР°РЅРµ."),
        chip: t("header.donations.chip", "РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі: РїРѕРґРєР»СЋС‡РёС‚СЊ СЃРµСЂРІРёСЃ РґРѕРЅР°С‚РѕРІ"),
      };
    }
    if (location.pathname.startsWith("/announcements")) {
      return {
        eyebrow: t("header.announcements.eyebrow", "РђРЅРѕРЅСЃС‹"),
        title: t("header.announcements.title", "Р¦РµРЅС‚СЂ Р°РЅРѕРЅСЃРѕРІ"),
        description: t("header.announcements.description", "РљРѕСЂРѕС‚РєРёР№ С‚РµРєСЃС‚, CTA Рё СЃСЃС‹Р»РєР° РґР»СЏ РєР°РЅР°Р»Р° РёР»Рё mini app."),
        chip: t("header.announcements.chip", "РћРґРёРЅ Р°РЅРѕРЅСЃ = РѕРґРЅРѕ РїРѕРЅСЏС‚РЅРѕРµ РґРµР№СЃС‚РІРёРµ"),
      };
    }
    if (location.pathname.startsWith("/integrations")) {
      return {
        eyebrow: t("header.integrations.eyebrow", "РРЅС‚РµРіСЂР°С†РёРё"),
        title: t("header.integrations.title", "РџР»Р°С‚С„РѕСЂРјС‹ Рё СЃРµСЂРІРёСЃС‹"),
        description: t("header.integrations.description", "РџРѕРґРєР»СЋС‡РёС‚Рµ РїР»Р°С‚С„РѕСЂРјС‹, РґРѕРЅР°С‚С‹ Рё СѓРІРµРґРѕРјР»РµРЅРёСЏ РґР»СЏ РїРѕР»РЅРѕР№ РєР°СЂС‚РёРЅС‹ СЌС„РёСЂР°."),
        chip: t("header.integrations.chip", "РџРѕРґРєР»СЋС‡РµРЅРёСЏ РѕС‚РєСЂС‹РІР°СЋС‚ РЅРѕРІС‹Рµ Р±Р»РѕРєРё mini app"),
      };
    }
    if (location.pathname.startsWith("/settings")) {
      return {
        eyebrow: t("header.settings.eyebrow", "РќР°СЃС‚СЂРѕР№РєРё"),
        title: t("header.settings.title", "Р‘С‹СЃС‚СЂС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё"),
        description: t("header.settings.description", "РўРµРјР°, СЏР·С‹Рє Рё РёРЅС‚РµРіСЂР°С†РёРё Р±РµР· Р»РёС€РЅРµР№ РіР»СѓР±РёРЅС‹."),
        chip: t("header.settings.chip", "РњРµРЅСЏР№С‚Рµ С‚РѕР»СЊРєРѕ С‚Рѕ, С‡С‚Рѕ РІР»РёСЏРµС‚ РЅР° РѕРїС‹С‚"),
      };
    }
    if (location.pathname.startsWith("/support")) {
      return {
        eyebrow: t("header.support.eyebrow", "РџРѕРґРґРµСЂР¶РєР°"),
        title: t("header.support.title", "РЎРІСЏР·СЊ СЃ РєРѕРјР°РЅРґРѕР№"),
        description: t("header.support.description", "РћРїРёС€РёС‚Рµ РїСЂРѕР±Р»РµРјСѓ РёР»Рё РёРґРµСЋ, РѕС‚РІРµС‚ РїСЂРёРґС‘С‚ РїСЂСЏРјРѕ СЃСЋРґР°."),
        chip: t("header.support.chip", "РЈРєР°Р¶РёС‚Рµ С€Р°РіРё, СЌРєСЂР°РЅ Рё РѕР¶РёРґР°РµРјС‹Р№ СЂРµР·СѓР»СЊС‚Р°С‚"),
      };
    }
    if (location.pathname.startsWith("/admin")) {
      return {
        eyebrow: t("header.admin.eyebrow", "Admin"),
        title: t("header.admin.title", "Р¦РµРЅС‚СЂ СѓРїСЂР°РІР»РµРЅРёСЏ"),
        description: t("header.admin.description", "РџРѕРґРґРµСЂР¶РєР°, РјРѕРЅРёС‚РѕСЂРёРЅРі Рё РґРµР№СЃС‚РІРёСЏ РґР»СЏ РєРѕРјР°РЅРґС‹ РїСЂРѕРµРєС‚Р°."),
        chip: t("header.admin.chip", "РўРѕР»СЊРєРѕ РґР»СЏ Р°РґРјРёРЅ-РґРѕСЃС‚СѓРїР°"),
      };
    }
    if (location.pathname.startsWith("/live")) {
      return {
        eyebrow: t("header.live.eyebrow", "Live"),
        title: t("header.live.title", "РџСѓР»СЊСЃ СЌС„РёСЂР°"),
        description: t("header.live.description", "РђРєС‚РёРІРЅРѕСЃС‚СЊ С‡Р°С‚Р° Рё РєР»СЋС‡РµРІС‹Рµ СЃРёРіРЅР°Р»С‹ СЌС„РёСЂР° РІ РѕРґРЅРѕРј СЌРєСЂР°РЅРµ."),
        chip: t("header.live.chip", "РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі: РѕС‚СЂРµР°РіРёСЂРѕРІР°С‚СЊ РЅР° С‡Р°С‚"),
      };
    }
    if (location.pathname.startsWith("/bridge")) {
      return {
        eyebrow: t("header.bridge.eyebrow", "Bridge"),
        title: t("header.bridge.title", "РњР°СЂС€СЂСѓС‚ Р°СѓРґРёС‚РѕСЂРёРё"),
        description: t("header.bridge.description", "РџРѕРєР°Р·С‹РІР°РµС‚, РєР°Рє СЃРІСЏР·Р°С‚СЊ РїР»Р°С‚С„РѕСЂРјС‹, Telegram Рё Р°РЅРѕРЅСЃС‹."),
        chip: t("header.bridge.chip", "РЎР»РµРґСѓСЋС‰РёР№ С€Р°Рі: РѕС‚РєСЂС‹С‚СЊ РёРЅС‚РµРіСЂР°С†РёРё"),
      };
    }
    if (location.pathname.startsWith("/design-agent")) {
      return {
        eyebrow: t("header.designAgent.eyebrow", "Workflow"),
        title: t("header.designAgent.title", "Р›РѕРєР°Р»СЊРЅС‹Р№ РґРёР·Р°Р№РЅ-С†РёРєР»"),
        description: t("header.designAgent.description", "РљР°Рє РјС‹ СЂР°Р±РѕС‚Р°РµРј СЃ localhost, diff Рё Р¶РёРІРѕР№ РїСЂРѕРІРµСЂРєРѕР№ РёРЅС‚РµСЂС„РµР№СЃР°."),
        chip: t("header.designAgent.chip", "Р›РѕРєР°Р»СЊРЅС‹Р№ preview Р±С‹СЃС‚СЂРµРµ СЃС‚Р°С‚РёС‡РЅРѕРіРѕ РјР°РєРµС‚Р°"),
      };
    }
    if (location.pathname.startsWith("/legacy")) {
      return {
        eyebrow: t("header.legacy.eyebrow", "Legacy"),
        title: t("header.legacy.title", "РђСЂС…РёРІРЅС‹Р№ СЌРєСЂР°РЅ"),
        description: t("header.legacy.description", "РЎС‚Р°СЂС‹Р№ dashboard СЃРѕС…СЂР°РЅС‘РЅ РєР°Рє reference РґР»СЏ СЃСЂР°РІРЅРµРЅРёСЏ СЂРµС€РµРЅРёР№."),
        chip: t("header.legacy.chip", "РўРµРєСѓС‰Р°СЏ РіР»Р°РІРЅР°СЏ Р¶РёРІС‘С‚ РЅР° РЅРѕРІРѕРј СЃС†РµРЅР°СЂРЅРѕРј СЌРєСЂР°РЅРµ"),
      };
    }
    return {
      eyebrow: t("header.default.eyebrow", "Telegram Mini App"),
      title: t("header.default.title", "StreamsInfo"),
      description: t("header.default.description", "РЎРІРѕРґРєР° РїРѕ СЌС„РёСЂСѓ, РёСЃС‚РѕСЂРёРё Рё Р°РЅР°Р»РёС‚РёРєРµ РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ."),
      chip: t("header.default.chip", "Р”РѕСЃС‚СѓРїРЅРѕ РЅР° СЃР°Р№С‚Рµ Рё РІ Telegram"),
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

        <BottomNav
          onOpenSettings={(rect) => {
            setSettingsAnchor(rect ?? null);
            setSettingsOpen(true);
          }}
        />
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




