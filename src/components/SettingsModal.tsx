import { motion, AnimatePresence } from "framer-motion";
import { Cog, ShieldCheck, Users, MessageSquare, Palette, Languages } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTheme } from "@/components/ThemeProvider";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { opacity: 0, y: -16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
};

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { t, language } = useI18n();
  const { theme, setTheme } = useTheme();
  const { glowIntensity, setGlowIntensity, cardStyle, setCardStyle, setLanguage } = useSettingsStore();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-4 pt-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-4xl overflow-hidden rounded-[24px] border border-white/10 bg-[#0c0c12] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            style={{ boxShadow: "0 0 80px rgba(145,70,255,0.35)" }}
            variants={panelVariants}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-2">
                  <Cog size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Settings</p>
                  <p className="text-xs text-white/50">StreamInfo control center</p>
                </div>
              </div>
              <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white">
                Close
              </Button>
            </div>

            <div className="px-6 py-5">
              <Tabs defaultValue="admin" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 bg-white/5">
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                  <TabsTrigger value="creators">Creators</TabsTrigger>
                  <TabsTrigger value="mods">Moderators</TabsTrigger>
                  <TabsTrigger value="support">Support</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="language">Language</TabsTrigger>
                </TabsList>

                <TabsContent value="admin" className="mt-5 space-y-3 text-sm text-white/70">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheck size={14} /> Admin Center
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Управление каналами, пользователями, ролями</li>
                    <li>Добавление и удаление модераторов</li>
                    <li>Глобальные функции и статистика</li>
                  </ul>
                </TabsContent>

                <TabsContent value="creators" className="mt-5 space-y-3 text-sm text-white/70">
                  <div className="flex items-center gap-2 text-white">
                    <Users size={14} /> Creators
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Доступ к аналитике своих каналов</li>
                    <li>Управление контентом и интеграциями</li>
                    <li>Запуск кампаний и анонсов</li>
                  </ul>
                </TabsContent>

                <TabsContent value="mods" className="mt-5 space-y-3 text-sm text-white/70">
                  <div className="flex items-center gap-2 text-white">
                    <Users size={14} /> Moderators
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Контроль комментариев, донатов и сообщений</li>
                    <li>Фильтры и предупреждения</li>
                    <li>Просмотр активности пользователей</li>
                  </ul>
                </TabsContent>

                <TabsContent value="support" className="mt-5 space-y-3 text-sm text-white/70">
                  <div className="flex items-center gap-2 text-white">
                    <MessageSquare size={14} /> Support
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>FAQ / документация</li>
                    <li>Контакты / чат с техподдержкой</li>
                  </ul>
                </TabsContent>

                <TabsContent value="appearance" className="mt-5 space-y-4 text-sm text-white/70">
                  <div className="flex items-center gap-2 text-white">
                    <Palette size={14} /> Appearance
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-white/40">Theme</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>Dark</Button>
                        <Button size="sm" variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>Light</Button>
                        <Button size="sm" variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")}>System</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-white/40">Card Style</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant={cardStyle === "minimal" ? "default" : "outline"} onClick={() => setCardStyle("minimal")}>Minimal</Button>
                        <Button size="sm" variant={cardStyle === "colorful" ? "default" : "outline"} onClick={() => setCardStyle("colorful")}>Colorful</Button>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-white/40">Liquid Glow</p>
                      <Slider
                        value={[glowIntensity * 100]}
                        onValueChange={(value) => setGlowIntensity(value[0] / 100)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="language" className="mt-5 space-y-3 text-sm text-white/70">
                  <div className="flex items-center gap-2 text-white">
                    <Languages size={14} /> Language
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={language === "ru" ? "text-white" : "text-white/40"}>RU</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={1}
                      value={language === "ru" ? 0 : 1}
                      onChange={(e) => setLanguage(e.target.value === "0" ? "ru" : "en")}
                      className="h-1 w-28 accent-white"
                    />
                    <span className={language === "en" ? "text-white" : "text-white/40"}>EN</span>
                  </div>
                  <p className="text-xs text-white/40">Global UI language switch.</p>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
