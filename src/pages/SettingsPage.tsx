import { motion } from "framer-motion";
import { Bell, Globe, Loader2, Palette, Clock, Bot, CheckCircle, XCircle, HelpCircle, Sun, Moon, Laptop } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { UiLanguage } from "@/lib/language";

// ... (rest of the types and constants remain the same)
type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          language_code?: string;
        };
      };
    };
  };
};
interface TelegramChannel {
  id: string;
  chat_id: string;
  channel_name: string | null;
  is_verified: boolean;
}
const TIMEZONES = [
  { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
  { value: "Europe/Kaliningrad", label: "Kaliningrad (UTC+2)" },
  { value: "Asia/Yekaterinburg", label: "Yekaterinburg (UTC+5)" },
  { value: "Asia/Almaty", label: "Almaty (UTC+5)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "America/New_York", label: "New York (UTC-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
];
const ACCENT_COLORS = [
  { value: "purple", label: "Purple", hsl: "264 67% 63%" },
  { value: "blue", label: "Blue", hsl: "217 91% 60%" },
  { value: "green", label: "Green", hsl: "152 69% 47%" },
  { value: "red", label: "Red", hsl: "0 72% 51%" },
  { value: "orange", label: "Orange", hsl: "38 92% 50%" },
  { value: "pink", label: "Pink", hsl: "330 80% 60%" },
];

function hexToHsl(hex: string): [number, number, number] {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return [h, Math.round(s * 100), Math.round(l * 100)];
}

function InfoHint({ text, label }: { text: string; label: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label={label}>
          <HelpCircle size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[240px] text-xs">{text}</PopoverContent>
    </Popover>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();
  const { language, setLanguage, theme, setTheme } = useSettingsStore();

  const [notifyLive, setNotifyLive] = useState(true);
  const [notifyPeak, setNotifyPeak] = useState(false);
  const [notifyDonation, setNotifyDonation] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState("channel");
  const [compact, setCompact] = useState(false);
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [accentColor, setAccentColor] = useState("purple");
  const [accentHex, setAccentHex] = useState("#8b5cf6");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    void fetchSettings();
    void fetchBotStatus();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    const color = ACCENT_COLORS.find((c) => c.value === accentColor);
    if (!color) {
      if (accentColor === "custom") applyHexAccent(accentHex);
      return;
    }
    document.documentElement.style.setProperty("--primary", color.hsl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accentColor]);

  const applyHexAccent = (hex: string) => {
    const normalized = hex.trim().startsWith("#") ? hex.trim() : `#${hex.trim()}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
      toast.error("HEX color must be 6 characters, e.g. #22c55e");
      return;
    }
    const [h, s, l] = hexToHsl(normalized);
    document.documentElement.style.setProperty("--primary", `${h} ${s}% ${l}%`);
    setAccentHex(normalized);
    setAccentColor("custom");
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("key, value");
    if (data) {
      for (const row of data) {
        if (row.key === "notify_live") setNotifyLive(row.value === "true");
        if (row.key === "notify_peak") setNotifyPeak(row.value === "true");
        if (row.key === "notify_donation") setNotifyDonation(row.value === "true");
        if (row.key === "notify_target") setNotifyTarget(row.value);
        if (row.key === "compact") setCompact(row.value === "true");
        if (row.key === "timezone") setTimezone(row.value);
        if (row.key === "accent_color") setAccentColor(row.value);
        if (row.key === "accent_hex") setAccentHex(row.value);
      }
    }
    setLoading(false);
  };

  const fetchBotStatus = async () => {
    const { data } = await supabase.from("telegram_channels").select("id, chat_id, channel_name, is_verified");
    if (data) setChannels(data);
    setLoadingStatus(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const settings = [
      { key: "notify_live", value: String(notifyLive) },
      { key: "notify_peak", value: String(notifyPeak) },
      { key: "notify_donation", value: String(notifyDonation) },
      { key: "notify_target", value: notifyTarget },
      { key: "compact", value: String(compact) },
      { key: "timezone", value: timezone },
      { key: "accent_color", value: accentColor },
      { key: "accent_hex", value: accentHex },
    ];
    const { error } = await supabase.from("settings").upsert(settings, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(t("settings.saveErr"));
    else toast.success(t("settings.saveOk"));
  };

  const SkeletonCard = () => (
    <Card className="card-glass">
      <CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="mt-1 h-3 w-56" /></CardHeader>
      <CardContent className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-3 py-4 pb-24 sm:p-4 md:p-8">
        <Skeleton className="mb-8 h-8 w-48" />
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 pb-24 sm:p-4 md:p-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 text-xl font-black font-heading sm:mb-8 sm:text-2xl md:text-3xl">
        {t("settings.title")}
      </motion.h1>
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Bell size={18} className="text-primary" /> {t("settings.notifications")}</CardTitle>
              <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5"><Label htmlFor="notify-live" className="font-mono text-sm">{t("settings.streamLive")}</Label><InfoHint text={t("settings.streamLiveHint")} label={t("settings.help")} /></div>
                <Switch id="notify-live" checked={notifyLive} onCheckedChange={setNotifyLive} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5"><Label htmlFor="notify-peak" className="font-mono text-sm">{t("settings.peak")}</Label><InfoHint text={t("settings.peakHint")} label={t("settings.help")} /></div>
                <Switch id="notify-peak" checked={notifyPeak} onCheckedChange={setNotifyPeak} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5"><Label htmlFor="notify-donation" className="font-mono text-sm">{t("settings.bigDonations")}</Label><InfoHint text={t("settings.bigDonationsHint")} label={t("settings.help")} /></div>
                <Switch id="notify-donation" checked={notifyDonation} onCheckedChange={setNotifyDonation} />
              </div>
              <div className="space-y-1.5 border-t border-border/30 pt-2">
                <Label className="font-mono text-sm">{t("settings.target")}</Label>
                <Select value={notifyTarget} onValueChange={setNotifyTarget}>
                  <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dm" className="font-mono text-sm">{t("settings.targetDm")}</SelectItem>
                    <SelectItem value="channel" className="font-mono text-sm">{t("settings.targetChannel")}</SelectItem>
                    <SelectItem value="both" className="font-mono text-sm">{t("settings.targetBoth")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Clock size={18} className="text-primary" /> {t("settings.timezone")}</CardTitle>
              <CardDescription>{t("settings.timezoneDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (<SelectItem key={tz.value} value={tz.value} className="font-mono text-sm">{tz.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Bot size={18} className="text-primary" /> {t("settings.connection")}</CardTitle>
              <CardDescription>{t("settings.connectionDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStatus ? (
                <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
              ) : channels.length > 0 ? (
                <div className="space-y-2">
                  {channels.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/50 px-3 py-2">
                      {ch.is_verified ? <CheckCircle size={16} className="shrink-0 text-[hsl(var(--success))]" /> : <XCircle size={16} className="shrink-0 text-destructive" />}
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-sm">{ch.channel_name || ch.chat_id}</span>
                        <span className="text-xs text-muted-foreground">{ch.is_verified ? t("settings.active") : t("settings.notActive")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <XCircle size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t("settings.noChannels")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Palette size={18} className="text-primary" /> {t("settings.appearance")}</CardTitle>
              <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5"><Label htmlFor="compact" className="font-mono text-sm">{t("settings.compact")}</Label><InfoHint text={t("settings.compactHint")} label={t("settings.help")} /></div>
                <Switch id="compact" checked={compact} onCheckedChange={setCompact} />
              </div>
              <div className="space-y-2 border-t border-border/30 pt-2">
                <Label className="font-mono text-sm">{t("settings.accent")}</Label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map((c) => (
                    <button key={c.value} onClick={() => setAccentColor(c.value)} className={cn("h-9 w-9 rounded-full border-2 transition-all", accentColor === c.value ? "scale-110 border-foreground" : "border-transparent")} style={{ backgroundColor: `hsl(${c.hsl})` }} title={c.label} type="button" />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={accentHex} onChange={(e) => setAccentHex(e.target.value)} placeholder="#22c55e" className="font-mono text-sm" />
                  <Button type="button" variant="outline" onClick={() => applyHexAccent(accentHex)}>Apply HEX</Button>
                </div>
              </div>
              <div className="space-y-2 border-t border-border/30 pt-2">
                <Label className="font-mono text-sm">{t("settings.theme")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="gap-2"><Sun size={14}/> {t("settings.themeLight")}</Button>
                  <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="gap-2"><Moon size={14}/> {t("settings.themeDark")}</Button>
                  <Button variant={theme === 'system' ? 'default' : 'outline'} onClick={() => setTheme('system')} className="gap-2"><Laptop size={14}/> {t("settings.themeSystem")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Globe size={18} className="text-primary" /> {t("settings.language")}</CardTitle>
              <CardDescription>{t("settings.languageDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select value={language} onValueChange={(value) => setLanguage(value as UiLanguage)}>
                <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto" className="font-mono text-sm">{t("settings.languageAuto")}</SelectItem>
                  <SelectItem value="ru" className="font-mono text-sm">{t("settings.languageRu")}</SelectItem>
                  <SelectItem value="en" className="font-mono text-sm">{t("settings.languageEn")}</SelectItem>
                  <SelectItem value="uk" className="font-mono text-sm">{t("settings.languageUk")}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 p-4 backdrop-blur-lg">
        <div className="mx-auto max-w-3xl">
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? (<><Loader2 className="mr-2 animate-spin" size={16} /> {t("settings.saving")}</>) : (t("settings.save"))}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
