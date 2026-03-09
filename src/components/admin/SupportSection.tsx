import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { HeadphonesIcon, MessageSquare, Clock, CheckCircle2, Loader2, Send, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Ticket {
  id: string;
  telegram_id: string;
  username: string | null;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
    };
  };
};

type SupportReplyResponse = {
  status?: string;
  error?: string;
};

export function SupportSection() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const loadTickets = useCallback(async () => {
    let query = supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    if (data) setTickets(data as Ticket[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("support_tickets").update({ status }).eq("id", id);
    toast.success(`Статус обновлён → ${status === "new" ? "Новое" : status === "in_progress" ? "В работе" : "Решено"}`);
    loadTickets();
  };

  const handleReply = async (ticket: Ticket) => {
    if (!replyText.trim()) return;
    const initData = (window as TelegramWindow).Telegram?.WebApp?.initData || "";
    const adminToken = sessionStorage.getItem("admin_token") || "";
    if (!initData || !adminToken) {
      toast.error("Сессия админа истекла. Войдите снова.");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/admin/support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticket.id,
          reply_text: replyText.trim(),
          init_data: initData,
          admin_token: adminToken,
        }),
      });
      const payload: SupportReplyResponse = await response.json().catch(() => ({}));
      if (!response.ok || payload.error) {
        toast.error("Не удалось отправить ответ");
        return;
      }

      toast.success(`Ответ отправлен пользователю ${ticket.username || ticket.telegram_id}`);
      setReplyText("");
      setReplyingId(null);
      void loadTickets();
    } catch {
      toast.error("Не удалось отправить ответ");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) + " " +
      d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const statusLabel = (s: string) => s === "new" ? "Новое" : s === "in_progress" ? "В работе" : "Решено";
  const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" =>
    s === "new" ? "destructive" : s === "in_progress" ? "default" : "secondary";

  const counts = {
    all: tickets.length,
    new: tickets.filter(t => t.status === "new").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "new", "in_progress", "resolved"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="gap-1.5 text-xs font-mono"
          >
            {f === "all" ? "Все" : statusLabel(f)}
            <Badge variant="secondary" className="text-[10px] font-mono ml-1">
              {counts[f]}
            </Badge>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="bg-secondary/30 border-border/50">
          <CardContent className="p-8 text-center">
            <HeadphonesIcon size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground font-mono">Нет обращений</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className={`bg-secondary/30 border-border/50 ${ticket.status === "new" ? "border-l-2 border-l-destructive" : ""}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-bold text-foreground">
                        {ticket.username ? `@${ticket.username}` : `ID: ${ticket.telegram_id}`}
                      </span>
                      <Badge variant={statusVariant(ticket.status)} className="text-[10px] font-mono">
                        {statusLabel(ticket.status)}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock size={8} /> {formatDate(ticket.created_at)}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-foreground/80">{ticket.message}</p>
                  </div>
                  <Select value={ticket.status} onValueChange={(v) => updateStatus(ticket.id, v)}>
                    <SelectTrigger className="w-[120px] text-xs font-mono h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new" className="text-xs font-mono">Новое</SelectItem>
                      <SelectItem value="in_progress" className="text-xs font-mono">В работе</SelectItem>
                      <SelectItem value="resolved" className="text-xs font-mono">Решено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin reply */}
                {ticket.admin_reply && (
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-[10px] font-mono text-primary mb-1 flex items-center gap-1">
                      <ArrowRight size={8} /> Ответ администратора
                    </p>
                    <p className="text-xs font-mono text-foreground/80">{ticket.admin_reply}</p>
                  </div>
                )}

                {/* Reply form */}
                {replyingId === ticket.id ? (
                  <div className="flex gap-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Напиши ответ..."
                      className="font-mono text-xs min-h-[60px] resize-none flex-1"
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={() => handleReply(ticket)} disabled={sending || !replyText.trim()} className="gap-1">
                        {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setReplyingId(null); setReplyText(""); }} className="text-xs">✕</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setReplyingId(ticket.id)} className="gap-1.5 text-xs font-mono text-muted-foreground">
                    <MessageSquare size={12} /> Ответить
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
