import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Languages, Link2, MessageSquare, Palette, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";
import { UiLanguage } from "@/lib/language";
import { useTheme } from "@/components/ThemeProvider";
import { clearUserProfile, getOrCreateUserId, setUserId } from "@/database/users";
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
  vklive_name?: string | null;
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
    <div className="flex flex-col items-start gap-3 rounded-[24px] border border-border/60 bg-card/70 px-4 py-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl transition hover:-translate-y-[1px] hover:border-primary/35 sm:flex-row sm:items-center sm:justify-between sm:rounded-[26px] sm:px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/80">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="text-left text-sm text-white/80 sm:text-right">{value}</div>
    </div>
  );

  if (!to) return content;
  return <Link to={to}>{content}</Link>;
}

function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const { glowIntensity, setGlowIntensity, surfaceBehavior, setSurfaceBehavior } = useSettingsStore();
  const activeTheme = theme === "light" ? "light" : "dark";

  return (
    <div className="space-y-4 rounded-[26px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl sm:p-5">
      <div>
        <p className="text-sm font-semibold text-foreground">Предпросмотр интерфейса</p>
        <p className="mt-1 text-xs text-muted-foreground">Изменения применяются сразу.</p>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-2">
        <Button variant={activeTheme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="flex-1 gap-2">Светлая</Button>
        <Button variant={activeTheme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="flex-1 gap-2">Тёмная</Button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Сила эффектов</p>
        <p className="mt-1 text-xs text-white/55">Сделайте интерфейс спокойнее или ярче, не теряя читаемость.</p>
        <div className="mt-4">
          <Slider value={[Math.round(glowIntensity * 100)]} step={10} onValueChange={(value) => setGlowIntensity(value[0] / 100)} />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Поведение поверхностей</p>
        <p className="mt-1 text-xs text-white/55">Настройте глубину стекла и ощущение слоёв интерфейса.</p>
        <div className="mt-4">
          <Slider value={[Math.round(surfaceBehavior * 100)]} step={10} onValueChange={(value) => setSurfaceBehavior(value[0] / 100)} />
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
  const telegramUserId = tg?.initDataUnsafe?.user?.id;
  const initData = tg?.initData || "";
  const userId = getOrCreateUserId(telegramUserId);
  const isTelegram = Boolean(initData);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [linkStatus, setLinkStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [linkAction, setLinkAction] = useState<"start" | "complete" | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const { data: settingsPayload } = useQuery<SettingsPayload>({
    queryKey: ["settings-page", userId],
    queryFn: async () => {
      const params = new URLSearchParams({ user_id: userId });
      if (initData) {
        params.set("init_data", initData);
      }
      const res = await fetch(`/api/settings?${params.toString()}`);
      if (!res.ok) return {};
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 60_000,
  });
  const connectedCount = [
    settingsPayload?.twitch_name,
    settingsPayload?.yt_channel_id,
    settingsPayload?.donationalerts_name,
    settingsPayload?.telegram_channel,
    settingsPayload?.kick_name,
    settingsPayload?.vklive_name,
  ].filter(Boolean).length;

  const themeLabel = theme === "light" ? "Светлая" : "Тёмная";
  const languageLabel = language === "ru" ? "Русский" : "English";
  const nextStep = connectedCount === 0
    ? {
      title: "Следующий шаг",
        text: "Подключите первую платформу, чтобы открыть аналитику, историю эфиров и режим паузы.",
        cta: "Подключить платформу",
      }
    : connectedCount < 3
      ? {
          title: "Что можно усилить",
          text: "Добавьте Telegram или сервис донатов, чтобы публиковать ссылку на эфир и видеть поддержку в одном месте.",
          cta: "Открыть интеграции",
        }
      : {
          title: "Система почти собрана",
          text: "Проверьте тему, язык и оставшиеся интеграции, чтобы mini app чувствовалась цельно на каждом экране.",
          cta: "Проверить интеграции",
        };

  const isStarting = linkStatus === "loading" && linkAction === "start";
  const isCompleting = linkStatus === "loading" && linkAction === "complete";

  const requestLinkCode = async () => {
    if (!isTelegram) {
      setLinkStatus("error");
      setLinkMessage("Откройте этот экран в Telegram, чтобы получить код.");
      return;
    }

    setLinkAction("start");
    setLinkStatus("loading");
    setLinkMessage(null);
    setLinkCode(null);

    try {
      const res = await fetch("/api/link/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, init_data: initData }),
      });
      const data = (await res.json().catch(() => ({}))) as { code?: string; expires_in?: number; error?: string };
      if (!res.ok) {
        const errorCode = typeof data?.error === "string" ? data.error : "";
        const message =
          errorCode === "invalid_init_data"
            ? "Откройте mini app через Telegram и попробуйте снова."
            : "Не удалось получить код. Попробуйте ещё раз.";
        setLinkStatus("error");
        setLinkMessage(message);
        return;
      }
      const code = typeof data?.code === "string" ? data.code : "";
      if (!code) {
        setLinkStatus("error");
        setLinkMessage("Не удалось получить код. Попробуйте ещё раз.");
        return;
      }
      const expiresIn = typeof data?.expires_in === "number" ? data.expires_in : 600;
      const minutes = Math.max(1, Math.round(expiresIn / 60));
      setLinkCode(code);
      setLinkStatus("success");
      setLinkMessage(`Код активен ${minutes} мин. Введите его на сайте или в приложении.`);
    } catch {
      setLinkStatus("error");
      setLinkMessage("Не удалось получить код. Попробуйте ещё раз.");
    } finally {
      setLinkAction(null);
    }
  };

  const submitLinkCode = async () => {
    const code = linkInput.trim().replace(/\s+/g, "");
    if (!code) {
      setLinkStatus("error");
      setLinkMessage("Введите код из Telegram.");
      return;
    }

    setLinkAction("complete");
    setLinkStatus("loading");
    setLinkMessage(null);

    try {
      const res = await fetch("/api/link/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => ({}))) as { user_id?: number | string; error?: string };
      if (!res.ok) {
        const errorCode = typeof data?.error === "string" ? data.error : "";
        const message =
          errorCode === "code_expired"
            ? "Код истёк. Запросите новый в Telegram."
            : errorCode === "code_not_found"
              ? "Код не найден. Проверьте и попробуйте снова."
              : "Не удалось привязать аккаунт. Попробуйте ещё раз.";
        setLinkStatus("error");
        setLinkMessage(message);
        return;
      }
      const nextId = setUserId(data.user_id ?? null);
      if (!nextId) {
        setLinkStatus("error");
        setLinkMessage("Не удалось сохранить профиль. Попробуйте ещё раз.");
        return;
      }
      clearUserProfile();
      setLinkStatus("success");
      setLinkMessage("Аккаунт привязан. Обновляем страницу...");
      window.location.reload();
    } catch {
      setLinkStatus("error");
      setLinkMessage("Не удалось привязать аккаунт. Попробуйте ещё раз.");
    } finally {
      setLinkAction(null);
    }
  };
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

      <motion.div variants={item} className="mt-5 rounded-[26px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl sm:mt-6 sm:p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{nextStep.title}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{nextStep.text}</p>
          </div>
          <Button asChild className="w-full shrink-0 sm:w-auto">
            <Link to="/integrations">{nextStep.cta}</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="mt-4 rounded-[26px] border border-border/60 bg-card/70 p-4 shadow-[0_14px_30px_hsla(var(--shadow)/0.18)] backdrop-blur-xl sm:mt-5 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Link2 size={16} /> Синхронизация аккаунта</div>
        <p className="mt-2 text-sm text-muted-foreground">Свяжите Telegram, сайт и приложение в один профиль. Код выдаётся в mini app и вводится на сайте или в приложении.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold text-foreground">Telegram Mini App</p>
            <p className="mt-1 text-xs text-muted-foreground">Нажмите, чтобы получить одноразовый код.</p>
            <Button type="button" onClick={requestLinkCode} disabled={!isTelegram || isStarting} className="mt-3 w-full sm:w-auto">
              {isStarting ? "Генерируем..." : "Получить код"}
            </Button>
            {!isTelegram ? (
              <p className="mt-2 text-xs text-amber-200/80">Откройте этот экран внутри Telegram.</p>
            ) : null}
            {linkCode ? (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] text-emerald-200">
                {linkCode}
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold text-foreground">Сайт или приложение</p>
            <p className="mt-1 text-xs text-muted-foreground">Введите код из Telegram и нажмите "Привязать".</p>
            <input
              className="input mt-3"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="КОД из Telegram"
              value={linkInput}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                setLinkInput(value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submitLinkCode();
                }
              }}
            />
            <Button type="button" onClick={submitLinkCode} disabled={!linkInput || isCompleting} className="mt-3 w-full sm:w-auto">
              {isCompleting ? "Проверяем..." : "Привязать"}
            </Button>
          </div>
        </div>
        {linkMessage ? (
          <p className={`mt-3 text-xs ${linkStatus === "error" ? "text-rose-400" : "text-emerald-400"}`}>{linkMessage}</p>
        ) : null}
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










