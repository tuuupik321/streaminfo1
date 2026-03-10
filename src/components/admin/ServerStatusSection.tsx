import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Server, Cpu, HardDrive, Wifi, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  ping: number;
  uptime: string;
  region: string;
}

const defaultMetrics: ServerMetrics = {
  cpu: 0,
  memory: 0,
  disk: 0,
  ping: 0,
  uptime: "—",
  region: "—",
};

function parseNumber(value: string | null | undefined, fallback = 0) {
  if (!value) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function ServerStatusSection() {
  const [metrics, setMetrics] = useState<ServerMetrics>(defaultMetrics);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "server_cpu",
        "server_memory",
        "server_disk",
        "server_ping",
        "server_uptime",
        "server_region",
      ]);

    const map: Record<string, string> = {};
    data?.forEach((row) => {
      map[row.key] = row.value;
    });

    setMetrics({
      cpu: parseNumber(map.server_cpu, 0),
      memory: parseNumber(map.server_memory, 0),
      disk: parseNumber(map.server_disk, 0),
      ping: parseNumber(map.server_ping, 0),
      uptime: map.server_uptime || "—",
      region: map.server_region || "—",
    });
  };

  useEffect(() => {
    void load();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getColor = (val: number) =>
    val > 80 ? "text-destructive" : val > 60 ? "text-yellow-500" : "text-green-500";

  const getProgressColor = (val: number) =>
    val > 80 ? "[&>div]:bg-destructive" : val > 60 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500";

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-heading flex items-center gap-2">
          <Server size={18} className="text-primary" /> Технический статус
        </h2>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={refreshing} className="gap-1.5 text-xs font-mono text-muted-foreground">
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Обновить
        </Button>
      </div>

      <Card className="bg-secondary/30 border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5"><Wifi size={12} /> Регион: {metrics.region}</span>
            <Badge variant="outline" className="font-mono text-[10px] border-border/50">
              Uptime: {metrics.uptime}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5"><Cpu size={12} /> CPU</span>
              <span className={`text-xs font-mono font-bold ${getColor(metrics.cpu)}`}>{metrics.cpu}%</span>
            </div>
            <Progress value={metrics.cpu} className={`h-2 ${getProgressColor(metrics.cpu)}`} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5"><Server size={12} /> Память</span>
              <span className={`text-xs font-mono font-bold ${getColor(metrics.memory)}`}>{metrics.memory}%</span>
            </div>
            <Progress value={metrics.memory} className={`h-2 ${getProgressColor(metrics.memory)}`} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5"><HardDrive size={12} /> Диск</span>
              <span className={`text-xs font-mono font-bold ${getColor(metrics.disk)}`}>{metrics.disk}%</span>
            </div>
            <Progress value={metrics.disk} className={`h-2 ${getProgressColor(metrics.disk)}`} />
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
            <span className="text-xs font-mono text-muted-foreground">Пинг до сервера</span>
            <span className={`text-sm font-mono font-bold ${getColor(metrics.ping > 100 ? 80 : metrics.ping > 50 ? 60 : 20)}`}>
              {metrics.ping}ms
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
