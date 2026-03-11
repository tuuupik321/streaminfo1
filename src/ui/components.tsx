import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  trend,
  trendDirection = "up",
  icon,
}: {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon?: ReactNode;
}) {
  const trendIcon =
    trendDirection === "up" ? <ArrowUpRight size={14} /> : trendDirection === "down" ? <ArrowDownRight size={14} /> : null;

  return (
    <div className="card stat-card">
      <div className="stat-label">
        {icon ? <span className="stat-icon">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {trend ? (
        <div className={`stat-trend ${trendDirection}`}>
          {trendIcon}
          <span>{trend}</span>
        </div>
      ) : null}
    </div>
  );
}

export function SectionCard({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card section-card">
      <div className="section-title">
        {icon ? <span className="section-icon">{icon}</span> : null}
        <span>{title}</span>
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

export function SidebarItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <button className={`sidebar-item${active ? " active" : ""}`} type="button">
      <span className="sidebar-dot" />
      {label}
    </button>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}

export function PrimaryButton({ children, onClick, type = "button" }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button type={type} className="btn btn-primary" onClick={onClick}>
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="btn btn-ghost" onClick={onClick}>
      {children}
    </button>
  );
}
