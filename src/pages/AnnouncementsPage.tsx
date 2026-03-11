import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Megaphone, Trash2, Plus, Send, Sparkles, Link as LinkIcon } from "lucide-react";
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
            {message ? parsedMessage : <span className="text-slate-400 dark:text-slate-500">Ваш анонс появится здесь...</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {buttons.map((button) => (
          <a
            key={button.id}
            href={button.url || "#"}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-xl bg-slate-200 py-2 text-center text-sm font-medium text-slate-900 transition-transform active:scale-[0.98] dark:bg-[#2a3643] dark:text-white"
          >
            {button.text || "Нажми меня"}
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
  const [sending, setSending] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

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

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Сообщение не может быть пустым.");
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Анонс успешно отправлен.");
      setShowConfetti(true);
    }, 1500);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-5xl px-3 py-4 sm:p-4 md:p-8">
      {showConfetti ? <Confetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} /> : null}

      <motion.div variants={item} className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-primary/90">
          <Megaphone size={14} />
          Announcement Lab
        </div>
        <h1 className="text-gradient-primary inline-flex items-center gap-3 text-4xl md:text-5xl">
          <Megaphone />
          {t("announcements.title", "Центр анонсов")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("announcements.description", "Соберите сообщение, кнопки и превью в одном окне, а потом отправьте анонс без лишних шагов.")}
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div variants={item} className="space-y-6">
          <CardShell className="space-y-3">
            <Label htmlFor="message" className="text-lg font-medium">
              {t("announcements.message", "Текст анонса")}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("announcements.placeholder", "Расскажите, во сколько стрим, что будет происходить и почему стоит подключиться.")}
              rows={6}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              {t("announcements.markdownHint", "Поддерживается Markdown: **жирный** и *курсив*.")}
            </p>
          </CardShell>

          <CardShell>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-medium">{t("announcements.buttons", "Кнопки действий")}</h3>
              <span className="text-xs font-mono text-muted-foreground">до 3 штук</span>
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
                        <Label htmlFor={`btn-text-${button.id}`} className="text-xs font-mono">
                          {t("announcements.buttonText", "Текст кнопки")}
                        </Label>
                        <Input
                          id={`btn-text-${button.id}`}
                          value={button.text}
                          onChange={(event) => updateButton(button.id, "text", event.target.value)}
                          placeholder="Например: Залетай на эфир"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`btn-url-${button.id}`} className="text-xs font-mono">
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
              <h3 className="text-lg font-medium">{t("announcements.preview", "Превью сообщения")}</h3>
              <span className="text-xs font-mono text-muted-foreground">Telegram view</span>
            </div>
            <TelegramPreview message={message} buttons={buttons} />
          </CardShell>

          <CardShell className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/35 p-4 text-sm leading-relaxed text-muted-foreground">
              {t("announcements.tip", "Совет: короткий заголовок, 2-3 причины зайти и одна сильная кнопка работают лучше, чем длинный перегруженный текст.")}
            </div>
            <Button onClick={handleSend} disabled={sending} size="lg" className="group relative w-full gap-2 overflow-hidden text-base">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_60%)] opacity-70" />
              <span className="relative z-10 flex items-center gap-2">
                {sending ? (
                  <motion.span animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Sparkles size={18} />
                  </motion.span>
                ) : (
                  <Send size={18} />
                )}
                {sending ? t("announcements.sending", "Отправка...") : t("announcements.send", "Отправить в каналы")}
              </span>
            </Button>
          </CardShell>
        </motion.div>
      </div>
    </motion.div>
  );
}
