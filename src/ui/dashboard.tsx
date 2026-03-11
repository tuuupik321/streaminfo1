import type { UserProfile } from "../database/users";
import type { PlatformTheme } from "./themes";
import { GhostButton, Pill, PrimaryButton, SectionCard, SidebarItem, StatCard } from "./components";

export type DashboardStats = {
  online?: boolean;
  viewers?: number;
  followers?: number;
  views?: number;
  subscribers?: number;
};

export function Dashboard({
  theme,
  profile,
  stats,
  onReconnect,
}: {
  theme: PlatformTheme;
  profile: UserProfile;
  stats: DashboardStats | null;
  onReconnect: () => void;
}) {
  const viewers = stats?.viewers ?? 0;
  const followers = stats?.followers ?? 0;
  const subscribers = stats?.subscribers ?? 0;
  const isOnline = stats?.online ?? false;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" />
          <div className="brand-text">
            <span>Stream Control</span>
            <small>{theme.platform.toUpperCase()}</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          <SidebarItem label="Dashboard" active />
          <SidebarItem label="Streams" />
          <SidebarItem label="Notifications" />
          <SidebarItem label="Settings" />
        </nav>
        <div className="sidebar-footer">
          <div className="connected">
            <span className="status-dot" />
            Подключено: {profile.channel_name}
          </div>
          <GhostButton onClick={onReconnect}>Переподключить канал</GhostButton>
        </div>
      </aside>
      <main className="content">
        <header className="content-header">
          <div>
            <h1>{theme.name}</h1>
            <p>Панель управления для стримера. Быстрые действия, статистика и уведомления в одном месте.</p>
          </div>
          <div className="header-actions">
            <Pill>{profile.platform.toUpperCase()}</Pill>
            <PrimaryButton>Создать пост о стриме</PrimaryButton>
          </div>
        </header>
        <section className="stats">
          {profile.platform === "twitch" ? (
            <>
              <StatCard label="Live viewers" value={`${viewers}`} trend={isOnline ? "В эфире" : "Оффлайн"} />
              <StatCard label="Followers" value={`${followers}`} trend="по Twitch" />
              <StatCard label="Last stream" value="2ч 18м" trend="Пик 1 740" />
            </>
          ) : (
            <>
              <StatCard label="Subscribers" value={`${subscribers}`} trend="по YouTube" />
              <StatCard label="Last stream" value="1ч 04м" trend="Пик 2 030" />
              <StatCard label="Notifications" value="12" trend="за неделю" />
            </>
          )}
        </section>
        <section className="sections">
          {theme.sections.map((section) => (
            <SectionCard key={section} title={section}>
              <ul className="section-list">
                <li>Шаблон поста и расписание трансляций</li>
                <li>Быстрые метрики и целевые значения</li>
                <li>Автоматические уведомления аудитории</li>
              </ul>
            </SectionCard>
          ))}
        </section>
      </main>
    </div>
  );
}
