import { motion, useReducedMotion } from "framer-motion";
import { Languages, Link2, MessageSquare, Palette, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";
import { UiLanguage } from "@/lib/language";
import { useTheme } from "@/components/ThemeProvider";
import { makeFadeUp, makeStagger } from "@/shared/motion";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: { id?: number } };
    };
  };
};

type SettingsPayload = {
  twitch_name?: string | null;
  yt_channel_id?: string | null;
  donationalerts_name?: string | null;
  telegram_channel?: string | null;
  kick_name?: string | null;
};

function OverviewRow({
  icon: Icon,
  title,
  description,
  value,
  to,
}: {
  icon: typeof Palette;
  title: string;
  description: string;
  value: string;
  to?: string;
}) {
  const content = (
    <div className="flex items-center justify-between gap-3 rounded-[26px] border border-border/60 bg-card/70 px-4 py-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl transition hover:-translate-y-[1px] hover:border-primary/35 sm:px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/80">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="text-right text-sm text-white/80">{value}</div>
    </div>
  );

  if (!to) return content;
  return <Link to={to}>{content}</Link>;
}

function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const { glowIntensity, setGlowIntensity } = useSettingsStore();

  return (
    <div className="space-y-4 rounded-[26px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl sm:p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">Предпросмотр интерфейса</p>
        <p className="mt-1 text-xs text-muted-foreground">Изменения применяются сразу.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")} className="gap-2">Системная</Button>
        <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="gap-2">Темная</Button>
        <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="gap-2">Светлая</Button>
        <Button variant={theme === "neon" ? "default" : "outline"} onClick={() => setTheme("neon")} className="gap-2">Неон</Button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Сила эффектов</p>
        <p className="mt-1 text-xs text-white/55">Сделайте интерфейс спокойнее или ярче, не теряя читаемость.</p>
        <div className="mt-4">
          <Slider value={[Math.round(glowIntensity * 100)]} step={10} onValueChange={(value) => setGlowIntensity(value[0] / 100)} />
        </div>
      </div>
    </div>
  );
}

function LanguageSettings() {
  const { language } = useI18n();
  const { setLanguage } = useSettingsStore();
  const activeLanguage = language === "ru" ? "ru" : "en";

  return (
    <div className="space-y-4 rounded-[26px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl sm:p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">Язык интерфейса</p>
        <p className="mt-1 text-xs text-muted-foreground">Текущий язык: {activeLanguage === "ru" ? "Русский" : "English"}</p>
        <p className="mt-2 text-xs text-muted-foreground">Язык изменит названия экранов, кнопок и системных сообщений.</p>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-2">
        <Button
          type="button"
          size="sm"
          variant={activeLanguage === "ru" ? "default" : "outline"}
          onClick={() => setLanguage("ru" as UiLanguage)}
          className="flex-1"
        >
          Русский
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeLanguage === "en" ? "default" : "outline"}
          onClick={() => setLanguage("en" as UiLanguage)}
          className="flex-1"
        >
          English
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { language } = useSettingsStore();
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);
  const tg = (window as TelegramWindow).Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;
  const initData = tg?.initData || "";

  const { data: settingsPayload } = useQuery<SettingsPayload>({
    queryKey: ["settings-page", userId],
    queryFn: async () => {
      const res = await fetch(`/api/settings?user_id=${userId}&init_data=${encodeURIComponent(initData)}`);
      if (!res.ok) return {};
      return res.json();
    },
    enabled: !!userId && !!initData,
    refetchInterval: 60_000,
  });

  const connectedCount = [
    settingsPayload?.twitch_name,
    settingsPayload?.yt_channel_id,
    settingsPayload?.donationalerts_name,
    settingsPayload?.telegram_channel,
    settingsPayload?.kick_name,
  ].filter(Boolean).length;

  const themeLabel = theme === "system" ? "Системная" : theme === "dark" ? "Темная" : theme === "light" ? "Светлая" : "Неон";
  const languageLabel = language === "ru" ? "Русский" : "English";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-4xl px-2.5 py-2.5 pb-24 sm:px-3 sm:py-3 md:p-6">
      <motion.div variants={item} className="mb-4 sm:mb-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Настройки</div>
        <h1 className="mt-2 text-2xl font-black text-foreground">Общий экран настроек</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Быстрые категории сверху, текущие значения справа, а ниже только те настройки, которые реально влияют на опыт внутри mini app.</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-3 sm:gap-4">
        <OverviewRow icon={Palette} title="Внешний вид" description="тема и визуальные эффекты" value={`Тема: ${themeLabel}`} />
        <OverviewRow icon={Languages} title="Язык" description="язык интерфейса" value={`Язык: ${languageLabel}`} />
        <OverviewRow icon={Link2} title="Интеграции" description="платформы, донаты, уведомления" value={`Подключено: ${connectedCount} сервиса`} to="/integrations" />
        <OverviewRow icon={MessageSquare} title="Поддержка" description="помощь и обратная связь" value="Открыть" to="/support" />
      </motion.div>

      <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-6">
        <motion.div variants={item}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Palette size={16} /> Внешний вид</div>
          <ThemeSettings />
        </motion.div>

        <motion.div variants={item}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Languages size={16} /> Язык</div>
          <LanguageSettings />
        </motion.div>

        <motion.div variants={item} className="rounded-[26px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Link2 size={16} /> Интеграции</div>
          <p className="mt-2 text-sm text-muted-foreground">Подключите платформы, чтобы открыть аналитику, историю эфиров и AI-рекомендации.</p>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <Link to="/integrations">Открыть интеграции</Link>
          </Button>
        </motion.div>

        <motion.div variants={item} className="rounded-[26px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Sparkles size={16} /> Поддержка</div>
          <p className="mt-2 text-sm text-muted-foreground">Если что-то выглядит странно или хочется доработать workflow, здесь самый быстрый путь до обратной связи.</p>
          <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
            <Link to="/support">Открыть поддержку</Link>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
