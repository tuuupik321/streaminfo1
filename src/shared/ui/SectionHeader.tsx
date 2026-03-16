import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, subtitle, rightSlot, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div>
        {subtitle ? <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/50">{subtitle}</p> : null}
        <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {rightSlot ? <div>{rightSlot}</div> : null}
    </div>
  );
}
