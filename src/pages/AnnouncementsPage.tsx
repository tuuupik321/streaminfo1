import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Bot, Trash2, PlusCircle, Send, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Confetti from "react-confetti";

type AnnouncementButton = {
  id: number;
  text: string;
  url: string;
};

function DiscordPreview({ title, game, description, buttons }: { title: string; game: string; description: string; buttons: AnnouncementButton[] }) {
  return (
    <div className="rounded-lg bg-[#313338] p-4 text-white">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-green-400" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white">Stream-Bot</span>
            <span className="text-xs text-gray-400">Сегодня в {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="mt-1 rounded-l-lg border-l-4 border-primary bg-[#2B2D31] p-4">
            <p className="text-sm text-gray-300">🎮 Игра: <span className="font-semibold text-white">{game || "Не указана"}</span></p>
            <h2 className="mt-1 text-lg font-bold text-white">{title || "Название стрима"}</h2>
            <p className="mt-1 text-sm text-gray-300">{description || "Скоро начнем! Присоединяйтесь."}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {buttons.map(btn => (
              <a key={btn.id} href={btn.url} target="_blank" rel="noreferrer" className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]">
                {btn.text}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TelegramPreview({ title, game, description, buttons }: { title: string; game: string; description: string; buttons: AnnouncementButton[] }) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-green-400" />
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-gray-900 dark:text-white">Stream-Bot</span>
          <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">
            <p>🎮 <span className="font-bold">Игра:</span> {game || "Не указана"}</p>
            <p className="mt-1"><span className="font-bold">{title || "Название стрима"}</span></p>
            <p>{description || "Скоро начнем! Присоединяйтесь."}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {buttons.map(btn => (
          <a key={btn.id} href={btn.url} target="_blank" rel="noreferrer" className="w-full rounded-lg bg-gray-200 dark:bg-gray-700 py-2 text-center text-sm font-medium text-gray-900 dark:text-white">
            {btn.text}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");
  const [description, setDescription] = useState("");
  const [buttons, setButtons] = useState<AnnouncementButton[]>([]);
  const [sending, setSending] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const addButtonClicked = () => {
    setButtons([...buttons, { id: Date.now(), text: "Новая кнопка", url: "" }]);
  };

  const removeButton = (id: number) => {
    setButtons(buttons.filter(b => b.id !== id));
  };

  const updateButton = (id: number, field: 'text' | 'url', value: string) => {
    setButtons(buttons.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleSend = () => {
    if (!title) {
      toast.error("Название стрима не может быть пустым!");
      return;
    }
    setSending(true);
    // Simulate API call
    setTimeout(() => {
      setSending(false);
      toast.success("Анонс успешно отправлен!");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:p-4 md:p-8">
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-gradient-primary flex items-center gap-3">
          <Megaphone size={32} />
          {t("announcements.title", "Центр Анонсов")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("announcements.description", "Создавайте и отправляйте анонсы ваших стримов в Telegram и Discord.")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Editor */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="title">{t("announcements.streamTitle", "Название стрима")}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, 'Идем за топ-1 в Warzone!'" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="game">{t("announcements.game", "Игра")}</Label>
            <Input id="game" value={game} onChange={(e) => setGame(e.target.value)} placeholder="Например, 'Call of Duty: Warzone'" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("announcements.descriptionField", "Описание")}</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Например, 'Сегодня играем с подписчиками, залетайте!'" />
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">{t("announcements.buttons", "Кликбейтные кнопки")}</h3>
            <div className="space-y-4">
              {buttons.map((btn, index) => (
                <motion.div 
                  key={btn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <Label className="font-mono">Кнопка #{index + 1}</Label>
                    <Button variant="ghost" size="icon" onClick={() => removeButton(btn.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`btn-text-${btn.id}`}>{t("announcements.buttonText", "Текст кнопки")}</Label>
                    <Input id={`btn-text-${btn.id}`} value={btn.text} onChange={(e) => updateButton(btn.id, 'text', e.target.value)} placeholder="🚀 Залетай!" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`btn-url-${btn.id}`}>{t("announcements.buttonUrl", "URL кнопки")}</Label>
                    <Input id={`btn-url-${btn.id}`} value={btn.url} onChange={(e) => updateButton(btn.id, 'url', e.target.value)} placeholder="https://twitch.tv/yourchannel" />
                  </div>
                </motion.div>
              ))}
              <Button variant="outline" onClick={addButtonClicked} className="w-full gap-2">
                <PlusCircle size={16} /> {t("announcements.addButton", "Добавить кнопку")}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Tabs defaultValue="discord">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="discord" className="gap-2"><Bot size={16} /> Discord</TabsTrigger>
              <TabsTrigger value="telegram" className="gap-2"><Send size={16} /> Telegram</TabsTrigger>
            </TabsList>
            <TabsContent value="discord" className="mt-4">
              <DiscordPreview title={title} game={game} description={description} buttons={buttons} />
            </TabsContent>
            <TabsContent value="telegram" className="mt-4">
              <TelegramPreview title={title} game={game} description={description} buttons={buttons} />
            </TabsContent>
          </Tabs>

          <div className="mt-8">
            <Button onClick={handleSend} disabled={sending} className="w-full gap-2 text-lg p-6 glow-primary">
              {sending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Sparkles size={20} />
                </motion.div>
              ) : (
                <Send size={20} />
              )}
              {sending ? t("announcements.sending", "Отправка...") : t("announcements.send", "Отправить анонс")}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
