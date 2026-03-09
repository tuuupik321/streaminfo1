import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ icon: Icon, label, value, status }: { icon: React.ElementType; label: string; value: string | number; status?: "ok" | "warn" | "error" }) {
  return (
    <Card className="bg-secondary/30 border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-mono">{label}</p>
          <p className="text-lg font-bold font-heading text-foreground truncate">{value}</p>
        </div>
        {status && (
          <div className={`w-2.5 h-2.5 rounded-full ${status === "ok" ? "bg-green-500 glow-success" : status === "warn" ? "bg-yellow-500" : "bg-destructive"}`} />
        )}
      </CardContent>
    </Card>
  );
}
