export type UiLanguage = "ru" | "en" | "uk";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          language_code?: string;
        };
      };
    };
  };
};

export function normalizeUiLanguage(value: string | null | undefined): UiLanguage | null {
  if (!value) return null;
  const short = value.toLowerCase().slice(0, 2);
  if (short === "ru" || short === "en" || short === "uk") return short;
  return null;
}

export function detectTelegramUiLanguage(): UiLanguage {
  if (typeof window === "undefined") return "ru";
  const telegramCode = (window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  const browserCode = typeof navigator !== "undefined" ? navigator.language : null;
  return normalizeUiLanguage(telegramCode) || normalizeUiLanguage(browserCode) || "ru";
}
