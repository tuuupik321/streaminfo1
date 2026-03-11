import { motion } from "framer-motion";
import { Trash2, Pencil, Check, X, Loader2, Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { platformInfo, type LinkedAccount, type TelegramChannel } from "./types";
import { parseUsernameOrLink } from "./usernameParser";
import { toast } from "sonner";
import type { StreamStatus } from "@/hooks/useStreamStatus";

interface AccountRowProps {
  account: LinkedAccount;
  channels: TelegramChannel[];
  savingIntegration: boolean;
  onSaveEdit: (account: LinkedAccount, newUsername: string) => Promise<boolean>;
  onRemove: (id: string) => void;
  streamStatus?: StreamStatus;
  isMonitored?: boolean;
  onToggleMonitor?: (platform: string, username: string, enable: boolean) => void;
}

export default function AccountRow({
  account,
  channels,
  savingIntegration,
  onSaveEdit,
  onRemove,
  streamStatus,
  isMonitored,
  onToggleMonitor,
}: AccountRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const info = platformInfo[account.platform];
  const PlatformIcon = info.icon;

  const startEdit = () => {
    setIsEditing(true);
    setEditValue(account.username);
  };

  const handleSave = async () => {
    if (!editValue.trim()) {
      toast.error("Введи ссылку или никнейм");
      return;
    }
    const result = parseUsernameOrLink(editValue, account.platform);
    if (!result.username) {
      toast.error(result.error || "Некорректный никнейм");
      return;
    }
    const success = await onSaveEdit(account, result.username);
    if (success) {
      setIsEditing(false);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue("");
  };

  return (
    <motion.div layout className="mb-2">
      <div className="group flex items-center justify-between rounded-lg border border-border/30 bg-background/50 px-3 py-2 transition-all duration-200 hover:border-border/60 hover:bg-background/70">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative flex-shrink-0">
            <motion.div whileHover={{ scale: 1.15, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <PlatformIcon size={18} className={info.color} />
            </motion.div>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.2 }}
              className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${
                streamStatus?.isLive ? "animate-pulse bg-destructive" : "bg-emerald-500"
              }`}
              title={streamStatus?.isLive ? "LIVE" : "Оффлайн"}
            />
          </div>

          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex-1"
            >
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="h-7 flex-1 font-mono text-sm"
                autoFocus
              />
            </motion.div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-mono text-sm font-semibold">{account.username}</p>
                {streamStatus?.isLive && (
                  <Badge variant="destructive" className="animate-pulse font-mono text-[10px]">
                    LIVE{streamStatus.viewerCount ? ` - ${streamStatus.viewerCount}` : ""}
                  </Badge>
                )}
              </div>
              {streamStatus?.isLive && streamStatus.title && (
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{streamStatus.title}</p>
              )}
              <div className="mt-0.5 flex flex-wrap gap-1">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {info.label}
                </Badge>
                {account.linkedChannels.map((chId) => {
                  const ch = channels.find((c) => c.id === chId);
                  return (
                    <Badge key={chId} variant="secondary" className="font-mono text-[10px]">
                      {ch?.channel_name || chId}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center gap-1"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                className="text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                disabled={savingIntegration}
              >
                {savingIntegration ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </Button>
              <Button variant="ghost" size="icon" onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </Button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {(account.platform === "twitch" || account.platform === "youtube") && onToggleMonitor && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleMonitor(account.platform, account.username, !isMonitored)}
                      className={
                        isMonitored
                          ? "text-primary hover:bg-primary/10 hover:text-primary/80"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }
                    >
                      {isMonitored ? <Bell size={14} /> : <BellOff size={14} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMonitored ? "Мониторинг включен - уведомления будут приходить в Telegram" : "Включить мониторинг стрима"}
                  </TooltipContent>
                </Tooltip>
              )}

              <Button variant="ghost" size="icon" onClick={startEdit} className="text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                <Pencil size={14} />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Отвязать {info.label}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Аккаунт <span className="font-mono font-semibold">{account.username}</span> будет отвязан. При необходимости его можно будет подключить заново.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemove(account.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Отвязать
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
