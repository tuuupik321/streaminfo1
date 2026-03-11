import type { ReactNode } from "react";

export function StatCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {trend ? <div className="stat-trend">{trend}</div> : null}
    </div>
  );
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card section-card">
      <div className="section-title">{title}</div>
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
