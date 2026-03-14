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
        eyebrow: t("header.info.eyebrow", "Сводка"),
        title: t("header.info.title", "Сводка эфира"),
        description: t("header.info.description", "Ключевые метрики по эфиру, кликам и поддержке в одном месте."),
        chip: t("header.info.chip", "Обновляется в реальном времени"),
      };
    }
    if (location.pathname.startsWith("/analytics")) {
      return {
        eyebrow: t("header.analytics.eyebrow", "Аналитика"),
        title: t("header.analytics.title", "Рост и лучшие окна"),
        description: t("header.analytics.description", "Средний онлайн, пики и лучшие часы для запуска эфира."),
        chip: t("header.analytics.chip", "Периоды: 7 / 30 / 90 дней / всё время"),
      };
    }
    if (location.pathname.startsWith("/donations")) {
      return {
        eyebrow: t("header.donations.eyebrow", "Поддержка"),
        title: t("header.donations.title", "Донаты и активные зрители"),
        description: t("header.donations.description", "История донатов, средние суммы и топ поддержки на одном экране."),
        chip: t("header.donations.chip", "Следующий шаг: подключить сервис донатов"),
      };
    }
    if (location.pathname.startsWith("/announcements")) {
      return {
        eyebrow: t("header.announcements.eyebrow", "Анонсы"),
        title: t("header.announcements.title", "Центр анонсов"),
        description: t("header.announcements.description", "Короткий текст, CTA и ссылка для канала или mini app."),
        chip: t("header.announcements.chip", "Один анонс = одно понятное действие"),
      };
    }
    if (location.pathname.startsWith("/integrations")) {
      return {
        eyebrow: t("header.integrations.eyebrow", "Интеграции"),
        title: t("header.integrations.title", "Платформы и сервисы"),
        description: t("header.integrations.description", "Подключите платформы, донаты и уведомления для полной картины эфира."),
        chip: t("header.integrations.chip", "Подключения открывают новые блоки mini app"),
      };
    }
    if (location.pathname.startsWith("/settings")) {
      return {
        eyebrow: t("header.settings.eyebrow", "Настройки"),
        title: t("header.settings.title", "Быстрые настройки"),
        description: t("header.settings.description", "Тема, язык и интеграции без лишней глубины."),
        chip: t("header.settings.chip", "Меняйте только то, что влияет на опыт"),
      };
    }
    if (location.pathname.startsWith("/support")) {
      return {
        eyebrow: t("header.support.eyebrow", "Поддержка"),
        title: t("header.support.title", "Связь с командой"),
        description: t("header.support.description", "Опишите проблему или идею, ответ придёт прямо сюда."),
        chip: t("header.support.chip", "Укажите шаги, экран и ожидаемый результат"),
      };
    }
    if (location.pathname.startsWith("/admin")) {
      return {
        eyebrow: t("header.admin.eyebrow", "Admin"),
        title: t("header.admin.title", "Центр управления"),
        description: t("header.admin.description", "Поддержка, мониторинг и действия для команды проекта."),
        chip: t("header.admin.chip", "Только для админ-доступа"),
      };
    }
    if (location.pathname.startsWith("/live")) {
      return {
        eyebrow: t("header.live.eyebrow", "Live"),
        title: t("header.live.title", "Пульс эфира"),
        description: t("header.live.description", "Активность чата и ключевые сигналы эфира в одном экране."),
        chip: t("header.live.chip", "Следующий шаг: отреагировать на чат"),
      };
    }
    if (location.pathname.startsWith("/bridge")) {
      return {
        eyebrow: t("header.bridge.eyebrow", "Bridge"),
        title: t("header.bridge.title", "Маршрут аудитории"),
        description: t("header.bridge.description", "Показывает, как связать платформы, Telegram и анонсы."),
        chip: t("header.bridge.chip", "Следующий шаг: открыть интеграции"),
      };
    }
    if (location.pathname.startsWith("/design-agent")) {
      return {
        eyebrow: t("header.designAgent.eyebrow", "Workflow"),
        title: t("header.designAgent.title", "Локальный дизайн-цикл"),
        description: t("header.designAgent.description", "Как мы работаем с localhost, diff и живой проверкой интерфейса."),
        chip: t("header.designAgent.chip", "Локальный preview быстрее статичного макета"),
      };
    }
    if (location.pathname.startsWith("/legacy")) {
      return {
        eyebrow: t("header.legacy.eyebrow", "Legacy"),
        title: t("header.legacy.title", "Архивный экран"),
        description: t("header.legacy.description", "Старый dashboard сохранён как reference для сравнения решений."),
        chip: t("header.legacy.chip", "Текущая главная живёт на новом сценарном экране"),
      };
    }
    return {
      eyebrow: t("header.default.eyebrow", "Telegram Mini App"),
      title: t("header.default.title", "StreamsInfo"),
      description: t("header.default.description", "Сводка по эфиру, истории и аналитике в одном месте."),
      chip: t("header.default.chip", "Доступно на сайте и в Telegram"),
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
                  <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{headerContent.eyebrow}</div>
                  <div className="text-sm font-semibold text-foreground">{headerContent.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground md:hidden">{headerContent.chip}</div>
                  <div className="hidden text-xs text-muted-foreground md:block">{headerContent.description}</div>
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
                    className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-[0_12px_30px_rgba(16,185,129,0.3)] transition hover:bg-emerald-400/25 md:px-3"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/30">
                      <Settings size={14} className="transition-transform duration-200 group-hover:rotate-12" />
                    </span>
                    <span className="hidden sm:inline">{t("settings.quickButton", "Р‘С‹СЃС‚СЂС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё")}</span>
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
          </div>
        </SidebarInset>

        <BottomNav
          onOpenSettings={(rect) => {
            setSettingsAnchor(rect ?? null);
            setSettingsOpen(true);
          }}
        />
        <SettingsModal
          open={settingsOpen}
          anchorRect={settingsAnchor}
          onClose={() => setSettingsOpen(false)}
        />
        <QuickGearMenu />
        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}



