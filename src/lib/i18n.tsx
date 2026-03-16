import { createContext, useContext, useState, useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { normalizeUiLanguage, UiLanguage } from "./language";

type Translations = Record<string, string>;
type I18nContextType = {
  language: UiLanguage;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

async function loadTranslations(lang: UiLanguage): Promise<Translations> {
  try {
    const module = await import(`../locales/${lang}.json`);
    return module.default;
  } catch (error) {
    console.warn(`Could not load translations for ${lang}, falling back to 'ru'.`);
    const module = await import(`../locales/ru.json`);
    return module.default;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const rawLanguage = useSettingsStore((state) => state.language);
  const language = normalizeUiLanguage(rawLanguage) || "ru";
  const [translations, setTranslations] = useState<Translations>({});
  const fallbackLanguage: UiLanguage = language === "ru" ? "en" : "ru";
  const [fallbackTranslations, setFallbackTranslations] = useState<Translations>({});

  useEffect(() => {
    loadTranslations(language).then(setTranslations);
  }, [language]);

  useEffect(() => {
    loadTranslations(fallbackLanguage).then(setFallbackTranslations);
  }, [fallbackLanguage]);

  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallbackTranslations[key] || fallback || key;
  };

  return (
    <I18nContext.Provider value={{ language, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
