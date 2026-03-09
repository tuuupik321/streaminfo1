import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(true);

    // Mock search — in production this would query telegram_channels or a users table
    await new Promise((r) => setTimeout(r, 800));

    if (query === "524053673") {
      setResults([{
        id: "1",
        telegram_id: "524053673",
        username: "admin",
        status: "active",
        streams: 12,
        last_seen: new Date().toISOString(),
      }]);
    } else {
      setResults([]);
    }
    setSearching(false);
  };

  const toggleBlock = (userId: string) => {
    setResults((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "blocked" : "active" }
          : u
      )
    );
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
                  onClick={() => toggleBlock(user.id)}
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
