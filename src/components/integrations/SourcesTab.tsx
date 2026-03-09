import { motion } from "framer-motion";
import { Twitch, Youtube, Heart, Gamepad2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { parseUsernameOrLink } from "./usernameParser";
import AccountRow from "./AccountRow";
import { useStreamStatus } from "@/hooks/useStreamStatus";
import type { LinkedAccount, TelegramChannel } from "./types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

interface SourcesTabProps {
  accounts: LinkedAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<LinkedAccount[]>>;
  channels: TelegramChannel[];
  savingIntegration: boolean;
  syncIntegrationsToBackend: (nextAccounts: LinkedAccount[]) => Promise<boolean>;
}

export default function SourcesTab({ accounts, setAccounts, channels, savingIntegration, syncIntegrationsToBackend }: SourcesTabProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [daLinkOpen, setDaLinkOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPlatform, setNewPlatform] = useState<"twitch" | "youtube">("twitch");
  const [monitors, setMonitors] = useState<Set<string>>(new Set());

  const { getStatus } = useStreamStatus({
    accounts,
    interval: 60_000,
    enabled: accounts.some((a) => a.platform === "twitch" || a.platform === "youtube"),
  });

  useEffect(() => {
    const loadMonitors = async () => {
      const { data } = await supabase.from("stream_monitors").select("platform, username");
      if (!data) return;
      setMonitors(new Set(data.map((m: { platform: string; username: string }) => `${m.platform}:${m.username}`)));
    };
    void loadMonitors();
  }, []);

  const toggleMonitor = useCallback(async (platform: string, username: string, enable: boolean) => {
    const key = `${platform}:${username}`;
    if (enable) {
      const { error } = await supabase.from("stream_monitors").upsert({ platform, username, is_live: false }, { onConflict: "platform,username" });
      if (error) {
        toast.error("Не удалось включить мониторинг");
        return;
      }
      setMonitors((prev) => new Set([...prev, key]));
      toast.success("Мониторинг включен");
      return;
    }

    const { error } = await supabase.from("stream_monitors").delete().eq("platform", platform).eq("username", username);
    if (error) {
      toast.error("Не удалось отключить мониторинг");
      return;
    }
    setMonitors((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    toast.success("Мониторинг отключен");
  }, []);

  const handleLink = async () => {
    if (!newUsername.trim()) {
      toast.error("Введи ссылку или никнейм");
      return;
    }
    const result = parseUsernameOrLink(newUsername, newPlatform);
    if (!result.username) {
      toast.error(result.error || "Некорректный ввод");
      return;
    }

    const nextAccounts: LinkedAccount[] = [
      ...accounts.filter((a) => a.platform !== newPlatform),
      { id: crypto.randomUUID(), platform: newPlatform, username: result.username, linkedChannels: [] },
    ];

    const saved = await syncIntegrationsToBackend(nextAccounts);
    if (!saved) return;

    setAccounts(nextAccounts);
    setNewUsername("");
    setLinkOpen(false);
    toast.success(`${newPlatform === "twitch" ? "Twitch" : "YouTube"} аккаунт привязан`);
  };

  const handleLinkDA = async () => {
    if (!newUsername.trim()) {
      toast.error("Введи ссылку или никнейм");
      return;
    }
    const result = parseUsernameOrLink(newUsername, "donationalerts");
    if (!result.username) {
      toast.error(result.error || "Некорректный ввод");
      return;
    }

    const nextAccounts: LinkedAccount[] = [
      ...accounts.filter((a) => a.platform !== "donationalerts"),
      { id: crypto.randomUUID(), platform: "donationalerts", username: result.username, linkedChannels: [] },
    ];

    const saved = await syncIntegrationsToBackend(nextAccounts);
    if (!saved) return;

    setAccounts(nextAccounts);
    setNewUsername("");
    setDaLinkOpen(false);
    toast.success("DonationAlerts привязан");
  };

  const removeAccount = async (id: string) => {
    const nextAccounts = accounts.filter((a) => a.id !== id);
    const saved = await syncIntegrationsToBackend(nextAccounts);
    if (!saved) return;
    setAccounts(nextAccounts);
    toast.success("Аккаунт отвязан");
  };

  const handleSaveEdit = async (account: LinkedAccount, username: string): Promise<boolean> => {
    const nextAccounts = accounts.map((a) => (a.id === account.id ? { ...a, username } : a));
    const saved = await syncIntegrationsToBackend(nextAccounts);
    if (!saved) return false;
    setAccounts(nextAccounts);
    toast.success("Аккаунт обновлен");
    return true;
  };

  const platformCards = useMemo(
    () => [
      { key: "twitch", icon: Twitch, color: "text-[#9146FF]", label: "Twitch", desc: "Стримы и чат", onClick: () => { setNewPlatform("twitch"); setLinkOpen(true); } },
      { key: "youtube", icon: Youtube, color: "text-[#FF0000]", label: "YouTube", desc: "Трансляции", onClick: () => { setNewPlatform("youtube"); setLinkOpen(true); } },
      { key: "donationalerts", icon: Heart, color: "text-[#F57B20]", label: "DonationAlerts", desc: "Донаты", onClick: () => setDaLinkOpen(true) },
      { key: "kick", icon: Gamepad2, color: "text-green-500", label: "Kick", desc: "Скоро", disabled: true, onClick: () => undefined },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {platformCards.map((p) => (
          <motion.div key={p.key} variants={cardVariants} whileHover={!p.disabled ? { scale: 1.03, y: -2 } : {}} whileTap={!p.disabled ? { scale: 0.98 } : {}}>
            <Card
              className={`bg-secondary/30 border-border/50 transition-all duration-300 relative overflow-hidden group ${p.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/40"}`}
              onClick={!p.disabled ? p.onClick : undefined}
            >
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <p.icon size={28} className={p.color} />
                <p className="font-mono text-sm font-semibold">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Card className="bg-secondary/30 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Привязанные аккаунты</CardTitle>
          <CardDescription>Подключи Twitch, YouTube и DonationAlerts для работы аналитики и уведомлений</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Привязать {newPlatform === "twitch" ? "Twitch" : "YouTube"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="font-mono text-sm">Ссылка или никнейм</Label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleLink()}
                    placeholder={newPlatform === "twitch" ? "https://twitch.tv/username или username" : "https://youtube.com/@channel или @channel"}
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={() => void handleLink()} className="w-full" disabled={savingIntegration}>{savingIntegration ? "Сохранение..." : "Привязать"}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={daLinkOpen} onOpenChange={setDaLinkOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Привязать DonationAlerts</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="font-mono text-sm">Ссылка или никнейм</Label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleLinkDA()}
                    placeholder="https://donationalerts.com/r/username или username"
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={() => void handleLinkDA()} className="w-full" disabled={savingIntegration}>{savingIntegration ? "Сохранение..." : "Привязать"}</Button>
              </div>
            </DialogContent>
          </Dialog>

          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет привязанных источников.</p>
          ) : (
            <div>
              {accounts.map((account) => {
                const monitorKey = `${account.platform}:${account.username}`;
                return (
                  <AccountRow
                    key={account.id}
                    account={account}
                    channels={channels}
                    savingIntegration={savingIntegration}
                    onSaveEdit={handleSaveEdit}
                    onRemove={removeAccount}
                    streamStatus={(account.platform === "twitch" || account.platform === "youtube") ? getStatus(account.platform, account.username) : undefined}
                    isMonitored={monitors.has(monitorKey)}
                    onToggleMonitor={toggleMonitor}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
