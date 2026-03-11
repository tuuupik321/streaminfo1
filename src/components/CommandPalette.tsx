import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getCurrentTelegramId, hasAdminSession, isOwnerTelegramId } from "@/lib/adminAccess";

type Entry = {
  label: string;
  path: string;
  keywords: string;
};

const BASE_ENTRIES: Entry[] = [
  { label: "Дашборд", path: "/", keywords: "home dashboard stream main" },
  { label: "Аналитика", path: "/analytics", keywords: "analytics stats charts" },
  { label: "Донаты", path: "/donations", keywords: "donations tips support money" },
  { label: "Интеграции", path: "/integrations", keywords: "integrations sources bots" },
  { label: "Настройки", path: "/settings", keywords: "settings theme preferences" },
  { label: "Поддержка", path: "/support", keywords: "support help faq" },
  { label: "Bridge", path: "/bridge", keywords: "bridge twitch youtube transfer" },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const currentTelegramId = getCurrentTelegramId();
  const showAdmin = isOwnerTelegramId(currentTelegramId) || hasAdminSession(currentTelegramId);

  const entries = useMemo(() => {
    if (!showAdmin) return BASE_ENTRIES;
    return [...BASE_ENTRIES, { label: "Админ", path: "/admin", keywords: "admin moderation access" }];
  }, [showAdmin]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return entries;
    return entries.filter((entry) => `${entry.label.toLowerCase()} ${entry.keywords}`.includes(normalized));
  }, [entries, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-border/70 bg-popover/95 p-4 shadow-[0_32px_80px_hsl(var(--shadow)/0.48)] backdrop-blur-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Быстрый переход
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Открой раздел..."
            className="pl-11"
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-auto">
          {filtered.map((entry) => (
            <button
              key={entry.path}
              type="button"
              onClick={() => {
                navigate(entry.path);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/65 px-4 py-3 text-left text-sm text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card active:scale-[0.99]"
            >
              <span>{entry.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {entry.path}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
