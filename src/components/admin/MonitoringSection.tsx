import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2, Clock, Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface ServiceStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  ping: number;
  lastChecked: string;
}

interface EventLog {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

export function MonitoringSection() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Twitch API", status: "online", ping: 42, lastChecked: new Date().toISOString() },
    { name: "YouTube API", status: "online", ping: 38, lastChecked: new Date().toISOString() },
    { name: "DonationAlerts", status: "online", ping: 55, lastChecked: new Date().toISOString() },
    { name: "Telegram Bot API", status: "online", ping: 18, lastChecked: new Date().toISOString() },
  ]);
  const [checking, setChecking] = useState(false);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const loadLogs = async () => {
    const { data } = await supabase
      .from("event_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setLogs(data as EventLog[]);
    setLogsLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  // Realtime subscription for live logs
  useEffect(() => {
    const channel = supabase
      .channel("event_logs_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_logs" }, (payload) => {
        setLogs((prev) => [payload.new as EventLog, ...prev].slice(0, 30));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const refreshServices = async () => {
    setChecking(true);
    await new Promise((r) => setTimeout(r, 1500));
    setServices((prev) => prev.map((s) => ({
      ...s,
      ping: Math.floor(Math.random() * 80) + 10,
      status: Math.random() > 0.9 ? "degraded" : "online",
      lastChecked: new Date().toISOString(),
    })));
    setChecking(false);
  };

  const statusIcon = (s: string) => {
    if (s === "online") return <CheckCircle2 size={14} className="text-green-500" />;
    if (s === "degraded") return <AlertCircle size={14} className="text-yellow-500" />;
    return <WifiOff size={14} className="text-destructive" />;
  };

  const statusLabel = (s: string) => s === "online" ? "Онлайн" : s === "degraded" ? "Нестабильно" : "Оффлайн";

  const eventIcon = (type: string) => {
    if (type === "error") return <AlertCircle size={10} className="text-destructive" />;
    if (type === "warning") return <AlertCircle size={10} className="text-yellow-500" />;
    return <Zap size={10} className="text-primary" />;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="space-y-4">
      {/* Service Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-heading flex items-center gap-2">
          <Wifi size={14} className="text-primary" /> Статус сервисов
        </h3>
        <Button variant="ghost" size="sm" onClick={refreshServices} disabled={checking} className="gap-1.5 text-xs font-mono text-muted-foreground">
          <RefreshCw size={12} className={checking ? "animate-spin" : ""} /> Проверить
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {services.map((s) => (
          <Card key={s.name} className={`bg-secondary/30 border-border/50 ${s.status === "offline" ? "border-destructive/30" : s.status === "degraded" ? "border-yellow-500/30" : ""}`}>
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground truncate">{s.name}</span>
                {statusIcon(s.status)}
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-mono border-border/50">
                  {s.ping}ms
                </Badge>
                <span className={`text-[10px] font-mono ${s.status === "online" ? "text-green-500" : s.status === "degraded" ? "text-yellow-500" : "text-destructive"}`}>
                  {statusLabel(s.status)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Log */}
      <Card className="bg-secondary/30 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Activity size={14} className="text-primary" /> Live Log
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </CardTitle>
          <CardDescription className="text-xs">Последние события системы в реальном времени</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground font-mono">Нет событий</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-background/50 transition-colors">
                    <span className="mt-0.5">{eventIcon(log.event_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-foreground/80 leading-tight">{log.message}</p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 flex items-center gap-0.5">
                      <Clock size={8} /> {formatTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
