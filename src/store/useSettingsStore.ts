import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UiLanguage, detectTelegramUiLanguage } from "@/lib/language";

type Theme = "light" | "dark" | "system";
type CardStyle = "minimal" | "colorful";

interface SettingsState {
  language: UiLanguage;
  theme: Theme;
  glowIntensity: number;
  cardStyle: CardStyle;
  setLanguage: (language: UiLanguage) => void;
  setTheme: (theme: Theme) => void;
  setGlowIntensity: (value: number) => void;
  setCardStyle: (style: CardStyle) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: detectTelegramUiLanguage(),
      theme: "system",
      glowIntensity: 0.6,
      cardStyle: "minimal",
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setGlowIntensity: (value) => set({ glowIntensity: value }),
      setCardStyle: (style) => set({ cardStyle: style }),
    }),
    {
      name: "app-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        glowIntensity: state.glowIntensity,
        cardStyle: state.cardStyle,
      }),
    },
  ),
);
