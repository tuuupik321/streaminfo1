import { useState } from "react";
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

type Ripple = { id: number; x: number; y: number };

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

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { language } = useI18n();
  const { theme, setTheme } = useTheme();
  const { glowIntensity, setGlowIntensity, cardStyle, setCardStyle, setLanguage } = useSettingsStore();
  const [ripples, setRipples] = useState<Ripple[]>([]);

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-3 pt-16 sm:px-4 sm:pt-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-4xl overflow-hidden rounded-[22px] border border-white/10 bg-[#0c0c12] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            style={{ boxShadow: "0 0 70px rgba(145,70,255,0.35)" }}
            variants={panelVariants}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-2">
                  <Cog size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Settings</p>
                  <p className="text-[11px] text-white/50">StreamInfo control center</p>
                </div>
              </div>
              <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white h-8 px-2 text-xs">
                Close
              </Button>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <Tabs defaultValue="admin" className="w-full">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                    <Languages size={12} className="text-white/70" />
                    <span className={language === "ru" ? "text-white" : "text-white/40"}>RU</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={1}
                      value={language === "ru" ? 0 : 1}
                      onChange={(e) => setLanguage(e.target.value === "0" ? "ru" : "en")}
                      className="h-1 w-16 accent-white"
                    />
                    <span className={language === "en" ? "text-white" : "text-white/40"}>EN</span>
                  </div>
                  <p className="text-[10px] text-white/40">UI language</p>
                </div>
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 bg-white/5">
                  <TabsTrigger
                    value="admin"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <ShieldCheck size={12} />
                    </motion.span>
                    Admin
                  </TabsTrigger>
                  <TabsTrigger
                    value="creators"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <Users size={12} />
                    </motion.span>
                    Creators
                  </TabsTrigger>
                  <TabsTrigger
                    value="mods"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <Users size={12} />
                    </motion.span>
                    Moderators
                  </TabsTrigger>
                  <TabsTrigger
                    value="support"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <MessageSquare size={12} />
                    </motion.span>
                    Support
                  </TabsTrigger>
                  <TabsTrigger
                    value="appearance"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <Palette size={12} />
                    </motion.span>
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger
                    value="language"
                    onClick={(e) => handleRipple(e)}
                    className="data-[state=active]:shadow-[0_0_18px_rgba(145,70,255,0.5)]"
                  >
                    <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut" }} className="mr-1 inline-flex">
                      <Languages size={12} />
                    </motion.span>
                    Language
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="admin" className="mt-4 space-y-3 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <ShieldCheck size={12} /> Admin Center
                  </motion.div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Управление каналами, пользователями, ролями</li>
                    <li>Добавление и удаление модераторов</li>
                    <li>Глобальные функции и статистика</li>
                  </ul>
                </TabsContent>

                <TabsContent value="creators" className="mt-4 space-y-3 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <Users size={12} /> Creators
                  </motion.div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Доступ к аналитике своих каналов</li>
                    <li>Управление контентом и интеграциями</li>
                    <li>Запуск кампаний и анонсов</li>
                  </ul>
                </TabsContent>

                <TabsContent value="mods" className="mt-4 space-y-3 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <Users size={12} /> Moderators
                  </motion.div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Контроль комментариев, донатов и сообщений</li>
                    <li>Фильтры и предупреждения</li>
                    <li>Просмотр активности пользователей</li>
                  </ul>
                </TabsContent>

                <TabsContent value="support" className="mt-4 space-y-3 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <MessageSquare size={12} /> Support
                  </motion.div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>FAQ / документация</li>
                    <li>Контакты / чат с техподдержкой</li>
                  </ul>
                </TabsContent>

                <TabsContent value="appearance" className="mt-4 space-y-4 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <Palette size={12} /> Appearance
                  </motion.div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-white/40">Theme</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant={theme === "dark" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setTheme("dark"); }} className="relative overflow-hidden">Dark</Button>
                        <Button size="sm" variant={theme === "light" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setTheme("light"); }} className="relative overflow-hidden">Light</Button>
                        <Button size="sm" variant={theme === "system" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setTheme("system"); }} className="relative overflow-hidden">System</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-white/40">Card Style</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant={cardStyle === "minimal" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setCardStyle("minimal"); }} className="relative overflow-hidden">Minimal</Button>
                        <Button size="sm" variant={cardStyle === "colorful" ? "default" : "outline"} onClick={(e) => { handleRipple(e); setCardStyle("colorful"); }} className="relative overflow-hidden">Colorful</Button>
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

                <TabsContent value="language" className="mt-4 space-y-3 text-xs text-white/70">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white">
                    <Languages size={12} /> Language
                  </motion.div>
                  <p className="text-xs text-white/40">Global UI language switch is available above.</p>
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
