import { useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useI18n } from "@/lib/i18n";

const COPY = {
  ru: { title: "Страница не найдена", back: "Вернуться на главную" },
  en: { title: "Page not found", back: "Return to home" },
  uk: { title: "Сторінку не знайдено", back: "Повернутися на головну" },
};

const NotFound = () => {
  const location = useLocation();
  const { language } = useI18n();
  const t = useMemo(() => COPY[language], [language]);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t.title}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t.back}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
