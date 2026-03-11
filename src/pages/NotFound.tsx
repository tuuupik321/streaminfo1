import { useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Link2, Megaphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { makeFadeUp, makeStagger } from "@/shared/motion";
import { CardShell } from "@/shared/ui/CardShell";

const COPY = {
  ru: {
    title: "Страница не найдена",
    body: "Похоже, ссылка устарела или экран был перенесён. Ниже есть быстрые пути в самые полезные разделы mini app.",
    back: "Вернуться на главную",
  },
  en: {
    title: "Page not found",
    body: "This link may be outdated or the screen has moved. Use one of the quick paths below.",
    back: "Return home",
  },
  uk: {
    title: "Сторінку не знайдено",
    body: "Схоже, посилання застаріло або екран було перенесено. Нижче є швидкі переходи до корисних розділів.",
    back: "Повернутися на головну",
  },
};

const NotFound = () => {
  const location = useLocation();
  const { language } = useI18n();
  const t = useMemo(() => COPY[language as keyof typeof COPY] ?? COPY.ru, [language]);
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <motion.div variants={item} className="w-full max-w-xl">
        <CardShell className="space-y-5 px-6 py-8 text-center sm:px-8 sm:py-10">
          <div>
            <h1 className="mb-2 text-4xl font-black">404</h1>
            <p className="text-lg font-semibold text-foreground">{t.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.body}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <a href="/" className="rounded-2xl border border-border/60 bg-secondary/35 p-4 text-left transition hover:border-primary/30 hover:bg-primary/10">
              <ArrowLeft size={16} className="text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Главная</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Вернуться к сводке и следующему шагу.</p>
            </a>
            <a href="/integrations" className="rounded-2xl border border-border/60 bg-secondary/35 p-4 text-left transition hover:border-primary/30 hover:bg-primary/10">
              <Link2 size={16} className="text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Интеграции</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Подключить платформы, донаты и Telegram.</p>
            </a>
            <a href="/announcements" className="rounded-2xl border border-border/60 bg-secondary/35 p-4 text-left transition hover:border-primary/30 hover:bg-primary/10">
              <Megaphone size={16} className="text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">Анонсы</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Собрать короткий пост и ссылку на эфир.</p>
            </a>
          </div>

          <a href="/" className="inline-flex items-center justify-center text-primary underline hover:text-primary/90">
            {t.back}
          </a>
        </CardShell>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;
