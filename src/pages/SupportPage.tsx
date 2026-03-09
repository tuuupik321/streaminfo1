import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, HeadphonesIcon, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type TelegramWebAppUser = {
  id?: number;
  username?: string;
  first_name?: string;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: TelegramWebAppUser;
      };
    };
  };
};

const gradients = [
  "from-rose-500/70 to-orange-500/70",
  "from-violet-500/70 to-fuchsia-500/70",
  "from-cyan-500/70 to-blue-500/70",
  "from-emerald-500/70 to-teal-500/70",
  "from-amber-500/70 to-lime-500/70",
];

const COPY = {
  ru: {
    writeFirst: "Сначала напишите сообщение",
    openFromTelegram: "Откройте мини-приложение из Telegram-аккаунта",
    sendError: "Ошибка отправки",
    sentOk: "Сообщение отправлено",
    requestSent: "Запрос отправлен",
    sameAccount: "Ответ придет в этот же Telegram-аккаунт.",
    newMessage: "Новое сообщение",
    title: "Поддержка",
    subtitle: "Сообщение отправляется от вашего Telegram-аккаунта",
    directRequest: "Прямой запрос",
    telegramId: "Telegram ID",
    unknown: "неизвестно",
    placeholder: "Опишите проблему или идею...",
    sending: "Отправка...",
    send: "Отправить",
  },
  en: {
    writeFirst: "Write a message first",
    openFromTelegram: "Open this mini app from your Telegram account",
    sendError: "Send error",
    sentOk: "Message sent",
    requestSent: "Request sent",
    sameAccount: "We will reply to the same Telegram account.",
    newMessage: "New message",
    title: "Support",
    subtitle: "Message is sent from your Telegram account",
    directRequest: "Direct request",
    telegramId: "Telegram ID",
    unknown: "unknown",
    placeholder: "Describe your issue or idea...",
    sending: "Sending...",
    send: "Send",
  },
  uk: {
    writeFirst: "Спочатку напишіть повідомлення",
    openFromTelegram: "Відкрийте міні-додаток із Telegram-акаунта",
    sendError: "Помилка надсилання",
    sentOk: "Повідомлення надіслано",
    requestSent: "Запит надіслано",
    sameAccount: "Відповідь прийде в цей самий Telegram-акаунт.",
    newMessage: "Нове повідомлення",
    title: "Підтримка",
    subtitle: "Повідомлення надсилається від вашого Telegram-акаунта",
    directRequest: "Прямий запит",
    telegramId: "Telegram ID",
    unknown: "невідомо",
    placeholder: "Опишіть проблему або ідею...",
    sending: "Надсилання...",
    send: "Надіслати",
  },
};

function getProfileSkin(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % gradients.length;
  return gradients[idx];
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "U";
}

export default function SupportPage() {
  const { language } = useI18n();
  const t = useMemo(() => COPY[language], [language]);

  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user;
  const telegramId = tgUser ? String(tgUser.id) : "";
  const autoUsername = tgUser?.username || tgUser?.first_name || "User";

  const profileSkin = useMemo(() => getProfileSkin(`${telegramId}:${autoUsername}`), [telegramId, autoUsername]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error(t.writeFirst);
      return;
    }

    if (!telegramId) {
      toast.error(t.openFromTelegram);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("support_tickets").insert({
      telegram_id: telegramId,
      username: autoUsername || null,
      message: message.trim(),
    });
    setLoading(false);

    if (error) {
      toast.error(t.sendError);
    } else {
      setSent(true);
      toast.success(t.sentOk);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-center justify-center gap-4 px-3 py-4 sm:p-4 md:p-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 size={32} className="text-primary" />
        </motion.div>
        <h2 className="text-xl font-bold font-heading">{t.requestSent}</h2>
        <p className="text-center text-sm font-mono text-muted-foreground">{t.sameAccount}</p>
        <Button
          variant="outline"
          className="mt-4 text-xs font-mono"
          onClick={() => {
            setSent(false);
            setMessage("");
          }}
        >
          <MessageSquare size={14} className="mr-2" /> {t.newMessage}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-3 py-4 pb-20 sm:p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3">
        <div className="glow-primary flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <HeadphonesIcon size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black font-heading sm:text-2xl">{t.title}</h1>
          <p className="text-xs font-mono text-muted-foreground">{t.subtitle}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/30 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono text-muted-foreground">{t.directRequest}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/30 p-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${profileSkin} text-sm font-bold text-white`}>
                {getInitial(autoUsername)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{autoUsername}</p>
                <p className="text-xs text-muted-foreground">{t.telegramId}: {telegramId || t.unknown}</p>
              </div>
            </div>

            <Textarea
              placeholder={t.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none border-border/30 bg-secondary/30 font-mono text-sm"
            />

            <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2 font-mono">
              <Send size={14} /> {loading ? t.sending : t.send}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
