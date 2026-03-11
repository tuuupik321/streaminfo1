import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, HeadphonesIcon, MessageSquare, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { makeFadeUp, makeStagger } from "@/shared/motion";

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
    openFromTelegram: "Откройте mini app из Telegram-аккаунта",
    sendError: "Не удалось отправить сообщение",
    sentOk: "Сообщение отправлено",
    requestSent: "Запрос отправлен",
    sameAccount: "Ответ придёт в этот же Telegram-аккаунт.",
    newMessage: "Новое сообщение",
    title: "Поддержка и обратная связь",
    subtitle: "Опишите проблему или идею, а мы ответим прямо в этот Telegram-аккаунт.",
    directRequest: "Сообщение в команду",
    telegramId: "Telegram ID",
    unknown: "неизвестно",
    placeholder: "Что произошло, где это произошло и что вы ожидали увидеть?",
    sending: "Отправляем...",
    send: "Отправить сообщение",
    quickTitle: "Чем помочь быстрее",
    quickSubtitle: "Выберите тему или используйте её как основу сообщения.",
    expectationTitle: "Что полезно указать",
    expectationBody: "Опишите экран, шаги до ошибки и ожидаемый результат. Так мы разберёмся заметно быстрее.",
    replyTitle: "Куда придёт ответ",
    replyBody: "Ответим прямо в этот Telegram-аккаунт, поэтому ничего дополнительно указывать не нужно.",
    presetBug: "Проблема с Telegram",
    presetBugText: "Есть проблема с Telegram-интеграцией: опишите, что именно не работает и на каком шаге это происходит.",
    presetAnalytics: "Нет данных в аналитике",
    presetAnalyticsText: "Не появляются данные в аналитике: укажите экран, период и что вы ожидали увидеть.",
    presetIdea: "Идея для функции",
    presetIdeaText: "Есть идея для функции: опишите сценарий, кому это поможет и каким должен быть результат.",
  },
  en: {
    writeFirst: "Write a message first",
    openFromTelegram: "Open this mini app from your Telegram account",
    sendError: "Could not send the message",
    sentOk: "Message sent",
    requestSent: "Request sent",
    sameAccount: "We will reply in the same Telegram account.",
    newMessage: "New message",
    title: "Support and feedback",
    subtitle: "Describe the issue or idea and we will reply in the same Telegram account.",
    directRequest: "Message to the team",
    telegramId: "Telegram ID",
    unknown: "unknown",
    placeholder: "What happened, where did it happen, and what were you expecting to see?",
    sending: "Sending...",
    send: "Send message",
    quickTitle: "Get help faster",
    quickSubtitle: "Choose a topic or use it as a starting draft.",
    expectationTitle: "What helps most",
    expectationBody: "Describe the screen, steps before the issue, and the expected result so we can move faster.",
    replyTitle: "Where we reply",
    replyBody: "We reply in the same Telegram account, so you do not need to add extra contacts.",
    presetBug: "Telegram issue",
    presetBugText: "There is a Telegram integration issue: describe what does not work and at which step it happens.",
    presetAnalytics: "No analytics data",
    presetAnalyticsText: "Analytics data does not appear: tell us the screen, period, and what you expected to see.",
    presetIdea: "Feature idea",
    presetIdeaText: "There is a feature idea: describe the scenario, who it helps, and the expected result.",
  },
  uk: {
    writeFirst: "Спочатку напишіть повідомлення",
    openFromTelegram: "Відкрийте mini app з Telegram-акаунта",
    sendError: "Не вдалося надіслати повідомлення",
    sentOk: "Повідомлення надіслано",
    requestSent: "Запит надіслано",
    sameAccount: "Відповідь прийде в цей самий Telegram-акаунт.",
    newMessage: "Нове повідомлення",
    title: "Підтримка та зворотний зв'язок",
    subtitle: "Опишіть проблему або ідею, а ми відповімо прямо в цей Telegram-акаунт.",
    directRequest: "Повідомлення команді",
    telegramId: "Telegram ID",
    unknown: "невідомо",
    placeholder: "Що сталося, де це сталося і що ви очікували побачити?",
    sending: "Надсилаємо...",
    send: "Надіслати повідомлення",
    quickTitle: "Як допомогти швидше",
    quickSubtitle: "Оберіть тему або використайте її як основу повідомлення.",
    expectationTitle: "Що корисно вказати",
    expectationBody: "Опишіть екран, кроки до помилки та очікуваний результат. Так ми розберемося швидше.",
    replyTitle: "Куди прийде відповідь",
    replyBody: "Відповімо прямо в цей Telegram-акаунт, тому нічого додатково вказувати не потрібно.",
    presetBug: "Проблема з Telegram",
    presetBugText: "Є проблема з Telegram-інтеграцією: опишіть, що саме не працює і на якому кроці це відбувається.",
    presetAnalytics: "Немає даних в аналітиці",
    presetAnalyticsText: "Не з'являються дані в аналітиці: вкажіть екран, період і що ви очікували побачити.",
    presetIdea: "Ідея для функції",
    presetIdeaText: "Є ідея для функції: опишіть сценарій, кому це допоможе і яким має бути результат.",
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
  const t = useMemo(() => COPY[language as keyof typeof COPY] ?? COPY.ru, [language]);

  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const tgUser = tg?.initDataUnsafe?.user;
  const telegramId = tgUser ? String(tgUser.id) : "";
  const autoUsername = tgUser?.username || tgUser?.first_name || "User";

  const quickPrompts = useMemo(
    () => [
      { label: t.presetBug, text: t.presetBugText },
      { label: t.presetAnalytics, text: t.presetAnalyticsText },
      { label: t.presetIdea, text: t.presetIdeaText },
    ],
    [t],
  );

  const profileSkin = useMemo(() => getProfileSkin(`${telegramId}:${autoUsername}`), [telegramId, autoUsername]);
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  const applyPrompt = (text: string) => {
    setMessage((current) => (current.trim() ? `${current.trim()}\n\n${text}` : text));
  };

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
      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-center justify-center gap-4 px-3 py-4 sm:p-4 md:p-8">
        <motion.div variants={item} className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 size={32} className="text-primary" />
        </motion.div>
        <motion.h2 variants={item} className="text-xl font-bold font-heading">{t.requestSent}</motion.h2>
        <motion.p variants={item} className="text-center text-sm font-mono text-muted-foreground">{t.sameAccount}</motion.p>
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
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl px-3 py-4 pb-20 sm:p-4 md:p-8">
      <motion.div variants={item} className="mb-6 flex items-center gap-3">
        <div className="glow-primary flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <HeadphonesIcon size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black font-heading sm:text-2xl">{t.title}</h1>
          <p className="text-xs text-muted-foreground">{t.subtitle}</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl">
          <p className="text-sm font-semibold text-foreground">{t.replyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.replyBody}</p>
        </div>
        <div className="rounded-[24px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl">
          <p className="text-sm font-semibold text-foreground">{t.expectationTitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.expectationBody}</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-4 rounded-[24px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles size={16} />
          {t.quickTitle}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t.quickSubtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => applyPrompt(prompt.text)}
              className="rounded-full border border-border/60 bg-secondary/40 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary/35 hover:bg-primary/10"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-border/30 bg-card/50 spotlight-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">{t.directRequest}</CardTitle>
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
              rows={6}
              className="resize-none border-border/30 bg-secondary/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/40"
            />

            <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2 focus-visible:ring-2 focus-visible:ring-primary/40">
              <Send size={14} /> {loading ? t.sending : t.send}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
