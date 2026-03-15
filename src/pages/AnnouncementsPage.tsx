import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Megaphone, Trash2, Plus, Copy, Sparkles, Link as LinkIcon, Save, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { CardShell } from "@/shared/ui/CardShell";
import { makeFadeUp, makeStagger } from "@/shared/motion";

type AnnouncementButton = {
  id: number;
  text: string;
  url: string;
};

type AnnouncementDraft = {
  message: string;
  buttons: AnnouncementButton[];
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: { id?: number } };
    };
  };
};

const draftStorageKey = "streamfly:announcement-draft";

function parseTelegramMessage(text: string) {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const italicRegex = /\*(.*?)\*/g;

  const parts = text.split(boldRegex).map((part, index) => {
    if (index % 2 === 1) return <strong key={index}>{part}</strong>;
    return part.split(italicRegex).map((subPart, subIndex) => {
      if (subIndex % 2 === 1) return <em key={subIndex}>{subPart}</em>;
      return subPart;
    });
  });

  return <p>{parts}</p>;
}

function TelegramPreview({ message, buttons }: { message: string; buttons: AnnouncementButton[] }) {
  const parsedMessage = useMemo(() => parseTelegramMessage(message), [message]);

  return (
    <div className="mx-auto w-full max-w-sm rounded-[24px] border border-slate-300/80 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[#18222d] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-emerald-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">Stream Bot</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {message ? parsedMessage : <span className="text-slate-400 dark:text-slate-500">Здесь появится ваш анонс...</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {buttons
          .filter((button) => button.text.trim())
          .map((button) => (
            <a
              key={button.id}
              href={button.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-xl bg-slate-200 py-2 text-center text-sm font-medium text-slate-900 transition-transform active:scale-[0.98] dark:bg-[#2a3643] dark:text-white"
            >
              {button.text}
            </a>
          ))}
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState<AnnouncementButton[]>([]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);
  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;
  const initData = tg?.initData || "";

  const templates = useMemo(
    () => [
      {
        label: "Старт через час",
        message:
          "**Сегодня в 20:00 выходим в эфир.**\nРазберём свежие апдейты, отвечу на вопросы из чата и покажу, что готовим дальше.",
        button: { text: "Напомнить об эфире", url: "https://t.me/" },
      },
      {
        label: "Старт через 30 минут",
        message:
          "**Через 30 минут стартуем.**\nЕсли хотите успеть к началу эфира, самое время сохранить ссылку и подключиться вовремя.",
        button: { text: "Открыть эфир", url: "https://twitch.tv/" },
      },
      {
        label: "Внеплановый эфир",
        message:
          "**Запускаем внеплановый эфир.**\nКороткий выход, ответы на вопросы и несколько важных объявлений.",
        button: { text: "Перейти к эфиру", url: "https://twitch.tv/" },
      },
    ],
    [],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as Partial<AnnouncementDraft>;
      if (typeof draft.message === "string") setMessage(draft.message);
      if (Array.isArray(draft.buttons)) setButtons(draft.buttons);
    } catch {
      // ignore broken drafts
    }
  }, []);

  const persistDraft = () => {
    const draft: AnnouncementDraft = { message, buttons };
    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  };

  const addButtonClicked = () => {
    if (buttons.length >= 3) {
      toast.info("Можно добавить не более 3 кнопок.");
      return;
    }
    setButtons((prev) => [...prev, { id: Date.now(), text: "", url: "" }]);
  };

  const removeButton = (id: number) => {
    setButtons((prev) => prev.filter((button) => button.id !== id));
  };

  const updateButton = (id: number, field: "text" | "url", value: string) => {
    setButtons((prev) => prev.map((button) => (button.id === id ? { ...button, [field]: value } : button)));
  };

  const applyTemplate = (template: (typeof templates)[number]) => {
    setMessage(template.message);
    setButtons([{ id: Date.now(), text: template.button.text, url: template.button.url }]);
  };

  const handleSaveDraft = () => {
    if (!message.trim()) {
      toast.error("Сначала добавьте текст анонса.");
      return;
    }

    setSaving(true);
    persistDraft();
    window.setTimeout(() => {
      setSaving(false);
      setShowConfetti(true);
      toast.success("Черновик анонса сохранён.");
    }, 350);
  };

  const handleCopy = async () => {
    if (!message.trim()) {
      toast.error("Сначала добавьте текст анонса.");
      return;
    }

    const buttonsBlock = buttons
      .filter((button) => button.text.trim())
      .map((button) => `${button.text}${button.url.trim() ? ` — ${button.url.trim()}` : ""}`)
      .join("\n");
    const payload = [message.trim(), buttonsBlock].filter(Boolean).join("\n\n");

    try {
      await navigator.clipboard.writeText(payload);
      toast.success("Текст анонса скопирован.");
    } catch {
      toast.error("Не удалось скопировать текст.");
    }
  };

  const handleSendToTelegram = async () => {
    if (!message.trim()) {
      toast.error("Сначала добавьте текст анонса.");
      return;
    }

    if (!userId || !initData) {
      toast.error("Откройте mini app внутри Telegram, чтобы отправить анонс.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/announcements/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message,
          buttons: buttons
            .filter((button) => button.text.trim())
            .map((button) => ({ text: button.text.trim(), url: button.url.trim() })),
          init_data: initData,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorCode = typeof data?.error === "string" ? data.error : "";
        if (errorCode === "no_telegram_target") {
          toast.error("Сначала подключите Telegram в разделе интеграций и выберите канал или группу.");
          return;
        }
        if (errorCode === "telegram_bot_not_configured") {
          toast.error("На сервере ещё не настроен Telegram-бот.");
          return;
        }
        if (errorCode === "telegram_unreachable") {
          toast.error("Сейчас сервер не может достучаться до Telegram API.");
          return;
        }
        if (errorCode === "telegram_send_failed") {
          toast.error("Не удалось отправить анонс. Проверьте, что бот всё ещё есть в канале и имеет права.");
          return;
        }
        if (errorCode === "user_mismatch" || errorCode === "invalid_init_data") {
          toast.error("Откройте приложение через Telegram и повторите попытку.");
          return;
        }
        toast.error("Не удалось отправить анонс.");
        return;
      }

      persistDraft();
      toast.success("Анонс отправлен в Telegram.");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-5xl px-3 py-4 pb-24 sm:p-4 md:p-8">
      {showConfetti ? <Confetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} /> : null}

      <motion.div variants={item} className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-primary/90">
          <Megaphone size={14} /> Announcement Lab
        </div>
        <h1 className="text-gradient-primary inline-flex items-center gap-3 text-4xl md:text-5xl">
          <Megaphone />
          {t("announcements.title", "Центр анонсов")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Соберите короткий анонс, оставьте один главный CTA и сохраните черновик, чтобы перед стартом не собирать это заново.
        </p>
      </motion.div>

      <motion.div variants={item} className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-[24px] border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl">
          <strong className="block text-foreground">Один главный CTA</strong>
          <span className="mt-2 block leading-6">Обычно лучше работает одна заметная кнопка, чем 2-3 спорящих действия.</span>
        </div>
        <div className="rounded-[24px] border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl">
          <strong className="block text-foreground">До 3 кнопок</strong>
          <span className="mt-2 block leading-6">Если кнопок больше, зрителю сложнее понять, что делать дальше.</span>
        </div>
        <div className="rounded-[24px] border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl">
          <strong className="block text-foreground">Следующий шаг</strong>
          <span className="mt-2 block leading-6">Сначала текст, потом ссылка на эфир и только после этого дополнительные кнопки.</span>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div variants={item} className="space-y-6">
          <CardShell className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-foreground">Шаблоны</h3>
              <p className="mt-1 text-sm text-muted-foreground">Выберите основу и быстро адаптируйте её под сегодняшний эфир.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="rounded-full border border-border/60 bg-secondary/35 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary/35 hover:bg-primary/10"
                >
                  {template.label}
                </button>
              ))}
            </div>
          </CardShell>

          <CardShell className="space-y-3">
            <Label htmlFor="message" className="text-lg font-medium">
              {t("announcements.message", "Текст анонса")}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Во сколько старт, что будет на эфире и почему зрителю стоит подключиться именно сегодня."
              rows={7}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              {t("announcements.markdownHint", "Поддерживается Markdown: **жирный** и *курсив*.")}
            </p>
          </CardShell>

          <CardShell>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium text-foreground">Кнопки действия</h3>
                <p className="mt-1 text-sm text-muted-foreground">Оставьте только то действие, которое действительно нужно зрителю.</p>
              </div>
              <span className="text-xs text-muted-foreground">до 3 штук</span>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {buttons.map((button) => (
                  <motion.div
                    key={button.id}
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="relative rounded-2xl border border-border/70 bg-secondary/35 p-4"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`btn-text-${button.id}`} className="text-xs">
                          {t("announcements.buttonText", "Текст кнопки")}
                        </Label>
                        <Input
                          id={`btn-text-${button.id}`}
                          value={button.text}
                          onChange={(event) => updateButton(button.id, "text", event.target.value)}
                          placeholder="Например: Открыть эфир"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`btn-url-${button.id}`} className="text-xs">
                          {t("announcements.buttonUrl", "Ссылка")}
                        </Label>
                        <div className="relative">
                          <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id={`btn-url-${button.id}`}
                            value={button.url}
                            onChange={(event) => updateButton(button.id, "url", event.target.value)}
                            placeholder="https://twitch.tv/..."
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeButton(button.id)}
                      className="absolute -right-3 -top-3 h-8 w-8 rounded-full border border-border/70 bg-background/90 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {buttons.length < 3 ? (
                <Button variant="outline" onClick={addButtonClicked} className="w-full gap-2 border-dashed">
                  <Plus size={16} /> {t("announcements.addButton", "Добавить кнопку")}
                </Button>
              ) : null}
            </div>
          </CardShell>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <CardShell className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-foreground">{t("announcements.preview", "Превью анонса")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Сразу видно, как это будет смотреться в Telegram.</p>
              </div>
              <span className="text-xs text-muted-foreground">Telegram view</span>
            </div>
            <TelegramPreview message={message} buttons={buttons} />
          </CardShell>

          <CardShell className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/35 p-4 text-sm leading-relaxed text-muted-foreground">
              <strong className="block text-foreground">Следующий шаг</strong>
              <span className="mt-2 block">Если Telegram уже подключён в интеграциях, можно отправить анонс прямо отсюда в выбранный канал или чат.</span>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleSaveDraft} disabled={saving} size="lg" className="group relative w-full gap-2 overflow-hidden text-base">
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_60%)] opacity-70" />
                <span className="relative z-10 flex items-center gap-2">
                  {saving ? (
                    <motion.span animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Sparkles size={18} />
                    </motion.span>
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? "Сохраняем..." : "Сохранить черновик"}
                </span>
              </Button>
              <Button onClick={handleSendToTelegram} disabled={sending} size="lg" className="w-full gap-2 text-base">
                {sending ? (
                  <motion.span animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Sparkles size={18} />
                  </motion.span>
                ) : (
                  <Send size={18} />
                )}
                {sending ? "Отправляем..." : "Отправить в Telegram"}
              </Button>
              <Button variant="outline" onClick={handleCopy} className="w-full gap-2">
                <Copy size={16} /> Скопировать текст
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Для отправки используется Telegram-цель, которую вы уже подключили в разделе интеграций.
            </p>
          </CardShell>
        </motion.div>
      </div>
    </motion.div>
  );
}
