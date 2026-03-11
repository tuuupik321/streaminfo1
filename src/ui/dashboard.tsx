import type { UserProfile } from "../database/users";
import type { PlatformTheme } from "./themes";
import { GhostButton, Pill, PrimaryButton, SectionCard, SidebarItem, StatCard } from "./components";

export function Dashboard({ theme, profile, onReconnect }: { theme: PlatformTheme; profile: UserProfile; onReconnect: () => void }) {
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
          <StatCard label="Live viewers" value="1 248" trend="+12% сегодня" />
          <StatCard label="Followers" value="32 410" trend="+230 за неделю" />
          <StatCard label="Last stream" value="2ч 18м" trend="Пик 1 740" />
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
