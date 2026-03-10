import { createContext, useContext, useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

type Theme = "dark" | "light" | "system" | "neon";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, glowIntensity, cardStyle } = useSettingsStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "neon");

    const intensity = Math.max(0, Math.min(glowIntensity, 1));
    root.style.setProperty("--glow-intensity", String(intensity));
    root.style.setProperty("--glow-soft", `${Math.round(10 + 18 * intensity)}px`);
    root.style.setProperty("--glow-strong", `${Math.round(40 + 90 * intensity)}px`);
    root.style.setProperty("--glow-alpha", `${(0.18 + 0.35 * intensity).toFixed(2)}`);
    root.style.setProperty("--glow-alpha-strong", `${(0.08 + 0.22 * intensity).toFixed(2)}`);
    root.style.setProperty("--card-style", cardStyle);

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    if (theme === "neon") {
      root.classList.add("dark", "neon");
      return;
    }
    root.classList.add(theme);
  }, [theme, glowIntensity, cardStyle]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
