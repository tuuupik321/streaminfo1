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

export default function AccountRow({ account, channels, savingIntegration, onSaveEdit, onRemove, streamStatus, isMonitored, onToggleMonitor }: AccountRowProps) {
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
      <div className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2 border border-border/30 hover:border-border/60 transition-all duration-200 hover:bg-background/70 group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <motion.div whileHover={{ scale: 1.15, rotate: 5 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <PlatformIcon size={18} className={info.color} />
            </motion.div>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.2 }}
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background ${
                streamStatus?.isLive ? "bg-destructive animate-pulse" : "bg-emerald-500"
              }`}
              title={streamStatus?.isLive ? "LIVE" : "Offline"}
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
                className="font-mono text-sm h-7 flex-1"
                autoFocus
              />
            </motion.div>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono font-semibold text-sm truncate">{account.username}</p>
                {streamStatus?.isLive && (
                  <Badge variant="destructive" className="text-[10px] font-mono animate-pulse">
                    LIVE{streamStatus.viewerCount ? ` • ${streamStatus.viewerCount}` : ""}
                  </Badge>
                )}
              </div>
              {streamStatus?.isLive && streamStatus.title && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{streamStatus.title}</p>
              )}
              <div className="flex gap-1 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-mono">{info.label}</Badge>
                {account.linkedChannels.map((chId) => {
                  const ch = channels.find((c) => c.id === chId);
                  return <Badge key={chId} variant="secondary" className="text-[10px] font-mono">{ch?.channel_name || chId}</Badge>;
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center gap-1"
            >
              <Button variant="ghost" size="icon" onClick={handleSave} className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" disabled={savingIntegration}>
                {savingIntegration ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </Button>
              <Button variant="ghost" size="icon" onClick={cancelEdit} className="text-muted-foreground hover:text-foreground"><X size={14} /></Button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {(account.platform === "twitch" || account.platform === "youtube") && onToggleMonitor && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleMonitor(account.platform, account.username, !isMonitored)}
                      className={isMonitored
                        ? "text-primary hover:text-primary/80 hover:bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }
                    >
                      {isMonitored ? <Bell size={14} /> : <BellOff size={14} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMonitored ? "Мониторинг включен - уведомления в Telegram" : "Включить мониторинг стрима"}
                  </TooltipContent>
                </Tooltip>
              )}
              <Button variant="ghost" size="icon" onClick={startEdit} className="text-muted-foreground hover:text-foreground hover:bg-muted/50"><Pencil size={14} /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 size={14} /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Отвязать {info.label}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Аккаунт <span className="font-mono font-semibold">{account.username}</span> будет отвязан. Это действие можно отменить, привязав аккаунт заново.
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
