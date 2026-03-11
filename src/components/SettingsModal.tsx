import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cog, MessageSquare, Palette, Languages, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "react-router-dom";

type SettingsModalProps = {
  open: boolean;
  anchorRect?: DOMRect | null;
  onClose: () => void;
};

type Ripple = { id: number; x: number; y: number };
type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      HapticFeedback?: {
        impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
      };
    };
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 18, stiffness: 220 } },
  exit: { opacity: 0, y: -12, scale: 0.98 },
};

export function SettingsModal({ open, anchorRect, onClose }: SettingsModalProps) {
  const { language, t } = useI18n();
  const activeLanguage = language === "ru" ? "ru" : "en";
  const { theme, setTheme } = useTheme();
  const { glowIntensity, setGlowIntensity, setLanguage } = useSettingsStore();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const isAnchored = Boolean(anchorRect && typeof window !== "undefined" && window.innerWidth < 768);
  const panelStyle = (() => {
    if (!isAnchored || !anchorRect || typeof window === "undefined") return undefined;
    const padding = 12;
    const panelWidth = Math.min(window.innerWidth * 0.92, 420);
    const alignLeft = anchorRect.left < window.innerWidth / 2;
    const left = alignLeft
      ? Math.min(window.innerWidth - padding - panelWidth, Math.max(padding, anchorRect.left))
      : Math.max(padding, anchorRect.right - panelWidth);
    const top = Math.min(
      window.innerHeight - padding - 24,
      Math.max(padding, anchorRect.top),
    );
    return { left, top };
  })();
  const panelClass = isAnchored
    ? "fixed w-[min(92vw,420px)] max-h-[75vh] -translate-y-3 overflow-y-auto rounded-[22px] border border-white/10 bg-[#0c0c12] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
    : "w-full max-w-4xl overflow-hidden rounded-[22px] border border-white/10 bg-[#0c0c12] shadow-[0_30px_80px_rgba(0,0,0,0.45)]";
  const containerClass = isAnchored
    ? "fixed inset-0 z-[90] bg-black/60"
    : "fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-3 pt-16 sm:px-4 sm:pt-20";

  const handleRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 500);
  };

  useEffect(() => {
    if (!open) return;
    const tg = (window as TelegramWindow).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred?.("light");
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={containerClass}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className={panelClass}
            style={{ ...panelStyle, boxShadow: "0 0 70px rgba(145,70,255,0.35)" }}
            variants={panelVariants}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-2">
                  <Cog size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t("settings.title", "Settings")}</p>
                  <p className="text-[11px] text-white/50">{t("settings.subtitle", "StreamInfo control center")}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white h-8 px-2 text-xs">
                {t("actions.close", "Close")}
              </Button>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <Tabs defaultValue="language" className="w-full">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                    <Languages size={12} className="text-white/70" />
                    <span className={activeLanguage === "ru" ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" : "text-white/40"}>RU</span>
                    <button
                      type="button"
                      onClick={() => setLanguage(activeLanguage === "ru" ? "en" : "ru")}
                      className="relative h-5 w-16 rounded-full border border-white/10 bg-white/5 px-1"
                      aria-label={t("settings.language", "Language")}
                    >
                      <motion.span
                        layout
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="absolute top-1 h-3 w-6 rounded-full bg-white/90 shadow-[0_0_12px_rgba(145,70,255,0.7)]"
                        style={{ left: activeLanguage === "ru" ? "0.25rem" : "2.5rem" }}
                      />
                    </button>
                    <span className={activeLanguage === "en" ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" : "text-white/40"}>EN</span>
                  </div>
                  <p className="text-[10px] text-white/40">{t("settings.languageHint", "UI language")}</p>
                </div>
                <TabsList className="grid w-full grid-cols-3 gap-2 bg-white/5">
                  <TabsTrigger
                    value="support"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <MessageSquare size={12} />
                    </motion.span>
                    {t("settings.support", "Support")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="appearance"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <Palette size={12} />
                    </motion.span>
                    {t("settings.appearance", "Appearance")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="language"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <Languages size={12} />
                    </motion.span>
                    {t("settings.language", "Language")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="support" className="mt-4 space-y-3 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <MessageSquare size={12} /> {t("settings.support", "Support")}
                  </motion.div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <p className="text-white">{t("support.needHelp", "Need help?")}</p>
                    <p className="text-white/60">{t("support.contactSupport", "Contact support")}</p>
                    <Button asChild className="mt-4 w-full gap-2 rounded-[22px] bg-white/10 text-white hover:bg-white/20 hover:shadow-[0_0_30px_rgba(0,178,255,0.55)] hover-lift">
                      <Link to="/support">{t("support.openSupport", "Open Support")}</Link>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="mt-4 space-y-4 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <Palette size={12} /> {t("settings.appearance", "Appearance")}
                  </motion.div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-white/40">{t("settings.theme", "Theme")}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant={theme === "dark" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setTheme("dark"); }} className="relative overflow-hidden">{t("settings.themeDark", "Dark")}</Button>
                        <Button size="sm" variant={theme === "light" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setTheme("light"); }} className="relative overflow-hidden">{t("settings.themeLight", "Light")}</Button>
                        <Button size="sm" variant={theme === "neon" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setTheme("neon"); }} className="relative overflow-hidden">{t("settings.themeNeon", "Neon")}</Button>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center gap-2 text-white">
                        <Sparkles size={12} /> {t("settings.cardStyle", "Card Style")}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/40">{t("settings.glowIntensity", "Liquid Glow intensity")}</p>
                        <div className="mt-4">
                          <Slider
                            value={[Math.round(glowIntensity * 100)]}
                            step={50}
                            onValueChange={(value) => setGlowIntensity(value[0] / 100)}
                          />
                          <div className="mt-3 flex justify-between text-[11px] text-white/40">
                            <span>{t("settings.glowLow", "Low")}</span>
                            <span>{t("settings.glowMedium", "Medium")}</span>
                            <span>{t("settings.glowHigh", "High")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="language" className="mt-4 space-y-3 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <Languages size={12} /> {t("settings.language", "Language")}
                  </motion.div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/60">{t("settings.languageDesc", "Switch the interface language instantly across the app.")}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                className="pointer-events-none absolute h-8 w-8 rounded-full"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  background: "rgba(145,70,255,0.25)",
                  border: "1px solid rgba(145,70,255,0.6)",
                }}
                initial={{ scale: 0, opacity: 0.8, x: "-50%", y: "-50%" }}
                animate={{ scale: 10, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
