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
  { label: "Информация", path: "/", keywords: "home info stream" },
  { label: "Аналитика", path: "/analytics", keywords: "analytics chart" },
  { label: "Донаты", path: "/donations", keywords: "donate donations" },
  { label: "Источники", path: "/integrations", keywords: "integrations sources" },
  { label: "Настройки", path: "/settings", keywords: "settings" },
  { label: "Поддержка", path: "/support", keywords: "support help" },
  { label: "Bridge", path: "/bridge", keywords: "bridge twitch youtube" },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const currentTelegramId = getCurrentTelegramId();
  const showAdmin = isOwnerTelegramId(currentTelegramId) || hasAdminSession(currentTelegramId);

  const entries = useMemo(() => {
    if (!showAdmin) return BASE_ENTRIES;
    return [...BASE_ENTRIES, { label: "Админ", path: "/admin", keywords: "admin moderation" }];
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
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => `${entry.label.toLowerCase()} ${entry.keywords}`.includes(q));
  }, [entries, query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-white/10 bg-black/95 p-4 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono tracking-[0.12em] uppercase text-white/80">Command Palette</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-10 border-white/15 bg-black pl-9 text-white"
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
              className="flex w-full items-center justify-between rounded-[4px] border border-white/10 bg-black px-3 py-2 text-left text-sm text-white/85 transition-all duration-200 hover:border-white/25 active:scale-[0.99]"
            >
              <span>{entry.label}</span>
              <span className="font-mono text-[10px] text-white/45">{entry.path}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
