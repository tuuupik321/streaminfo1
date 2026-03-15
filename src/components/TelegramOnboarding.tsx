import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
    };
  };
};

const ONBOARDING_KEY = "streaminfo_onboarding_v1";

export function TelegramOnboarding() {
  const { t } = useI18n();
  const steps = useMemo(
    () => [
      {
        title: t("onboarding.step1.title", "Добро пожаловать в StreamInfo"),
        body: t(
          "onboarding.step1.body",
          "Это Telegram Mini App для контроля эфиров, донатов и ключевых сигналов прямо во время стрима.",
        ),
      },
      {
        title: t("onboarding.step2.title", "Навигация всегда под рукой"),
        body: t(
          "onboarding.step2.body",
          "Переключайся между главной, эфирами, аналитикой и донатами через нижнюю панель.",
        ),
      },
      {
        title: t("onboarding.step3.title", "Быстрые настройки"),
        body: t(
          "onboarding.step3.body",
          "Шестерёнка в таб-баре открывает быстрые настройки: тема, язык и интеграции.",
        ),
      },
    ],
    [t],
  );
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initData = (window as TelegramWindow).Telegram?.WebApp?.initData || "";
    const isTelegramMiniApp = Boolean(initData) && !initData.includes("app_token=");
    if (!isTelegramMiniApp) return;
    try {
      if (window.localStorage.getItem(ONBOARDING_KEY) === "1") return;
    } catch {
      // ignore storage errors
    }
    setStepIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const updateHighlight = () => {
      const selector =
        stepIndex === 1
          ? "[data-onboarding='bottom-nav']"
          : stepIndex === 2
            ? "[data-onboarding='settings-tab']"
            : null;
      if (!selector) {
        setHighlightRect(null);
        return;
      }
      const element = document.querySelector(selector) as HTMLElement | null;
      if (!element) {
        setHighlightRect(null);
        return;
      }
      setHighlightRect(element.getBoundingClientRect());
    };
    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);
    return () => {
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [open, stepIndex]);

  const finishOnboarding = () => {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // ignore storage errors
    }
    setOpen(false);
  };

  const handleNext = () => {
    if (stepIndex >= steps.length - 1) {
      finishOnboarding();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {highlightRect ? (
            <motion.div
              className="pointer-events-none absolute rounded-[30px] border border-primary/60 shadow-[0_0_40px_hsl(var(--primary)_/_0.45)]"
              style={{
                top: Math.max(0, highlightRect.top - 8),
                left: Math.max(0, highlightRect.left - 8),
                width: highlightRect.width + 16,
                height: highlightRect.height + 16,
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
            >
              <span className="absolute inset-0 rounded-[30px] bg-primary/15 blur-2xl" />
            </motion.div>
          ) : null}
          <motion.div
            className="relative w-full max-w-[22rem] overflow-hidden rounded-[24px] border border-white/10 bg-[hsl(var(--card))/0.97] p-5 text-foreground shadow-[0_32px_80px_rgba(3,12,24,0.6)]"
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/75">
              Telegram Mini App
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
              {t("onboarding.step", "Шаг")} {stepIndex + 1} / {steps.length}
            </div>
            <h3 className="mt-3 text-lg font-semibold">{steps[stepIndex]?.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground/80">{steps[stepIndex]?.body}</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-1.5">
                {steps.map((_, index) => (
                  <span
                    key={`onboarding-dot-${index}`}
                    className={cn(
                      "h-1.5 w-5 rounded-full transition-all",
                      index === stepIndex ? "bg-primary/80" : "bg-white/15",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-[0_14px_34px_hsl(var(--primary)_/_0.35)] transition hover:bg-primary/90 active:scale-[0.98]"
              >
                {t("onboarding.next", "Далее")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
