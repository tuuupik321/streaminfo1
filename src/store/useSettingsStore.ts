import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UiLanguage, detectTelegramUiLanguage } from "@/lib/language";

type Theme = "light" | "dark" | "system";

interface SettingsState {
  language: UiLanguage;
  theme: Theme;
  setLanguage: (language: UiLanguage) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: detectTelegramUiLanguage(),
      theme: "system",
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "app-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ language: state.language, theme: state.theme }),
    },
  ),
);
