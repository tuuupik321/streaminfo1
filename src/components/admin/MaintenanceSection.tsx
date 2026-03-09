import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MaintenanceSectionProps {
  maintenanceMode: boolean;
  setMaintenanceMode: (v: boolean) => void;
  saveSetting: (key: string, value: string) => Promise<void>;
}

export function MaintenanceSection({ maintenanceMode, setMaintenanceMode, saveSetting }: MaintenanceSectionProps) {
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const newValue = !maintenanceMode;
    await saveSetting("maintenance_mode", String(newValue));
    setMaintenanceMode(newValue);
    setLoading(false);
    toast.success(newValue ? "⚠️ Режим обслуживания включён" : "✅ Режим обслуживания выключен");
  };

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
      <h2 className="text-lg font-bold font-heading flex items-center gap-2">
        <AlertTriangle size={18} className="text-destructive" /> Режим обслуживания
      </h2>
      <Card className={`border-border/50 transition-colors ${maintenanceMode ? "bg-destructive/10 border-destructive/30" : "bg-secondary/30"}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-heading font-bold text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground font-mono">
                {maintenanceMode
                  ? "⚠️ Все пользователи видят заглушку «Технические работы»"
                  : "Приложение работает в штатном режиме"}
              </p>
            </div>
            <Button
              variant={maintenanceMode ? "destructive" : "outline"}
              size="lg"
              onClick={toggle}
              disabled={loading}
              className="gap-2 min-w-[160px]"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : maintenanceMode ? (
                <><CheckCircle2 size={16} /> Выключить</>
              ) : (
                <><AlertTriangle size={16} /> Включить</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
