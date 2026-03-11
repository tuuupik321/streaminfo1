import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { CommandPalette } from "@/components/CommandPalette";
import { GlobalStatusBar } from "@/components/GlobalStatusBar";
import { PageTransition } from "@/components/PageTransition";
import { SettingsModal } from "@/components/SettingsModal";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<DOMRect | null>(null);
  const location = useLocation();

  const headerContent = useMemo(() => {
    if (location.pathname.startsWith("/info")) {
      return {
        eyebrow: "Подготовка",
        title: "Подготовка к эфиру",
        description: "Чеклист, цели, анонс и всё, что помогает аккуратно выйти в эфир.",
        chip: "Следующий шаг: анонс и ссылка",
      };
    }
    if (location.pathname.startsWith("/analytics")) {
      return {
        eyebrow: "Аналитика",
        title: "Рост и лучшие окна",
        description: "Средний онлайн, лучшие часы и спокойные AI-подсказки без перегруза.",
        chip: "Периоды: 7 / 30 / 90 / всё время",
      };
    }
    if (location.pathname.startsWith("/donations")) {
      return {
        eyebrow: "Поддержка",
        title: "Донаты и активные зрители",
        description: "История поддержки, средний донат и самые активные донатеры в одном экране.",
        chip: "Следующий шаг: подключить сервис",
      };
    }
    if (location.pathname.startsWith("/announcements")) {
      return {
        eyebrow: "Анонсы",
        title: "Подготовка анонса",
        description: "Соберите текст, кнопки и превью так, чтобы зрителю было легко нажать и прийти на эфир.",
        chip: "Один главный CTA работает лучше",
      };
    }
    if (location.pathname.startsWith("/integrations")) {
      return {
        eyebrow: "Интеграции",
        title: "Подключение платформ и сервисов",
        description: "Откройте аналитику, историю эфиров, уведомления и поддержку в одном месте.",
        chip: "Подключения открывают новые блоки",
      };
    }
    if (location.pathname.startsWith("/settings")) {
      return {
        eyebrow: "Настройки",
        title: "Быстрые настройки mini app",
        description: "Тема, язык и интеграции собраны без лишней глубины, чтобы не терять фокус.",
        chip: "Меняйте только то, что реально влияет на опыт",
      };
    }
    if (location.pathname.startsWith("/support")) {
      return {
        eyebrow: "Поддержка",
        title: "Связь с командой",
        description: "Опишите проблему или идею, а ответ придёт в этот же Telegram-аккаунт.",
        chip: "Лучше описать шаги и ожидание",
      };
    }
    if (location.pathname.startsWith("/admin")) {
      return {
        eyebrow: "Admin",
        title: "Центр управления",
        description: "Сервисные действия и проверка состояния проекта в одном месте.",
        chip: "Только для админ-доступа",
      };
    }
    return {
      eyebrow: "Telegram Mini App",
      title: "StreamsInfo",
      description: "Главная сводка по эфиру, истории, аналитике и следующему полезному шагу.",
      chip: "Следующий шаг: подготовить анонс",
    };
  }, [location.pathname]);

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-svh w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-40 px-2.5 pt-2.5 md:px-4 md:pt-4">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-background/78 px-3.5 py-2.5 shadow-[0_18px_42px_rgba(3,12,24,0.24)] backdrop-blur-2xl md:px-4 md:py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{headerContent.eyebrow}</div>
                  <div className="text-sm font-semibold text-foreground">{headerContent.title}</div>
                  <div className="hidden text-xs text-muted-foreground md:block">{headerContent.description}</div>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-muted-foreground md:flex">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(74,222,128,0.55)]" />
                {headerContent.chip}
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl px-2.5 pb-28 pt-2.5 md:px-4 md:pb-28 md:pt-4">
            <GlobalStatusBar />
            <PageTransition>{children}</PageTransition>
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
        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}
