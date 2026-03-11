import { useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { makeFadeUp, makeStagger } from "@/shared/motion";
import { CardShell } from "@/shared/ui/CardShell";

const COPY = {
  ru: { title: "Страница не найдена", back: "Вернуться на главную" },
  en: { title: "Page not found", back: "Return to home" },
  uk: { title: "Сторінку не знайдено", back: "Повернутися на головну" },
};

const NotFound = () => {
  const location = useLocation();
  const { language } = useI18n();
  const t = useMemo(() => COPY[language], [language]);
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <motion.div variants={item}>
        <CardShell className="px-8 py-10 text-center">
          <h1 className="mb-2 text-4xl font-black">404</h1>
          <p className="mb-6 text-lg text-muted-foreground">{t.title}</p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            {t.back}
          </a>
        </CardShell>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;
