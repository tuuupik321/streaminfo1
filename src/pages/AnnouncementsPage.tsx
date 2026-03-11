import { useState, useMemo } from "react";
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
    <div className="rounded-xl bg-white dark:bg-[#18222d] p-3 w-full max-w-sm mx-auto shadow-lg">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-green-400" />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-primary">Stream-Bot</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="mt-1 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {message ? parsedMessage : <span className="text-gray-400 dark:text-gray-500">Ваш анонс появится здесь...</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {buttons.map(btn => (
          <a key={btn.id} href={btn.url} target="_blank" rel="noreferrer" className="w-full rounded-lg bg-gray-200 dark:bg-[#2a3643] py-2 text-center text-sm font-medium text-gray-900 dark:text-white transition-transform active:scale-[0.98]">
            {btn.text || "Нажми меня"}
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
    setButtons([...buttons, { id: Date.now(), text: "", url: "" }]);
  };

  const removeButton = (id: number) => {
    setButtons(buttons.filter(b => b.id !== id));
  };

  const updateButton = (id: number, field: 'text' | 'url', value: string) => {
    setButtons(buttons.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleSend = () => {
    if (!message) {
      toast.error("Сообщение не может быть пустым!");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Анонс успешно отправлен!");
      setShowConfetti(true);
    }, 1500);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-4xl px-3 py-4 sm:p-4 md:p-8">
      {showConfetti && <Confetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
      <motion.div variants={item} className="mb-8 text-center">
        <h1 className="text-gradient-primary inline-flex items-center gap-3 text-4xl md:text-5xl">
          <Megaphone />
          {t("announcements.title", "Центр Анонсов")}
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
          {t("announcements.description", "Создайте идеальный анонс для вашего стрима и отправьте его в один клик.")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-12">
        <motion.div variants={item} className="space-y-8">
          {/* Editor */}
          <CardShell className="space-y-3">
            <Label htmlFor="message" className="text-lg font-medium">{t("announcements.message", "Ваше сообщение")}</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("announcements.placeholder", "Что нового, стример?")} rows={5} className="text-base"/>
            <p className="text-xs text-muted-foreground">{t("announcements.markdownHint", "Поддерживается Markdown: **жирный** и *курсив*.")}</p>
          </CardShell>

          {/* Buttons */}
          <CardShell>
            <h3 className="text-lg font-medium mb-4">{t("announcements.buttons", "Призыв к действию")}</h3>
            <div className="space-y-4">
              <AnimatePresence>
                {buttons.map((btn, index) => (
                  <motion.div 
                    key={btn.id}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative rounded-xl border bg-card/50 p-4"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                       <div className="space-y-2">
                         <Label htmlFor={`btn-text-${btn.id}`} className="text-xs font-mono">{t("announcements.buttonText", "Текст кнопки")}</Label>
                         <Input id={`btn-text-${btn.id}`} value={btn.text} onChange={(e) => updateButton(btn.id, 'text', e.target.value)} placeholder="🚀 Залетай!" />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor={`btn-url-${btn.id}`} className="text-xs font-mono">{t("announcements.buttonUrl", "URL")}</Label>
                         <div className="relative">
                           <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                           <Input id={`btn-url-${btn.id}`} value={btn.url} onChange={(e) => updateButton(btn.id, 'url', e.target.value)} placeholder="https://twitch.tv/..." className="pl-8"/>
                         </div>
                       </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeButton(btn.id)} className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-secondary text-muted-foreground hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 size={14} />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {buttons.length < 3 && (
                <Button variant="outline" onClick={addButtonClicked} className="w-full border-dashed gap-2">
                  <Plus size={16} /> {t("announcements.addButton", "Добавить кнопку")}
                </Button>
              )}
            </div>
          </CardShell>

          {/* Preview */}
          <CardShell className="space-y-3">
             <h3 className="text-lg font-medium text-center">{t("announcements.preview", "Живое превью")}</h3>
             <TelegramPreview message={message} buttons={buttons} />
          </CardShell>

          {/* Send Button */}
          <div className="pt-4">
            <Button onClick={handleSend} disabled={sending} size="lg" className="w-full group relative overflow-hidden gap-2 text-base font-bold">
               <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#14C57B_0%,#00A36C_50%,#14C57B_100%)]" />
               <div className="relative z-10 flex items-center gap-2">
                {sending ? (
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Sparkles size={20} />
                  </motion.div>
                ) : (
                  <Send size={20} />
                )}
                {sending ? t("announcements.sending", "Отправка...") : t("announcements.send", "Отправить в Каналы")}
               </div>
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}






