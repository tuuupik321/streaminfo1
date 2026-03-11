import type { UserProfile } from "../database/users";
import { Activity, Bell, Film, Flame, Radio, Users, Video } from "lucide-react";
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
  showSidebar = true,
}: {
  theme: PlatformTheme;
  profile: UserProfile;
  stats: DashboardStats | null;
  streams: StreamItem[];
  clips: ClipItem[];
  notifications: NotificationItem[];
  streamSeries: Array<{ date: string; count: number }>;
  onReconnect: () => void;
  showSidebar?: boolean;
}) {
  const formatLegacyDuration = (duration?: string) => {
    if (!duration) return "2ч 18м";
    return duration
      .replace(/(\d+)h/i, "$1ч ")
      .replace(/(\d+)m/i, "$1м")
      .replace(/(\d+)s/i, "$1с")
      .trim();
  };

  const viewers = stats?.viewers ?? 0;
  const followers = stats?.followers ?? 0;
  const subscribers = stats?.subscribers ?? 0;
  const isOnline = stats?.online ?? false;
  const maxCount = Math.max(1, ...streamSeries.map((item) => item.count));
  const lastStream = streams[0];
  const lastStreamLabel = lastStream?.view_count ? `Просмотров ${lastStream.view_count.toLocaleString("ru-RU")}` : "Архив готов";

  return (
    <div className={`dashboard${showSidebar ? "" : " embedded"}`}>
      {showSidebar ? (
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark" />
            <div className="brand-text">
              <span>StreamsInfo</span>
              <small>{theme.platform.toUpperCase()}</small>
            </div>
          </div>
          <nav className="sidebar-nav">
            <SidebarItem label="Дашборд" active />
            <SidebarItem label="Эфиры" />
            <SidebarItem label="Лента" />
            <SidebarItem label="Настройки" />
          </nav>
          <div className="sidebar-footer">
            <div className="connected">
              <span className="status-dot" />
              Канал: {profile.channel_name}
            </div>
            <GhostButton onClick={onReconnect}>Сменить канал</GhostButton>
          </div>
        </aside>
      ) : null}
      <main className="content">
        <header className="content-header">
          <div>
            <h1>{theme.name}</h1>
            <p>Ключевые цифры, эфиры и уведомления в одном спокойном рабочем экране.</p>
            <div className="hero-tags">
              <span className={`status-pill ${isOnline ? "online" : "offline"}`}>
                <Radio size={14} />
                {isOnline ? "В эфире" : "Оффлайн"}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <Pill>{profile.platform.toUpperCase()}</Pill>
            <PrimaryButton>Открыть анонсы</PrimaryButton>
          </div>
        </header>
        <section className="stats">
          {profile.platform === "twitch" ? (
            <>
              <StatCard
                label="Зрители"
                value={`${viewers}`}
                trend={isOnline ? "Эфир активен" : "Ждём следующий старт"}
                trendDirection={isOnline ? "up" : "down"}
                icon={<Users size={16} />}
              />
              <StatCard
                label="Фолловеры"
                value={`${followers}`}
                trend={followers > 0 ? "Канал растёт" : "Нужен первый рост"}
                trendDirection={followers > 0 ? "up" : "down"}
                icon={<Activity size={16} />}
              />
              <StatCard
                label="Последний эфир"
                value={formatLegacyDuration(lastStream?.duration)}
                trend={lastStreamLabel}
                trendDirection="neutral"
                icon={<Flame size={16} />}
              />
            </>
          ) : (
            <>
              <StatCard
                label="Подписчики"
                value={`${subscribers}`}
                trend={subscribers > 0 ? "Аудитория растёт" : "Канал ждёт запуск"}
                trendDirection={subscribers > 0 ? "up" : "down"}
                icon={<Users size={16} />}
              />
              <StatCard
                label="Последний эфир"
                value={formatLegacyDuration(lastStream?.duration || "1h 04m")}
                trend={lastStreamLabel}
                trendDirection="neutral"
                icon={<Flame size={16} />}
              />
              <StatCard
                label="Уведомления"
                value={`${notifications.length}`}
                trend={notifications.length > 0 ? "Новые события есть" : "Пока спокойно"}
                trendDirection={notifications.length > 0 ? "up" : "neutral"}
                icon={<Bell size={16} />}
              />
            </>
          )}
        </section>
        <section className="sections">
          <SectionCard title="История эфиров" icon={<Activity size={16} />}>
            <div className="bar-chart">
              {streamSeries.length === 0 ? <div className="empty">Пока нет истории</div> : null}
              {streamSeries.map((item) => (
                <div key={item.date} className="bar">
                  <div className="bar-fill" style={{ height: `${(item.count / maxCount) * 100}%` }} />
                  <span>{item.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Недавние эфиры" icon={<Video size={16} />}>
            <ul className="section-list">
              {streams.length === 0 ? <li>Эфиров пока нет</li> : null}
              {streams.map((stream) => (
                <li key={stream.url}>
                  <a className="link" href={stream.url} target="_blank" rel="noreferrer">
                    {stream.title || "Эфир"}
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Клипы" icon={<Film size={16} />}>
            <ul className="section-list">
              {clips.length === 0 ? <li>Клипов пока нет</li> : null}
              {clips.map((clip) => (
                <li key={clip.url}>
                  <a className="link" href={clip.url} target="_blank" rel="noreferrer">
                    {clip.title || "Клип"}
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Лента событий" icon={<Bell size={16} />}>
            <ul className="section-list">
              {notifications.length === 0 ? <li>Пока без уведомлений</li> : null}
              {notifications.map((note) => (
                <li key={note.created_at}>
                  {note.title} {note.body ? `- ${note.body}` : ""}
                </li>
              ))}
            </ul>
          </SectionCard>
        </section>
      </main>
    </div>
  );
}
