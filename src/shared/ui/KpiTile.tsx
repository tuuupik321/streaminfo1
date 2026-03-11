import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiTileProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  className?: string;
};

export function KpiTile({ icon: Icon, label, value, className }: KpiTileProps) {
  return (
    <div className={cn("saas-card text-xs", className)}>
      <div className="flex items-center gap-2 text-white/60">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
