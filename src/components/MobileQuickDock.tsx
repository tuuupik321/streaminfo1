import { useMemo } from "react";
import { Activity, Zap, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function MobileQuickDock() {
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const labels = useMemo(
    () => ({
      live: t("quickDock.live", language === "en" ? "Live" : "Эфир"),
      events: t("quickDock.events", language === "en" ? "Events" : "Активность"),
      action: t("quickDock.action", language === "en" ? "Action" : "Действие"),
    }),
    [t, language],
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/20 bg-background/60 backdrop-blur-2xl md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2 px-3 py-2">
        <Button variant="outline" className="h-12 justify-center gap-2 rounded-2xl neon-accent" onClick={() => navigate("/live")}>
          <Radio size={16} />
          <span className="text-xs font-mono">{labels.live}</span>
        </Button>
        <Button variant="outline" className="h-12 justify-center gap-2 rounded-2xl" onClick={() => navigate("/live")}>
          <Activity size={16} />
          <span className="text-xs font-mono">{labels.events}</span>
        </Button>
        <Button variant="outline" className="h-12 justify-center gap-2 rounded-2xl" onClick={() => navigate("/integrations")}>
          <Zap size={16} />
          <span className="text-xs font-mono">{labels.action}</span>
        </Button>
      </div>
    </div>
  );
}
