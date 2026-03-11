import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  return (
    <div className={cn("spotlight-hover rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}
