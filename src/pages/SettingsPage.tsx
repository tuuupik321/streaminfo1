import { motion } from "framer-motion";
import { Sparkles, Bell, Shield, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";
import { UiLanguage } from "@/lib/language";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function LanguageSettings() {
  const { t } = useI18n();
  const { language, setLanguage } = useSettingsStore();
  const activeLanguage = language === "ru" ? "ru" : "en";

  return (
    <div className="space-y-2">
      <label className="font-mono text-sm">{t("settings.language")}</label>
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 px-3 py-2">
        <span className={activeLanguage === "ru" ? "text-foreground drop-shadow-[0_0_10px_rgba(145,70,255,0.6)]" : "text-muted-foreground"}>RU</span>
        <button
          type="button"
          onClick={() => setLanguage((activeLanguage === "ru" ? "en" : "ru") as UiLanguage)}
          className="relative h-6 w-16 rounded-full border border-border/40 bg-background/80"
          aria-label={t("settings.language", "Language")}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute top-1 h-4 w-7 rounded-full bg-primary shadow-[0_0_14px_rgba(145,70,255,0.6)]"
            style={{ left: activeLanguage === "ru" ? "0.25rem" : "2.75rem" }}
          />
        </button>
        <span className={activeLanguage === "en" ? "text-foreground drop-shadow-[0_0_10px_rgba(145,70,255,0.6)]" : "text-muted-foreground"}>EN</span>
      </div>
      <p className="text-xs text-muted-foreground">{t("settings.languageDesc", "Switch the interface language instantly across the app.")}</p>
    </div>
  );
}

function ThemeSettings() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { glowIntensity, setGlowIntensity } = useSettingsStore();

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="font-mono text-sm">{t("settings.theme")}</label>
        <div className="grid grid-cols-3 gap-2">
          <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="gap-2">{t("settings.themeLight", "Light")}</Button>
          <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="gap-2">{t("settings.themeDark", "Dark")}</Button>
          <Button variant={theme === "neon" ? "default" : "outline"} onClick={() => setTheme("neon")} className="gap-2">{t("settings.themeNeon", "Neon")}</Button>
        </div>
      </div>
      <div className="space-y-2 rounded-2xl border border-border/60 bg-secondary/40 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles size={14} /> {t("settings.cardStyle", "Card Style")}
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.glowIntensity", "Liquid Glow intensity")}</p>
        <Slider value={[Math.round(glowIntensity * 100)]} step={50} onValueChange={(value) => setGlowIntensity(value[0] / 100)} />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{t("settings.glowLow", "Low")}</span>
          <span>{t("settings.glowMedium", "Medium")}</span>
          <span>{t("settings.glowHigh", "High")}</span>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 pb-24 sm:p-4 md:p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 text-gradient-primary sm:mb-8">
        {t("settings.title", "Settings")}
      </motion.h1>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Section title={t("settings.account", "Account")} description={t("settings.accountDesc", "Manage your profile and access.")}>
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center"><User size={16} /></div>
              <div>
                <p className="text-sm font-semibold">Streamer</p>
                <p className="text-xs text-muted-foreground">Connected via Telegram</p>
              </div>
            </div>
          </Section>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section title={t("settings.appearance", "Appearance")} description={t("settings.appearanceDesc", "Customize your theme and glow style.")}>
            <ThemeSettings />
          </Section>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Section title={t("settings.notifications", "Notifications")} description={t("settings.notificationsDesc", "Choose what you want to be notified about.")}>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-3">
                <span className="text-sm">Stream start</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-3">
                <span className="text-sm">Donations</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-3">
                <span className="text-sm">Followers</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-3">
                <span className="text-sm">Subscribers</span>
                <Switch />
              </div>
            </div>
          </Section>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Section title={t("settings.language", "Language")} description={t("settings.languageDesc", "Switch the interface language instantly across the app.")}>
            <LanguageSettings />
          </Section>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Section title={t("settings.security", "Security")} description={t("settings.securityDesc", "Control access and protection.")}>
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Shield size={14} /> 2FA
              </div>
              <Button size="sm" variant="outline">Enable</Button>
            </div>
          </Section>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Section title={t("settings.support", "Support")} description={t("support.contactSupport", "Contact support")}>
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <p className="text-sm font-semibold">{t("support.needHelp", "Need help?")}</p>
              <p className="text-xs text-muted-foreground">{t("support.contactSupport", "Contact support")}</p>
              <Button asChild className="mt-4 w-full hover-lift">
                <Link to="/support">{t("support.openSupport", "Open Support")}</Link>
              </Button>
            </div>
          </Section>
        </motion.div>
      </div>
    </div>
  );
}
