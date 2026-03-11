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
        description: "Чеклист, цели, анонс и всё, что помогает спокойно и вовремя выйти в эфир.",
        chip: "Следующий шаг: собрать анонс и проверить ссылку",
      };
    }
    if (location.pathname.startsWith("/analytics")) {
      return {
        eyebrow: "Аналитика",
        title: "Рост и лучшие окна",
        description: "Средний онлайн, пики, лучшие часы и подсказки, которые помогают запустить эфир в нужный момент.",
        chip: "Периоды: 7 / 30 / 90 дней / всё время",
      };
    }
    if (location.pathname.startsWith("/donations")) {
      return {
        eyebrow: "Поддержка",
        title: "Донаты и активные зрители",
        description: "История поддержки, средний донат, топ донатеры и подключение сервисов в одном экране.",
        chip: "Следующий шаг: подключить сервис донатов",
      };
    }
    if (location.pathname.startsWith("/announcements")) {
      return {
        eyebrow: "Анонсы",
        title: "Подготовка анонса",
        description: "Соберите короткий текст, один главный CTA и готовую ссылку для Telegram или канала.",
        chip: "Хороший анонс ведёт к одному понятному действию",
      };
    }
    if (location.pathname.startsWith("/integrations")) {
      return {
        eyebrow: "Интеграции",
        title: "Платформы и сервисы",
        description: "Подключите платформы, донаты и уведомления, чтобы открыть аналитику, историю эфиров и поддержку.",
        chip: "Подключения открывают новые блоки mini app",
      };
    }
    if (location.pathname.startsWith("/settings")) {
      return {
        eyebrow: "Настройки",
        title: "Быстрые настройки mini app",
        description: "Тема, язык и интеграции собраны без лишней глубины, чтобы не терять фокус перед эфиром.",
        chip: "Меняйте только то, что реально влияет на опыт",
      };
    }
    if (location.pathname.startsWith("/support")) {
      return {
        eyebrow: "Поддержка",
        title: "Связь с командой",
        description: "Опишите проблему или идею, а ответ придёт прямо в этот Telegram-аккаунт.",
        chip: "Лучше указать шаги, экран и ожидаемый результат",
      };
    }
    if (location.pathname.startsWith("/admin")) {
      return {
        eyebrow: "Admin",
        title: "Центр управления",
        description: "Поддержка, рассылки, мониторинг и системные действия для команды и владельца проекта.",
        chip: "Только для админ-доступа",
      };
    }
    if (location.pathname.startsWith("/live")) {
      return {
        eyebrow: "Live",
        title: "Пульс эфира",
        description: "События, активность чата и быстрые действия для живого эфира в одном компактном экране.",
        chip: "Следующий шаг: отреагировать на чат или собрать анонс",
      };
    }
    if (location.pathname.startsWith("/bridge")) {
      return {
        eyebrow: "Bridge",
        title: "Маршрут аудитории",
        description: "Показывает, как связать платформы, Telegram и анонсы, чтобы зрителю было проще дойти до эфира.",
        chip: "Следующий шаг: открыть интеграции",
      };
    }
    if (location.pathname.startsWith("/design-agent")) {
      return {
        eyebrow: "Workflow",
        title: "Локальный дизайн-цикл",
        description: "Экран о том, как мы работаем с localhost, diff и живой проверкой интерфейса в браузере.",
        chip: "Локальный preview быстрее любого статичного макета",
      };
    }
    if (location.pathname.startsWith("/legacy")) {
      return {
        eyebrow: "Legacy",
        title: "Архивный экран",
        description: "Старый dashboard сохранён как reference, чтобы сравнивать решения и не терять полезные идеи.",
        chip: "Текущая главная живёт на новом сценарном экране",
      };
    }
    return {
      eyebrow: "Telegram Mini App",
      title: "StreamsInfo",
      description: "Главная сводка по эфиру, истории, аналитике и следующему полезному действию для стримера.",
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
