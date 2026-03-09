import { useEffect, useState } from "react";
import { Clock3, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

type AuditLog = {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
};

export function AuditLogSection() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("event_logs")
        .select("id, event_type, message, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs((data as AuditLog[] | null) || []);
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <Card className="bg-secondary/30 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <FileText size={14} />
          Audit log
        </CardTitle>
        <CardDescription className="text-xs">History of critical actions in admin panel.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No logs yet</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-border/30 bg-background/50 p-2.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-primary">{log.event_type}</span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock3 size={10} />
                      {new Date(log.created_at).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
