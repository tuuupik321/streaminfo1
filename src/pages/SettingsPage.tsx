import { motion } from "framer-motion";
import { Bell, Globe, Palette, Sun, Moon, Laptop } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";
import { UiLanguage } from "@/lib/language";
import { useTheme } from "@/components/ThemeProvider";

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

  return (
    <div className="space-y-2">
      <label className="font-mono text-sm">{t("settings.language")}</label>
      <Select value={language} onValueChange={(value) => setLanguage(value as UiLanguage)}>
        <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ru" className="font-mono text-sm">{t("settings.languageRu")}</SelectItem>
          <SelectItem value="en" className="font-mono text-sm">{t("settings.languageEn")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function ThemeSettings() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <label className="font-mono text-sm">{t("settings.theme")}</label>
      <div className="grid grid-cols-3 gap-2">
        <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="gap-2"><Sun size={14}/> {t("settings.themeLight")}</Button>
        <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="gap-2"><Moon size={14}/> {t("settings.themeDark")}</Button>
        <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')} className="gap-2"><Laptop size={14}/> {t("settings.themeSystem")}</Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 pb-24 sm:p-4 md:p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 text-gradient-primary sm:mb-8">
        {t("settings.title", "Настройки")}
      </motion.h1>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section
            title={t("settings.appearance", "Внешний вид")}
            description={t("settings.appearanceDesc", "Настройте язык, тему и цвета приложения.")}
          >
            <LanguageSettings />
            <ThemeSettings />
          </Section>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Section
            title={t("settings.notifications", "Уведомления")}
            description={t("settings.notificationsDesc", "Выберите, какие уведомления и куда вы хотите получать.")}
          >
            {/* Notification settings will go here */}
            <p className="text-sm text-muted-foreground">{t("settings.notificationsComingSoon", "Настройки уведомлений скоро появятся здесь.")}</p>
          </Section>
        </motion.div>
      </div>
    </div>
  );
}
