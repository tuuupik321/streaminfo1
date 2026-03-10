import { useDashboardStore, ALL_WIDGETS, Widget } from "@/store/useDashboardStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

const WIDGET_NAMES: Record<Widget, string> = {
  stats: "Карточки статистики",
  viewerChart: "График зрителей",
  liveStreamFeed: "Лента стрима",
  partners: "Карусель партнеров",
  liveEvents: "Лента живых событий",
  predictions: "Предсказания",
  streamSeries: "Серии стримов",
  achievements: "Достижения",
};

export function WidgetManager({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { widgets, addWidget, removeWidget } = useDashboardStore();
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("widgetManager.title", "Управление виджетами")}</DialogTitle>
          <DialogDescription>{t("widgetManager.description", "Выберите, какие виджеты вы хотите видеть на главной странице.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {ALL_WIDGETS.map((widgetId) => (
            <div key={widgetId} className="flex items-center justify-between">
              <Label htmlFor={`widget-${widgetId}`} className="font-mono text-sm">
                {t(`widget.${widgetId}`, WIDGET_NAMES[widgetId])}
              </Label>
              <Switch
                id={`widget-${widgetId}`}
                checked={widgets.includes(widgetId)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    addWidget(widgetId);
                  } else {
                    removeWidget(widgetId);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
