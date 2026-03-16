import { useMemo } from "react";
import type { UserProfile } from "../database/users";
import { useNavigate } from "react-router-dom";
import type { PlatformTheme } from "./themes";
import { GhostButton, PrimaryButton, SectionCard, SidebarItem, StatCard } from "./components";

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

function formatLegacyDuration(duration?: string) {
  if (!duration) return "2ч 14м";
  return duration
    .replace(/(\d+)h/i, "$1ч ")
    .replace(/(\d+)m/i, "$1м")
    .replace(/(\d+)s/i, "$1с")
    .trim();
}

function formatStreamDate(value?: string) {
  if (!value) return "Последний эфир";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Последний эфир";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(parsed);
}

function timeAgo(value?: string) {
  if (!value) return "3 часа назад";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "3 часа назад";
  const diff = Date.now() - parsed.getTime();
  const hours = Math.max(1, Math.round(diff / (1000 * 60 * 60)));
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"} назад`;
  }
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"} назад`;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

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
  const navigate = useNavigate();

  const viewers = stats?.viewers ?? 0;
  const followers = stats?.followers ?? 0;
  const subscribers = stats?.subscribers ?? 0;
  const isOnline = stats?.online ?? false;
  const maxCount = Math.max(1, ...streamSeries.map((item) => item.count));
  const lastStream = streams[0];
  const lastStreamDuration = formatLegacyDuration(lastStream?.duration);
  const audienceLabel = profile.platform === "youtube" ? "Подписчики" : "Фолловеры";
  const audienceValue = profile.platform === "youtube" ? subscribers : followers;

  const averageOnline = useMemo(() => {
    const values = streams.map((item) => item.view_count ?? 0).filter((value) => value > 0);
    if (!values.length) return viewers > 0 ? viewers : 24;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [streams, viewers]);

  const peakLastStream = lastStream?.view_count ?? Math.max(...streams.map((item) => item.view_count ?? 0), viewers, 48);
  const heroStatus = isOnline
    ? `В эфире · сейчас ${formatCompactNumber(viewers || averageOnline)} зрителей`
    : lastStream?.published_at
      ? `Не в эфире · последний эфир ${timeAgo(lastStream.published_at)}`
      : "Не в эфире · лучший слот сегодня — 20:00";

  const streamsToShow = useMemo(() => streams.slice(0, 4), [streams]);

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
            <SidebarItem label="Главная" active />
            <SidebarItem label="Эфиры" />
            <SidebarItem label="Аналитика" />
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
        <header className="content-header dashboard-hero-header">
          <div className="dashboard-hero-copy">
            <h1>Центр управления эфиром</h1>
            <p>{heroStatus}</p>
          </div>
          <div className="header-actions dashboard-hero-actions">
            <PrimaryButton onClick={() => navigate("/analytics")}>Открыть аналитику</PrimaryButton>
          </div>
        </header>

        <section className="stats dashboard-stat-grid">
          <StatCard
            label="Средний онлайн за 30 дней"
            value={`${formatCompactNumber(averageOnline)}`}
          />
          <StatCard
            label={audienceLabel}
            value={`${formatCompactNumber(audienceValue)}`}
          />
          <StatCard
            label="Последний эфир"
            value={lastStreamDuration}
          />
        </section>

        <section className="sections dashboard-sections-grid">
          <SectionCard title="История эфиров">
            <div className="bar-chart dashboard-mini-chart">
              {streamSeries.length === 0 ? <div className="empty">История появится после первого завершённого эфира</div> : null}
              {streamSeries.map((item) => (
                <div key={item.date} className="bar">
                  <div className="bar-fill" style={{ height: `${(item.count / maxCount) * 100}%` }} />
                  <span>{item.date.slice(5)}</span>
                </div>
              ))}
            </div>
            <div className="dashboard-stream-list">
              {streamsToShow.length === 0 ? (
                <div className="empty dashboard-empty-block">
                  <strong>История появится после первого эфира</strong>
                </div>
              ) : (
                streamsToShow.map((stream, index) => (
                  <article key={`${stream.url || stream.title || "stream"}-${index}`} className="dashboard-stream-row">
                    <div>
                      <strong>{stream.title || "Эфир без названия"}</strong>
                      <p>
                        {formatStreamDate(stream.published_at)} · {formatLegacyDuration(stream.duration)} · пик {formatCompactNumber(stream.view_count ?? peakLastStream)} зрителей
                      </p>
                    </div>
                    <div className="dashboard-row-actions">
                      <GhostButton onClick={() => navigate("/info")}>Открыть</GhostButton>
                    </div>
                  </article>
                ))
              )}
            </div>
          </SectionCard>
        </section>
      </main>
    </div>
  );
}

