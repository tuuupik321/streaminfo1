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

export type StreamItem = {
  title?: string;
  url?: string;
  published_at?: string;
  view_count?: number;
  duration?: string;
};

export type ClipItem = {
  title?: string;
  url?: string;
  creator?: string;
  view_count?: number;
  created_at?: string;
};

export type NotificationItem = {
  title: string;
  body?: string;
  created_at: string;
};

export function Dashboard({
  theme,
  profile,
  stats,
  streams,
  clips,
  notifications,
  streamSeries,
  onReconnect,
}: {
  theme: PlatformTheme;
  profile: UserProfile;
  stats: DashboardStats | null;
  streams: StreamItem[];
  clips: ClipItem[];
  notifications: NotificationItem[];
  streamSeries: Array<{ date: string; count: number }>;
  onReconnect: () => void;
}) {
  const viewers = stats?.viewers ?? 0;
  const followers = stats?.followers ?? 0;
  const subscribers = stats?.subscribers ?? 0;
  const isOnline = stats?.online ?? false;
  const maxCount = Math.max(1, ...streamSeries.map((item) => item.count));

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
          <SectionCard title="Stream history">
            <div className="bar-chart">
              {streamSeries.length === 0 ? <div className="empty">No data yet</div> : null}
              {streamSeries.map((item) => (
                <div key={item.date} className="bar">
                  <div className="bar-fill" style={{ height: `${(item.count / maxCount) * 100}%` }} />
                  <span>{item.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Streams">
            <ul className="section-list">
              {streams.length === 0 ? <li>No streams yet</li> : null}
              {streams.map((stream) => (
                <li key={stream.url}>
                  <a className="link" href={stream.url} target="_blank" rel="noreferrer">
                    {stream.title || "Stream"}
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Latest clips">
            <ul className="section-list">
              {clips.length === 0 ? <li>No clips yet</li> : null}
              {clips.map((clip) => (
                <li key={clip.url}>
                  <a className="link" href={clip.url} target="_blank" rel="noreferrer">
                    {clip.title || "Clip"}
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Notifications">
            <ul className="section-list">
              {notifications.length === 0 ? <li>No notifications</li> : null}
              {notifications.map((note) => (
                <li key={note.created_at}>
                  {note.title} {note.body ? `— ${note.body}` : ""}
                </li>
              ))}
            </ul>
          </SectionCard>
        </section>
      </main>
    </div>
  );
}

