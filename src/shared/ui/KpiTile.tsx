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
    <div className={cn("saas-card p-3 text-[11px] sm:p-4 sm:text-xs", className)}>
      <div className="flex items-center gap-1.5 text-white/60 sm:gap-2">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-1.5 text-[1.05rem] font-semibold sm:mt-2 sm:text-lg">{value}</div>
    </div>
  );
}
