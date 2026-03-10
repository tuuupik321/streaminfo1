import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserResult {
  id: string;
  telegram_id: string;
  username: string;
  status: "active" | "blocked";
  streams: number;
  last_seen: string;
}

export function UserManagementSection() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadBlocked = async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "blocked_telegram_ids")
        .maybeSingle();
      const ids = (data?.value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      setBlockedIds(new Set(ids));
    };
    void loadBlocked();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);

    const q = query.trim();
    const { data, error } = await supabase
      .from("telegram_channels")
      .select("id, chat_id, channel_name, created_at, updated_at")
      .or(`chat_id.ilike.%${q}%,channel_name.ilike.%${q}%`)
      .limit(12);

    if (error) {
      toast.error("Ошибка поиска");
      setSearching(false);
      return;
    }

    const mapped: UserResult[] = (data || []).map((row) => ({
      id: row.id,
      telegram_id: row.chat_id,
      username: row.channel_name || row.chat_id,
      status: blockedIds.has(row.chat_id) ? "blocked" : "active",
      streams: 0,
      last_seen: row.updated_at || row.created_at,
    }));

    setResults(mapped);
    setSearching(false);
  };

  const toggleBlock = async (userId: string) => {
    const target = results.find((u) => u.id === userId);
    if (!target) return;

    const next = new Set(blockedIds);
    if (next.has(target.telegram_id)) {
      next.delete(target.telegram_id);
    } else {
      next.add(target.telegram_id);
    }

    setBlockedIds(next);
    setResults((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: next.has(u.telegram_id) ? "blocked" : "active" }
          : u
      )
    );

    const value = Array.from(next).join(",");
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "blocked_telegram_ids", value }, { onConflict: "key" });

    if (error) {
      toast.error("Не удалось обновить статус");
      return;
    }

    toast.success("Статус пользователя обновлён");
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " +
      d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-4">
      <h2 className="text-lg font-bold font-heading flex items-center gap-2">
        <Users size={18} className="text-primary" /> Управление пользователями
      </h2>
      <Card className="bg-secondary/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono">Поиск по Telegram ID</CardTitle>
          <CardDescription className="text-xs">Найди стримера, посмотри логи или заблокируй доступ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введи Telegram ID..."
              className="font-mono text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()} size="sm" className="gap-1.5 shrink-0">
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Найти
            </Button>
          </div>

          {searched && results.length === 0 && !searching && (
            <p className="text-xs text-muted-foreground font-mono text-center py-3">Пользователь не найден</p>
          )}

          {results.map((user) => (
            <div key={user.id} className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-foreground">@{user.username}</span>
                  <Badge variant={user.status === "active" ? "default" : "destructive"} className="text-[10px] font-mono">
                    {user.status === "active" ? "Активен" : "Заблокирован"}
                  </Badge>
                </div>
                <Button
                  variant={user.status === "active" ? "outline" : "default"}
                  size="sm"
                  onClick={() => void toggleBlock(user.id)}
                  className="gap-1.5 text-xs"
                >
                  {user.status === "active" ? <><Ban size={12} /> Заблокировать</> : <><CheckCircle2 size={12} /> Разблокировать</>}
                </Button>
              </div>
              <div className="flex gap-4 text-[10px] font-mono text-muted-foreground">
                <span>ID: {user.telegram_id}</span>
                <span>Стримов: {user.streams}</span>
                <span>Последний вход: {formatDate(user.last_seen)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.section>
  );
}
