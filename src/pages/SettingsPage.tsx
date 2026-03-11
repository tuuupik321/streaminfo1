import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Shield, User, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";
import { UiLanguage } from "@/lib/language";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { makeFadeUp, makeStagger } from "@/shared/motion";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="card-glass">
      <CardHeader className="px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:space-y-4 sm:px-6 sm:pb-6">
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
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t("settings.languageDesc", "Switch the interface language instantly across the app.")}
      </p>
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-2">
        <Button
          type="button"
          size="sm"
          variant={activeLanguage === "ru" ? "default" : "outline"}
          onClick={() => setLanguage("ru" as UiLanguage)}
          className="flex-1"
        >
          RU
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeLanguage === "en" ? "default" : "outline"}
          onClick={() => setLanguage("en" as UiLanguage)}
          className="flex-1"
        >
          EN
        </Button>
      </div>
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
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl px-2.5 py-2.5 pb-24 sm:px-3 sm:py-3 md:p-6">
      <motion.h1 variants={item} className="mb-4 text-gradient-primary sm:mb-8">
        {t("settings.title", "Settings")}
      </motion.h1>
      <div className="space-y-4 sm:space-y-6">
        <motion.div variants={item}>
          <Section title={t("settings.account", "Account")} description={t("settings.accountDesc", "Manage your profile and access.")}>
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center"><User size={16} /></div>
              <div>
                <p className="text-sm font-semibold">{t("settings.accountName", "Стример")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.accountConnected", "Подключено через Telegram")}</p>
              </div>
            </div>
          </Section>
        </motion.div>

        <motion.div variants={item}>
          <Section title={t("settings.appearance", "Appearance")} description={t("settings.appearanceDesc", "Customize your theme and glow style.")}>
            <ThemeSettings />
          </Section>
        </motion.div>

        <motion.div variants={item}>
          <Section title={t("settings.notifications", "Notifications")} description={t("settings.notificationsDesc", "Choose what you want to be notified about.")}>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-3">
                <span className="text-sm">{t("settings.notifyStreamStart", "Старт стрима")}</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-3">
                <span className="text-sm">{t("settings.notifyDonations", "Донаты")}</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-3">
                <span className="text-sm">{t("settings.notifyFollowers", "Фолловеры")}</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-3">
                <span className="text-sm">{t("settings.notifySubscribers", "Подписчики")}</span>
                <Switch />
              </div>
            </div>
          </Section>
        </motion.div>

        <motion.div variants={item}>
          <Section title={t("settings.language", "Language")} description={t("settings.languageDesc", "Switch the interface language instantly across the app.")}>
            <LanguageSettings />
          </Section>
        </motion.div>

        <motion.div variants={item}>
          <Section title={t("settings.security", "Security")} description={t("settings.securityDesc", "Control access and protection.")}>
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Shield size={14} /> 2FA
              </div>
              <Button size="sm" variant="outline">{t("settings.enable", "Включить")}</Button>
            </div>
          </Section>
        </motion.div>

        <motion.div variants={item}>
          <Section title={t("integrations.title", "Integrations")} description={t("integrations.subtitle", "Connect your platforms")}>
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Link2 size={14} /> {t("integrations.title", "Integrations")}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("integrations.description", "Manage Twitch, YouTube, Telegram and donation platforms.")}</p>
              <Button asChild className="mt-4 w-full hover-lift">
                <Link to="/integrations">{t("integrations.open", "Open Integrations")}</Link>
              </Button>
            </div>
          </Section>
        </motion.div>

        <motion.div variants={item}>
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
    </motion.div>
  );
}
