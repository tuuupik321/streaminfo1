import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Megaphone, Send, Loader2, Clock, ImageIcon, Link2, Plus, X, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Broadcast {
  id: string;
  message: string;
  sent_at: string;
}

interface InlineButton {
  text: string;
  url: string;
}

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
    };
  };
};

type BroadcastApiResponse = {
  status?: string;
  sent?: number;
  failed?: number;
  error?: string;
};

export function BroadcastSection() {
  const [broadcastText, setBroadcastText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [buttons, setButtons] = useState<InlineButton[]>([]);
  const [newBtnText, setNewBtnText] = useState("");
  const [newBtnUrl, setNewBtnUrl] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const loadHistory = async () => {
    const { data } = await supabase.from("broadcasts").select("*").order("sent_at", { ascending: false }).limit(5);
    if (data) setHistory(data);
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const addButton = () => {
    if (!newBtnText.trim() || !newBtnUrl.trim()) {
      toast.error("Заполните текст и URL кнопки");
      return;
    }
    if (buttons.length >= 3) {
      toast.error("Максимум 3 кнопки");
      return;
    }
    setButtons([...buttons, { text: newBtnText.trim(), url: newBtnUrl.trim() }]);
    setNewBtnText("");
    setNewBtnUrl("");
  };

  const removeButton = (i: number) => setButtons(buttons.filter((_, idx) => idx !== i));

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) {
      toast.error("Введите текст рассылки");
      return;
    }
    const initData = (window as TelegramWindow).Telegram?.WebApp?.initData || "";
    const adminToken = sessionStorage.getItem("admin_token") || "";
    if (!initData || !adminToken) {
      toast.error("Сессия админа истекла. Войдите снова.");
      return;
    }
    setBroadcastSending(true);

    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: broadcastText.trim(),
          media_url: mediaUrl.trim() || null,
          buttons,
          init_data: initData,
          admin_token: adminToken,
        }),
      });
      const payload: BroadcastApiResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error("Ошибка отправки рассылки");
        return;
      }

      toast.success(`Рассылка отправлена: ${payload.sent ?? 0}, ошибок: ${payload.failed ?? 0}`);
      setBroadcastText("");
      setMediaUrl("");
      setButtons([]);
      setShowPreview(false);
      void loadHistory();
    } catch {
      toast.error("Ошибка отправки рассылки");
    } finally {
      setBroadcastSending(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-secondary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Megaphone size={14} /> Конструктор рассылки
          </CardTitle>
          <CardDescription className="text-xs">Соберите короткое сообщение, одно действие и при необходимости медиа.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Текст сообщения для всех пользователей..."
            className="min-h-[100px] resize-none font-mono text-sm"
          />

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-mono"><ImageIcon size={12} /> Медиа (необязательно)</Label>
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg или видео URL"
              className="font-mono text-xs"
            />
            {mediaUrl && (
              <div className="max-h-32 overflow-hidden rounded-lg border border-border/30">
                <img src={mediaUrl} alt="preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>

          <Separator className="border-border/30" />

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-mono"><Link2 size={12} /> Кнопки-ссылки (до 3)</Label>
            {buttons.map((btn, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/50 p-2">
                <Badge variant="secondary" className="font-mono text-xs">{btn.text}</Badge>
                <span className="flex-1 truncate text-[10px] font-mono text-muted-foreground">{btn.url}</span>
                <Button variant="ghost" size="sm" onClick={() => removeButton(i)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                  <X size={12} />
                </Button>
              </div>
            ))}
            {buttons.length < 3 && (
              <div className="flex gap-2">
                <Input value={newBtnText} onChange={(e) => setNewBtnText(e.target.value)} placeholder="Текст кнопки" className="flex-1 font-mono text-xs" />
                <Input value={newBtnUrl} onChange={(e) => setNewBtnUrl(e.target.value)} placeholder="URL" className="flex-1 font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={addButton} className="shrink-0 gap-1">
                  <Plus size={12} /> Добавить
                </Button>
              </div>
            )}
          </div>

          <Separator className="border-border/30" />

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-1.5 text-xs font-mono text-muted-foreground">
              <Eye size={12} /> {showPreview ? "Скрыть превью" : "Показать превью"}
            </Button>
            <Button onClick={handleBroadcast} disabled={broadcastSending || !broadcastText.trim()} className="gap-2">
              {broadcastSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Отправить всем
            </Button>
          </div>

          {showPreview && (
            <div className="space-y-2 rounded-xl border border-border/30 bg-[hsl(var(--muted))] p-4">
              <p className="mb-2 text-[10px] font-mono text-muted-foreground">Превью в Telegram:</p>
              {mediaUrl && (
                <div className="mb-2 max-h-40 overflow-hidden rounded-lg">
                  <img src={mediaUrl} alt="" className="w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm font-mono text-foreground">{broadcastText || "Текст сообщения..."}</p>
              {buttons.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {buttons.map((btn, i) => (
                    <div key={i} className="cursor-pointer rounded-lg bg-primary/10 py-1.5 text-center text-xs font-mono text-primary transition-colors hover:bg-primary/20">
                      {btn.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="border-border/50 bg-secondary/30">
          <CardContent className="space-y-2 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Clock size={12} /> Последние рассылки
            </p>
            {history.map((b) => (
              <div key={b.id} className="flex items-start gap-3 rounded-lg border border-border/30 bg-background/50 p-2.5">
                <Badge variant="outline" className="mt-0.5 shrink-0 border-border/50 font-mono text-[10px]">
                  {formatDate(b.sent_at)}
                </Badge>
                <p className="line-clamp-2 text-xs font-mono text-foreground/80">{b.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
