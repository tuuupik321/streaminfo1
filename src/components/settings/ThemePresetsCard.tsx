import { motion } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    primary: string;
    secondary: string;
    muted: string;
    mutedForeground: string;
    border: string;
    accent: string;
  };
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    name: "Стандарт",
    emoji: "💜",
    colors: {
      background: "240 6% 4%",
      foreground: "0 0% 95%",
      card: "240 5% 8%",
      primary: "264 67% 63%",
      secondary: "240 4% 14%",
      muted: "240 4% 14%",
      mutedForeground: "240 5% 55%",
      border: "240 4% 16%",
      accent: "264 67% 63%",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    emoji: "🌆",
    colors: {
      background: "260 20% 4%",
      foreground: "180 100% 90%",
      card: "260 15% 8%",
      primary: "180 100% 50%",
      secondary: "260 15% 14%",
      muted: "260 10% 16%",
      mutedForeground: "180 30% 50%",
      border: "260 15% 18%",
      accent: "320 100% 60%",
    },
  },
  {
    id: "neon",
    name: "Neon",
    emoji: "💚",
    colors: {
      background: "160 10% 3%",
      foreground: "120 80% 90%",
      card: "160 8% 7%",
      primary: "120 100% 45%",
      secondary: "160 8% 12%",
      muted: "160 5% 14%",
      mutedForeground: "120 20% 50%",
      border: "160 8% 16%",
      accent: "120 100% 45%",
    },
  },
  {
    id: "retro",
    name: "Retro",
    emoji: "🕹️",
    colors: {
      background: "30 15% 5%",
      foreground: "40 80% 90%",
      card: "30 12% 9%",
      primary: "38 92% 50%",
      secondary: "30 10% 14%",
      muted: "30 8% 15%",
      mutedForeground: "30 20% 50%",
      border: "30 10% 18%",
      accent: "38 92% 50%",
    },
  },
  {
    id: "minimal",
    name: "Минимализм",
    emoji: "⬜",
    colors: {
      background: "0 0% 5%",
      foreground: "0 0% 90%",
      card: "0 0% 8%",
      primary: "0 0% 70%",
      secondary: "0 0% 13%",
      muted: "0 0% 14%",
      mutedForeground: "0 0% 50%",
      border: "0 0% 16%",
      accent: "0 0% 70%",
    },
  },
  {
    id: "sakura",
    name: "Сакура",
    emoji: "🌸",
    colors: {
      background: "330 15% 4%",
      foreground: "330 40% 92%",
      card: "330 12% 8%",
      primary: "330 80% 60%",
      secondary: "330 10% 14%",
      muted: "330 8% 15%",
      mutedForeground: "330 20% 50%",
      border: "330 10% 18%",
      accent: "330 80% 60%",
    },
  },
];

function applyTheme(preset: ThemePreset) {
  const root = document.documentElement;
  root.style.setProperty("--background", preset.colors.background);
  root.style.setProperty("--foreground", preset.colors.foreground);
  root.style.setProperty("--card", preset.colors.card);
  root.style.setProperty("--card-foreground", preset.colors.foreground);
  root.style.setProperty("--popover", preset.colors.card);
  root.style.setProperty("--popover-foreground", preset.colors.foreground);
  root.style.setProperty("--primary", preset.colors.primary);
  root.style.setProperty("--secondary", preset.colors.secondary);
  root.style.setProperty("--secondary-foreground", preset.colors.foreground);
  root.style.setProperty("--muted", preset.colors.muted);
  root.style.setProperty("--muted-foreground", preset.colors.mutedForeground);
  root.style.setProperty("--accent", preset.colors.accent);
  root.style.setProperty("--accent-foreground", preset.colors.foreground);
  root.style.setProperty("--border", preset.colors.border);
  root.style.setProperty("--input", preset.colors.border);
  root.style.setProperty("--ring", preset.colors.primary);
  root.style.setProperty("--glow-primary", preset.colors.primary);
  root.style.setProperty("--sidebar-primary", preset.colors.primary);
  root.style.setProperty("--sidebar-ring", preset.colors.primary);
}

export function ThemePresetsCard() {
  const [activeTheme, setActiveTheme] = useState("default");

  useEffect(() => {
    // Load saved theme
    const loadTheme = async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "theme_preset").maybeSingle();
      const saved = data?.value || localStorage.getItem("theme_preset") || "default";
      setActiveTheme(saved);
      const preset = THEME_PRESETS.find((p) => p.id === saved);
      if (preset) applyTheme(preset);
    };
    loadTheme();
  }, []);

  const handleSelect = async (preset: ThemePreset) => {
    setActiveTheme(preset.id);
    applyTheme(preset);
    localStorage.setItem("theme_preset", preset.id);

    // Save to DB
    await supabase.from("settings").upsert({ key: "theme_preset", value: preset.id }, { onConflict: "key" });
    toast.success(`Тема «${preset.name}» применена`);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {THEME_PRESETS.map((preset) => (
          <motion.button
            key={preset.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(preset)}
            className={`relative rounded-xl p-3 border-2 transition-all text-center ${
              activeTheme === preset.id
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-secondary/20 hover:border-border"
            }`}
          >
            {activeTheme === preset.id && (
              <div className="absolute top-1.5 right-1.5">
                <Check size={12} className="text-primary" />
              </div>
            )}
            <span className="text-lg block mb-1">{preset.emoji}</span>
            <span className="text-[10px] font-mono text-foreground">{preset.name}</span>
            {/* Color preview dots */}
            <div className="flex justify-center gap-1 mt-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.primary})` }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.background})` }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.accent})` }} />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export { THEME_PRESETS, applyTheme };
