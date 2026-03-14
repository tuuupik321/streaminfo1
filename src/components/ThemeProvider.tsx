import { createContext, useContext, useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

type Theme = "dark" | "light";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, glowIntensity, cardStyle, surfaceBehavior } = useSettingsStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const intensity = Math.max(0, Math.min(glowIntensity, 1));
    const surface = Math.max(0, Math.min(surfaceBehavior, 1));
    root.style.setProperty("--glow-intensity", String(intensity));
    root.style.setProperty("--glow-soft", `${Math.round(10 + 18 * intensity)}px`);
    root.style.setProperty("--glow-strong", `${Math.round(40 + 90 * intensity)}px`);
    root.style.setProperty("--glow-alpha", `${(0.18 + 0.35 * intensity).toFixed(2)}`);
    root.style.setProperty("--glow-alpha-strong", `${(0.08 + 0.22 * intensity).toFixed(2)}`);
    root.style.setProperty("--card-style", cardStyle);
    root.style.setProperty("--surface-strength", surface.toFixed(2));
    root.style.setProperty("--surface-border-alpha", `${(0.08 + 0.2 * surface).toFixed(2)}`);
    root.style.setProperty("--surface-bg-alpha", `${(0.62 + 0.28 * surface).toFixed(2)}`);
    root.style.setProperty("--surface-bg-alpha-strong", `${(0.48 + 0.24 * surface).toFixed(2)}`);
    root.style.setProperty("--surface-blur", `${Math.round(10 + 18 * surface)}px`);
    root.style.setProperty("--surface-shadow-alpha", `${(0.22 + 0.36 * surface).toFixed(2)}`);

    const normalizedTheme = theme === "light" ? "light" : "dark";
    root.classList.add(normalizedTheme);
  }, [theme, glowIntensity, cardStyle, surfaceBehavior]);

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
