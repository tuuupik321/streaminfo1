import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardShellProps = {
  children: ReactNode;
  className?: string;
};

export function CardShell({ children, className }: CardShellProps) {
  return (
    <div className={cn("saas-card spotlight-hover", className)}>
      {children}
    </div>
  );
}
