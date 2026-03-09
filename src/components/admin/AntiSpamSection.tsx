import { useState, useEffect } from "react";
import { ShieldBan, Plus, X, Save, Loader2, Clock, Hash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AntiSpamSectionProps {
  saveSetting: (key: string, value: string) => Promise<void>;
  settings: Record<string, string>;
}

export function AntiSpamSection({ saveSetting, settings }: AntiSpamSectionProps) {
  const [maxPerHour, setMaxPerHour] = useState("10");
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMaxPerHour(settings.antispam_max_per_hour || "10");
    const words = settings.antispam_blacklist;
    if (words) {
      try { setBlacklist(JSON.parse(words)); } catch { setBlacklist([]); }
    }
  }, [settings]);

  const addWord = () => {
    if (!newWord.trim()) return;
    const word = newWord.trim().toLowerCase();
    if (blacklist.includes(word)) { toast.error("Уже в списке"); return; }
    setBlacklist([...blacklist, word]);
    setNewWord("");
  };

  const removeWord = (word: string) => setBlacklist(blacklist.filter((w) => w !== word));

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      saveSetting("antispam_max_per_hour", maxPerHour),
      saveSetting("antispam_blacklist", JSON.stringify(blacklist)),
    ]);
    toast.success("Настройки антиспама сохранены");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Rate Limit */}
        <Card className="bg-secondary/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Clock size={14} /> Лимит сообщений
            </CardTitle>
            <CardDescription className="text-xs">Максимум анонсов от одного пользователя в час</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono">Анонсов в час</Label>
              <Input
                type="number"
                value={maxPerHour}
                onChange={(e) => setMaxPerHour(e.target.value)}
                min="1"
                max="100"
                className="font-mono text-sm w-24"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              При превышении лимита бот ответит «Подожди немного»
            </p>
          </CardContent>
        </Card>

        {/* Blacklist */}
        <Card className="bg-secondary/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <ShieldBan size={14} /> Чёрный список слов
            </CardTitle>
            <CardDescription className="text-xs">Слова, которые будут фильтроваться в постах</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Слово..."
                className="font-mono text-xs"
                onKeyDown={(e) => e.key === "Enter" && addWord()}
              />
              <Button variant="outline" size="sm" onClick={addWord} className="shrink-0 gap-1">
                <Plus size={12} /> Добавить
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {blacklist.length === 0 ? (
                <p className="text-[10px] text-muted-foreground font-mono">Список пуст</p>
              ) : (
                blacklist.map((word) => (
                  <Badge key={word} variant="secondary" className="font-mono text-xs gap-1 pr-1">
                    {word}
                    <button onClick={() => removeWord(word)} className="ml-0.5 hover:text-destructive transition-colors">
                      <X size={10} />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Сохранить антиспам
      </Button>
    </div>
  );
}
