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
    const { data } = await supabase
      .from("broadcasts")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(5);
    if (data) setHistory(data);
  };

  useEffect(() => { loadHistory(); }, []);

  const addButton = () => {
    if (!newBtnText.trim() || !newBtnUrl.trim()) { toast.error("Заполни текст и URL кнопки"); return; }
    if (buttons.length >= 3) { toast.error("Максимум 3 кнопки"); return; }
    setButtons([...buttons, { text: newBtnText.trim(), url: newBtnUrl.trim() }]);
    setNewBtnText("");
    setNewBtnUrl("");
  };

  const removeButton = (i: number) => setButtons(buttons.filter((_, idx) => idx !== i));

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) { toast.error("Введи текст рассылки"); return; }
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
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " +
      d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4">
      {/* Composer */}
      <Card className="bg-secondary/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Megaphone size={14} /> Конструктор рассылки
          </CardTitle>
          <CardDescription className="text-xs">Текст, медиа и кнопки для всех пользователей</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Текст сообщения..."
            className="font-mono text-sm min-h-[100px] resize-none"
          />

          {/* Media URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono flex items-center gap-1.5"><ImageIcon size={12} /> Медиа (необязательно)</Label>
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg или видео URL"
              className="font-mono text-xs"
            />
            {mediaUrl && (
              <div className="rounded-lg overflow-hidden border border-border/30 max-h-32">
                <img src={mediaUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>

          <Separator className="border-border/30" />

          {/* Inline Buttons */}
          <div className="space-y-2">
            <Label className="text-xs font-mono flex items-center gap-1.5"><Link2 size={12} /> Кнопки-ссылки (макс. 3)</Label>
            {buttons.map((btn, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30">
                <Badge variant="secondary" className="font-mono text-xs">{btn.text}</Badge>
                <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">{btn.url}</span>
                <Button variant="ghost" size="sm" onClick={() => removeButton(i)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                  <X size={12} />
                </Button>
              </div>
            ))}
            {buttons.length < 3 && (
              <div className="flex gap-2">
                <Input value={newBtnText} onChange={(e) => setNewBtnText(e.target.value)} placeholder="Текст кнопки" className="font-mono text-xs flex-1" />
                <Input value={newBtnUrl} onChange={(e) => setNewBtnUrl(e.target.value)} placeholder="URL" className="font-mono text-xs flex-1" />
                <Button variant="outline" size="sm" onClick={addButton} className="shrink-0 gap-1"><Plus size={12} /> Добавить</Button>
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

          {/* Telegram-style preview */}
          {showPreview && (
            <div className="rounded-xl bg-[hsl(var(--muted))] p-4 space-y-2 border border-border/30">
              <p className="text-[10px] font-mono text-muted-foreground mb-2">Превью в Telegram:</p>
              {mediaUrl && (
                <div className="rounded-lg overflow-hidden max-h-40 mb-2">
                  <img src={mediaUrl} alt="" className="w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
              <p className="text-sm font-mono text-foreground whitespace-pre-wrap">{broadcastText || "Текст сообщения..."}</p>
              {buttons.length > 0 && (
                <div className="flex flex-col gap-1 mt-2">
                  {buttons.map((btn, i) => (
                    <div key={i} className="text-center py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-mono cursor-pointer hover:bg-primary/20 transition-colors">
                      {btn.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card className="bg-secondary/30 border-border/50">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 mb-2">
              <Clock size={12} /> Последние рассылки
            </p>
            {history.map((b) => (
              <div key={b.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-background/50 border border-border/30">
                <Badge variant="outline" className="shrink-0 font-mono text-[10px] mt-0.5 border-border/50">
                  {formatDate(b.sent_at)}
                </Badge>
                <p className="text-xs font-mono text-foreground/80 line-clamp-2">{b.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
