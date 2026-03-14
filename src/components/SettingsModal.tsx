import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cog, MessageSquare, Palette, Languages, Sparkles, Link2 } from "lucide-react";
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
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 18, stiffness: 220 } },
  exit: { opacity: 0, y: 8, scale: 0.98 },
};

export function SettingsModal({ open, anchorRect, onClose }: SettingsModalProps) {
  const { language, t } = useI18n();
  const activeLanguage = language === "ru" ? "ru" : "en";
  const { theme, setTheme } = useTheme();
  const { glowIntensity, setGlowIntensity, setLanguage, surfaceBehavior, setSurfaceBehavior } = useSettingsStore();
  const activeTheme = theme === "light" ? "light" : "dark";
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const isAnchored = Boolean(anchorRect && typeof window !== "undefined" && window.innerWidth < 768);
  const panelStyle = (() => {
    if (!isAnchored || !anchorRect || typeof window === "undefined") return undefined;
    const padding = 12;
    const panelWidth = Math.min(window.innerWidth * 0.92, 420);
    const anchorCenter = anchorRect.left + anchorRect.width / 2;
    const left = Math.min(
      window.innerWidth - padding - panelWidth,
      Math.max(padding, anchorCenter - panelWidth + 28),
    );
    const bottom = Math.max(
      padding,
      window.innerHeight - anchorRect.top + 10,
    );
    return { left, bottom };
  })();
  const panelClass = isAnchored
    ? "fixed w-[min(92vw,420px)] max-h-[75vh] origin-bottom-right overflow-y-auto rounded-[22px] border border-white/10 bg-[#0c0c12] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
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
                <TabsList className="grid w-full grid-cols-4 gap-2 bg-white/5">
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
                  <TabsTrigger
                    value="integrations"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <Link2 size={12} />
                    </motion.span>
                    {t("integrations.title", "Integrations")}
                  </TabsTrigger>
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
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
                        <Button size="sm" variant={activeTheme === "light" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setTheme("light"); }} className="flex-1">{t("settings.themeLight", "Light")}</Button>
                        <Button size="sm" variant={activeTheme === "dark" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setTheme("dark"); }} className="flex-1">{t("settings.themeDark", "Dark")}</Button>
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
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center gap-2 text-white">
                        <Palette size={12} /> {t("settings.surfaceBehavior", "Surface behavior")}
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-white/40">{t("settings.surfaceHint", "Glass depth")}</p>
                        <div className="mt-4">
                          <Slider
                            value={[Math.round(surfaceBehavior * 100)]}
                            step={10}
                            onValueChange={(value) => setSurfaceBehavior(value[0] / 100)}
                          />
                          <div className="mt-3 flex justify-between text-[11px] text-white/40">
                            <span>{t("settings.surfaceLow", "Flat")}</span>
                            <span>{t("settings.surfaceHigh", "Deep")}</span>
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
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={activeLanguage === "ru" ? "default" : "outline"}
                        onClick={() => setLanguage("ru")}
                        className="flex-1"
                      >
                        RU
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={activeLanguage === "en" ? "default" : "outline"}
                        onClick={() => setLanguage("en")}
                        className="flex-1"
                      >
                        EN
                      </Button>
                    </div>
                    <p className="mt-3 text-[11px] text-white/40">{t("settings.languageHint", "UI language")}</p>
                  </div>
                </TabsContent>

                <TabsContent value="integrations" className="mt-4 space-y-3 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <Link2 size={12} /> {t("integrations.title", "Integrations")}
                  </motion.div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <p className="text-white">{t("integrations.title", "Integrations")}</p>
                    <p className="text-white/60">{t("integrations.description", "Manage Twitch, YouTube, Telegram and donation platforms.")}</p>
                    <Button asChild className="mt-4 w-full gap-2 rounded-[22px] bg-white/10 text-white hover:bg-white/20 hover:shadow-[0_0_30px_rgba(145,70,255,0.55)] hover-lift" onClick={onClose}>
                      <Link to="/integrations">{t("integrations.open", "Open Integrations")}</Link>
                    </Button>
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
