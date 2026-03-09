import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Bot, MessageSquare, RefreshCw, Send, Image, Link2, Loader2, Timer, MousePointerClick, X, ImageIcon, FileText, CheckCircle2, Circle, FlaskConical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TelegramChannel, PartnerLink, InlineButton, MessageTemplate } from "./types";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 22, delay: i * 0.08 },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, x: -12, scale: 0.97 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { type: "spring" as const, stiffness: 350, damping: 25 } },
  exit: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.15 } },
};

interface NotificationsTabProps {
  channels: TelegramChannel[];
  setChannels: React.Dispatch<React.SetStateAction<TelegramChannel[]>>;
  loadingChannels: boolean;
  botUsername: string | null;
  fetchChannels: () => void;
  fetchGallery: () => void;
  gallery: string[];
}

export default function NotificationsTab({ channels, setChannels, loadingChannels, botUsername, fetchChannels, fetchGallery, gallery }: NotificationsTabProps) {
  const [extrasTab, setExtrasTab] = useState<"buttons" | "partners">("buttons");
  const [message, setMessage] = useState("");
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]);
  const [partnerName, setPartnerName] = useState("");
  const [partnerUrl, setPartnerUrl] = useState("");
  const [partners, setPartners] = useState<PartnerLink[]>([]);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inlineButtons, setInlineButtons] = useState<InlineButton[]>([]);
  const [btnText, setBtnText] = useState("");
  const [btnUrl, setBtnUrl] = useState("");
  const [autoDelete, setAutoDelete] = useState(false);
  const [deleteAfter, setDeleteAfter] = useState("2");
  const [showGallery, setShowGallery] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    { id: "1", name: "Стрим начался", text: "🔴 Стрим начался! Заходите смотреть 👀" },
    { id: "2", name: "Играем в...", text: "🎮 Сегодня играем в {game}! Не пропустите!" },
    { id: "3", name: "Конец стрима", text: "Спасибо всем, кто был! 💜 Увидимся завтра." },
  ]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set());

  // Auto-select all channels when they load/change
  useEffect(() => {
    setSelectedChannelIds(new Set(channels.map((c) => c.id)));
  }, [channels.map((c) => c.id).join(",")]);

  // Realtime subscription — auto-refresh when channels are added/removed
  useEffect(() => {
    const channel = supabase
      .channel("telegram_channels_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "telegram_channels" },
        () => {
          fetchChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChannels]);

  const toggleChannel = (id: string) => {
    setSelectedChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllChannels = () => {
    if (selectedChannelIds.size === channels.length) {
      setSelectedChannelIds(new Set());
    } else {
      setSelectedChannelIds(new Set(channels.map((c) => c.id)));
    }
  };

  const selectedChannels = channels.filter((c) => selectedChannelIds.has(c.id));

  const handleRemoveChannel = async (id: string) => {
    await supabase.from("telegram_channels").delete().eq("id", id);
    setChannels((prev) => prev.filter((c) => c.id !== id));
    toast.success("Канал удалён");
  };

  const openAddChannel = () => {
    if (!botUsername) { toast.error("Не удалось определить username бота"); return; }
    window.open(`https://t.me/${botUsername}?startchannel=true&admin=post_messages`, "_blank");
  };
  const openAddGroup = () => {
    if (!botUsername) { toast.error("Не удалось определить username бота"); return; }
    window.open(`https://t.me/${botUsername}?startgroup=true`, "_blank");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => { setImageFiles((prev) => [...prev, { file, preview: reader.result as string }]); };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeImage = (index: number) => setImageFiles((prev) => prev.filter((_, i) => i !== index));
  const selectFromGallery = (url: string) => {
    setImageFiles((prev) => [...prev, { file: new File([], "gallery"), preview: url }]);
    setShowGallery(false); toast.success("Фото выбрано из галереи");
  };

  const handleAddPartner = () => {
    if (!partnerName.trim() || !partnerUrl.trim()) { toast.error("Заполни название и ссылку"); return; }
    try { new URL(partnerUrl); } catch { toast.error("Введи корректную ссылку"); return; }
    setPartners((prev) => [...prev, { id: crypto.randomUUID(), name: partnerName.trim(), url: partnerUrl.trim() }]);
    setPartnerName(""); setPartnerUrl(""); toast.success("Партнёр добавлен");
  };
  const handleRemovePartner = (id: string) => setPartners((prev) => prev.filter((p) => p.id !== id));

  const handleAddButton = () => {
    if (!btnText.trim() || !btnUrl.trim()) { toast.error("Заполни текст и ссылку кнопки"); return; }
    try { new URL(btnUrl); } catch { toast.error("Введи корректную ссылку"); return; }
    setInlineButtons((prev) => [...prev, { id: crypto.randomUUID(), text: btnText.trim(), url: btnUrl.trim() }]);
    setBtnText(""); setBtnUrl("");
  };
  const handleRemoveButton = (id: string) => setInlineButtons((prev) => prev.filter((b) => b.id !== id));

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || !message.trim()) { toast.error("Введи название шаблона и текст"); return; }
    setTemplates((prev) => [...prev, { id: crypto.randomUUID(), name: newTemplateName.trim(), text: message }]);
    setNewTemplateName(""); toast.success("Шаблон сохранён");
  };
  const handleLoadTemplate = (t: MessageTemplate) => { setMessage(t.text); setShowTemplates(false); toast.success(`Шаблон «${t.name}» загружен`); };
  const handleDeleteTemplate = (id: string) => setTemplates((prev) => prev.filter((t) => t.id !== id));

  const handleSend = async () => {
    if (!message.trim()) { toast.error("Введи текст сообщения"); return; }
    if (selectedChannels.length === 0) { toast.error("Выбери хотя бы один канал"); return; }
    setSending(true);
    try {
      let imageUrl: string | null = null;
      if (imageFiles.length > 0) {
        const firstFile = imageFiles[0];
        if (firstFile.file.size > 0) {
          const fileName = `${Date.now()}-${firstFile.file.name}`;
          const { error: uploadError } = await supabase.storage.from("telegram-images").upload(fileName, firstFile.file);
          if (uploadError) throw uploadError;
          imageUrl = supabase.storage.from("telegram-images").getPublicUrl(fileName).data.publicUrl;
        } else { imageUrl = firstFile.preview; }
      }

      const partnersText = partners.length > 0
        ? "\n\n🤝 Партнёры:\n" + partners.map((p) => `• [${p.name}](${p.url})`).join("\n")
        : "";
      const fullMessage = message + partnersText;

      const replyMarkup = inlineButtons.length > 0
        ? { inline_keyboard: inlineButtons.map((b) => [{ text: b.text, url: b.url }]) }
        : undefined;

      for (const channel of selectedChannels) {
        const endpoint = imageUrl ? "sendPhoto" : "sendMessage";
        const body: Record<string, unknown> = {
          chat_id: channel.chat_id,
          parse_mode: "Markdown",
          ...(replyMarkup && { reply_markup: replyMarkup }),
        };
        if (imageUrl) {
          body.photo = imageUrl;
          body.caption = fullMessage;
        } else {
          body.text = fullMessage;
        }

        const res = await fetch(`https://api.telegram.org/bot${channel.bot_token}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await res.json();

        if (autoDelete && result.ok) {
          const messageId = result.result?.message_id;
          if (messageId) {
            const delayMs = parseInt(deleteAfter) * 60 * 60 * 1000;
            setTimeout(async () => {
              await fetch(`https://api.telegram.org/bot${channel.bot_token}/deleteMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: channel.chat_id, message_id: messageId }),
              });
            }, delayMs);
          }
        }
      }
      toast.success("Оповещение отправлено!");
      setMessage(""); setImageFiles([]); setPartners([]); setInlineButtons([]);
      fetchGallery();
    } catch { toast.error("Ошибка отправки"); }
    setSending(false);
  };

  const handleTestSend = async () => {
    if (selectedChannels.length === 0) { toast.error("Выбери хотя бы один канал"); return; }
    setSendingTest(true);
    try {
      const testText = "🧪 *Тестовое оповещение*\n\nЕсли ты видишь это сообщение — бот работает корректно! ✅";
      for (const channel of selectedChannels) {
        await fetch(`https://api.telegram.org/bot${channel.bot_token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: channel.chat_id, text: testText, parse_mode: "Markdown" }),
        });
      }
      toast.success(`Тест отправлен в ${selectedChannels.length} канал(ов)`);
    } catch {
      toast.error("Ошибка отправки теста");
    }
    setSendingTest(false);
  };

  return (
    <div className="space-y-3">
      {/* Telegram Channels */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
        <Card className="bg-secondary/30 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Bot size={18} className="text-primary" /> Куда отправляем</CardTitle>
            <CardDescription>Нажми кнопку → выбери канал в Telegram → бот автоматически определит и привяжет его</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={openAddChannel} variant="outline" size="sm" className="flex-1 gap-1.5 h-9">
                <Bot size={14} /> В канал
              </Button>
              <Button onClick={openAddGroup} variant="outline" size="sm" className="flex-1 gap-1.5 h-9">
                <MessageSquare size={14} /> В группу
              </Button>
              <Button variant="ghost" size="sm" onClick={fetchChannels} className="h-9 w-9 p-0 shrink-0">
                <RefreshCw size={14} />
              </Button>
            </div>
            {channels.length > 1 && (
              <div className="flex justify-end">
                <button onClick={toggleAllChannels} className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                  {selectedChannelIds.size === channels.length ? "Снять все" : "Выбрать все"}
                </button>
              </div>
            )}
            {loadingChannels ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="animate-spin" size={16} /> Загрузка...
              </motion.div>
            ) : channels.length > 0 ? (
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {channels.map((ch) => {
                    const isSelected = selectedChannelIds.has(ch.id);
                    return (
                      <motion.div
                        key={ch.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-all duration-200 cursor-pointer group ${
                          isSelected
                            ? "bg-primary/5 border-primary/30 hover:border-primary/50"
                            : "bg-background/50 border-border/30 hover:border-border/60 opacity-60"
                        }`}
                        onClick={() => toggleChannel(ch.id)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <motion.div
                            animate={{ scale: isSelected ? 1 : 0.9 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          >
                            {isSelected
                              ? <CheckCircle2 size={16} className="text-primary shrink-0" />
                              : <Circle size={16} className="text-muted-foreground shrink-0" />
                            }
                          </motion.div>
                          <div className="min-w-0">
                            <span className="font-mono text-sm truncate block">{ch.channel_name || ch.chat_id}</span>
                            {ch.is_verified && (
                              <span className="text-[10px] text-emerald-500 font-mono">✓ Верифицирован</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleRemoveChannel(ch.id); }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {channels.length > 0 && (
                  <p className="text-[11px] text-muted-foreground font-mono text-center pt-1">
                    Выбрано {selectedChannelIds.size} из {channels.length}
                  </p>
                )}
              </div>
            ) : (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-sm text-muted-foreground text-center py-2">
                Нет привязанных каналов
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Composer + Live Preview */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Editor */}
          <div className="space-y-4">
            {/* Message + Templates */}
            <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
              <Card className="bg-secondary/30 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2"><Send size={16} className="text-primary" /> Текст</span>
                    <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                      <FileText size={12} /> Шаблоны
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Введи текст оповещения..." className="font-mono text-sm min-h-[100px]" />
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="overflow-hidden"
                      >
                        <div className="border border-border/30 rounded-lg p-3 space-y-2 bg-background/30">
                          <p className="text-xs text-muted-foreground font-mono font-semibold">📋 Шаблоны сообщений</p>
                          {templates.map((t, i) => (
                            <motion.div
                              key={t.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex items-center justify-between bg-secondary/30 rounded-lg px-2.5 py-1.5 border border-border/20 hover:bg-secondary/50 transition-colors duration-150"
                            >
                              <button onClick={() => handleLoadTemplate(t)} className="text-left min-w-0 flex-1">
                                <p className="font-mono text-xs font-semibold truncate">{t.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{t.text}</p>
                              </button>
                              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTemplate(t.id)}><X size={10} /></Button>
                            </motion.div>
                          ))}
                          <div className="flex gap-2 pt-1">
                            <Input value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Название шаблона..." className="font-mono text-xs h-7 flex-1" />
                            <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={handleSaveTemplate} disabled={!message.trim()}>Сохранить</Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Image + Gallery */}
            <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
              <Card className="bg-secondary/30 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2"><Image size={16} className="text-primary" /> Фото</span>
                    {gallery.length > 0 && (
                      <button onClick={() => setShowGallery(!showGallery)} className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                        <ImageIcon size={12} /> Галерея
                      </button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                  {imageFiles.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      <AnimatePresence mode="popLayout">
                        {imageFiles.map((img, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="relative rounded-lg overflow-hidden border border-border/50 aspect-square group/img"
                          >
                            <img src={img.preview} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border border-dashed border-border/50 flex items-center justify-center hover:bg-secondary/30 transition-colors"
                      >
                        <Plus size={20} className="text-muted-foreground" />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" size="sm" className="w-full h-9 border-dashed gap-1.5" onClick={() => fileInputRef.current?.click()}>
                        <Image size={14} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">Выбрать фото</span>
                      </Button>
                    </motion.div>
                  )}
                  <AnimatePresence>
                    {showGallery && gallery.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-muted-foreground mb-2 font-mono">Недавние фото:</p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {gallery.map((url, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 }}
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => selectFromGallery(url)}
                              className="aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors"
                            >
                              <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Кнопки & Партнёры */}
            <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
              <Card className="bg-secondary/30 border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
                    <button
                      onClick={() => setExtrasTab("buttons")}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-mono py-1.5 rounded-md transition-all duration-200 ${
                        extrasTab === "buttons"
                          ? "bg-primary/15 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <MousePointerClick size={13} /> Кнопки
                    </button>
                    <button
                      onClick={() => setExtrasTab("partners")}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-mono py-1.5 rounded-md transition-all duration-200 ${
                        extrasTab === "partners"
                          ? "bg-primary/15 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Link2 size={13} /> Партнёры
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-1">
                  <AnimatePresence mode="wait">
                    {extrasTab === "buttons" ? (
                      <motion.div key="btn" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={btnText} onChange={(e) => setBtnText(e.target.value)} placeholder="Текст" className="font-mono text-sm h-8" />
                          <Input value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} placeholder="https://..." className="font-mono text-sm h-8" />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddButton} className="w-full h-8 text-xs gap-1"><Plus size={12} /> Кнопка</Button>
                        <AnimatePresence mode="popLayout">
                          {inlineButtons.map((b) => (
                            <motion.div key={b.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout className="flex items-center justify-between bg-background/50 rounded-lg px-2 py-1 border border-border/30">
                              <span className="font-mono text-xs">[{b.text}]</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveButton(b.id)}><X size={10} /></Button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <motion.div key="prt" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Название" className="font-mono text-sm h-8" />
                          <Input value={partnerUrl} onChange={(e) => setPartnerUrl(e.target.value)} placeholder="https://..." className="font-mono text-sm h-8" />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddPartner} className="w-full h-8 text-xs gap-1"><Plus size={12} /> Партнёр</Button>
                        <AnimatePresence mode="popLayout">
                          {partners.map((p) => (
                            <motion.div key={p.id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout className="flex items-center justify-between bg-background/50 rounded-lg px-2 py-1 border border-border/30">
                              <div className="min-w-0">
                                <span className="font-mono text-xs font-medium">{p.name}</span>
                                <a href={p.url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-primary truncate">{p.url}</a>
                              </div>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => handleRemovePartner(p.id)}><Trash2 size={10} /></Button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Auto-delete */}
            <motion.div custom={6} variants={sectionVariants} initial="hidden" animate="visible">
              <Card className="bg-secondary/30 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><Timer size={16} className="text-primary" /> Авто-удаление</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-delete" className="font-mono text-sm">Удалять пост автоматически</Label>
                    <Switch id="auto-delete" checked={autoDelete} onCheckedChange={setAutoDelete} />
                  </div>
                  <AnimatePresence>
                    {autoDelete && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <Label className="font-mono text-xs text-muted-foreground mb-1 block">Удалить через</Label>
                        <Select value={deleteAfter} onValueChange={setDeleteAfter}>
                          <SelectTrigger className="font-mono text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 час</SelectItem>
                            <SelectItem value="2">2 часа</SelectItem>
                            <SelectItem value="4">4 часа</SelectItem>
                            <SelectItem value="8">8 часов</SelectItem>
                            <SelectItem value="24">24 часа</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right: Telegram-style Live Preview */}
          <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="lg:sticky lg:top-4 self-start">
            <Card className="bg-secondary/30 border-border/50 overflow-hidden">
              <div className="bg-primary/10 px-4 py-2.5 flex items-center gap-2 border-b border-border/30">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><Bot size={16} className="text-primary" /></div>
                <div>
                  <p className="text-sm font-semibold">StreamsInfo Bot</p>
                  <p className="text-xs text-muted-foreground">канал</p>
                </div>
              </div>

              <div className="p-4 min-h-[300px] bg-[hsl(var(--background))]/50 flex flex-col justify-end">
                <AnimatePresence mode="wait">
                  {(message.trim() || imageFiles.length > 0) ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 20, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="bg-primary/10 rounded-2xl rounded-bl-md p-3 max-w-full"
                    >
                      {imageFiles.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className={`mb-2 ${imageFiles.length > 1 ? 'grid grid-cols-2 gap-1' : ''} rounded-xl overflow-hidden`}
                        >
                          {imageFiles.map((img, i) => (
                            <img key={i} src={img.preview} alt={`Фото ${i + 1}`} className="rounded-lg w-full object-cover max-h-36" />
                          ))}
                        </motion.div>
                      )}
                      {message.trim() && <p className="text-sm whitespace-pre-wrap break-words">{message}</p>}
                      {partners.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-2 pt-2 border-t border-border/20">
                          <p className="text-xs text-muted-foreground mb-1">🤝 Партнёры:</p>
                          {partners.map((p) => (
                            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline">• {p.name}</a>
                          ))}
                        </motion.div>
                      )}
                      {inlineButtons.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {inlineButtons.map((b) => (
                            <motion.div
                              key={b.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-primary/20 text-center py-1.5 rounded-lg text-xs font-mono text-primary cursor-pointer hover:bg-primary/30 transition-colors"
                            >
                              {b.text}
                            </motion.div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-1 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8"
                    >
                      <MessageSquare size={32} className="mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">Начни писать — сообщение появится здесь</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {autoDelete && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-1.5 border-t border-border/30 bg-secondary/20 overflow-hidden"
                  >
                    <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1"><Timer size={10} /> Пост удалится через {deleteAfter}ч</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="px-4 py-3 border-t border-border/30 flex items-center gap-2">
                <p className="text-[11px] text-muted-foreground flex-1 truncate font-mono">
                  {selectedChannels.length > 0
                    ? `→ ${selectedChannels.map(c => c.channel_name || c.chat_id).join(", ")}`
                    : channels.length > 0 ? "Выбери каналы" : "Нет каналов"
                  }
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 shrink-0 gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
                  disabled={sendingTest || selectedChannels.length === 0}
                  onClick={handleTestSend}
                >
                  {sendingTest ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
                  Тест
                </Button>
                <Button size="sm" className="h-8 shrink-0 gap-1.5 text-xs font-mono" disabled={sending || !message.trim() || selectedChannels.length === 0} onClick={handleSend}>
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Отправить
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
