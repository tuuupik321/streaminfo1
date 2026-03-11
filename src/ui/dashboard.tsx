import { useMemo, useState } from "react";
import type { UserProfile } from "../database/users";
import {
  Activity,
  ArrowRight,
  Bell,
  Clock3,
  Film,
  Flame,
  Radio,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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

type StreamFilter = "all" | "recent" | "best" | "without-clips";

const streamFilters: Array<{ value: StreamFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "recent", label: "Последние" },
  { value: "best", label: "Лучшие" },
  { value: "without-clips", label: "Без клипов" },
];

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
  const [streamFilter, setStreamFilter] = useState<StreamFilter>("all");

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
      ? `Оффлайн · последний эфир ${timeAgo(lastStream.published_at)}`
      : "Оффлайн · лучший слот сегодня — 20:00";

  const nextStep = profile.platform === "twitch"
    ? "Подключите YouTube, чтобы видеть общую аналитику по платформам."
    : profile.platform === "youtube"
      ? "Подключите Twitch, чтобы видеть общий онлайн и историю эфиров в одном месте."
      : "Подключите платформу, чтобы открыть аналитику, историю эфиров и AI-рекомендации.";

  const filteredStreams = useMemo(() => {
    const sorted = [...streams];
    if (streamFilter === "best") {
      return sorted.sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
    }
    if (streamFilter === "without-clips") {
      return sorted.filter((stream) => {
        const title = (stream.title || "").toLowerCase();
        return !clips.some((clip) => {
          const clipTitle = (clip.title || "").toLowerCase();
          return clipTitle && title && (clipTitle.includes(title) || title.includes(clipTitle));
        });
      });
    }
    return sorted;
  }, [clips, streamFilter, streams]);

  const summaryItems = [
    { label: "Средний онлайн", value: `${formatCompactNumber(averageOnline)} зрителя` },
    { label: "Пик прошлого эфира", value: `${formatCompactNumber(peakLastStream)} зрителей` },
    { label: "Лучшее окно", value: "19:30-21:00" },
  ];

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
            <Pill>{profile.platform.toUpperCase()}</Pill>
            <h1>Центр управления эфиром</h1>
            <p>Один рабочий экран для подготовки эфира, истории трансляций, клипов и следующего полезного шага.</p>
            <div className="hero-tags">
              <span className={`status-pill ${isOnline ? "online" : "offline"}`}>
                <Radio size={14} />
                {heroStatus}
              </span>
              <span className="pill">Последний эфир: {lastStreamDuration}</span>
            </div>
            <div className="dashboard-summary-grid">
              {summaryItems.map((item) => (
                <div key={item.label} className="dashboard-summary-chip">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="header-actions dashboard-hero-actions">
            <PrimaryButton onClick={() => navigate("/announcements")}>Подготовить анонс</PrimaryButton>
            <GhostButton onClick={() => navigate("/analytics")}>Открыть AI-подсказки</GhostButton>
          </div>
        </header>

        <section className="card dashboard-next-step-card">
          <div>
            <div className="section-title">
              <span className="section-icon"><Sparkles size={16} /></span>
              <span>Следующий шаг</span>
            </div>
            <p className="dashboard-next-step-copy">{nextStep}</p>
          </div>
          <GhostButton onClick={() => navigate("/integrations")}>Открыть интеграции <ArrowRight size={14} /></GhostButton>
        </section>

        <section className="stats dashboard-stat-grid">
          <StatCard
            label="Средний онлайн за 30 дней"
            value={`${formatCompactNumber(averageOnline)}`}
            trend={peakLastStream > averageOnline ? `Пик прошлого эфира ${formatCompactNumber(peakLastStream)}` : "Данные появятся после первого завершённого эфира"}
            trendDirection={peakLastStream > averageOnline ? "up" : "neutral"}
            icon={<Users size={16} />}
          />
          <StatCard
            label={audienceLabel}
            value={`${formatCompactNumber(audienceValue)}`}
            trend={audienceValue > 0 ? "Канал набирает аудиторию" : "Рост станет заметнее после следующего эфира"}
            trendDirection={audienceValue > 0 ? "up" : "neutral"}
            icon={<Activity size={16} />}
          />
          <StatCard
            label="Последний эфир"
            value={lastStreamDuration}
            trend={lastStream ? `${formatStreamDate(lastStream.published_at)} · пик ${formatCompactNumber(lastStream.view_count ?? peakLastStream)} зрителей` : "Когда завершится первый эфир, здесь появится краткая сводка"}
            trendDirection="neutral"
            icon={<Clock3 size={16} />}
          />
        </section>

        <section className="sections dashboard-sections-grid">
          <SectionCard title="История эфиров" icon={<Video size={16} />}>
            <div className="bar-chart dashboard-mini-chart">
              {streamSeries.length === 0 ? <div className="empty">Данные появятся после первого завершённого эфира</div> : null}
              {streamSeries.map((item) => (
                <div key={item.date} className="bar">
                  <div className="bar-fill" style={{ height: `${(item.count / maxCount) * 100}%` }} />
                  <span>{item.date.slice(5)}</span>
                </div>
              ))}
            </div>
            <div className="filter-row">
              {streamFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`filter-chip${streamFilter === filter.value ? " active" : ""}`}
                  onClick={() => setStreamFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="dashboard-stream-list">
              {filteredStreams.length === 0 ? (
                <div className="empty dashboard-empty-block">
                  <strong>История появится после первого эфира</strong>
                  <span>После первого завершённого стрима здесь будут карточки эфиров, пики, длительность и быстрые действия.</span>
                </div>
              ) : (
                filteredStreams.slice(0, 4).map((stream, index) => (
                  <article key={`${stream.url || stream.title || "stream"}-${index}`} className="dashboard-stream-row">
                    <div>
                      <strong>{stream.title || "Эфир без названия"}</strong>
                      <p>
                        {formatStreamDate(stream.published_at)} · {formatLegacyDuration(stream.duration)} · пик {formatCompactNumber(stream.view_count ?? peakLastStream)} зрителей
                        {clips.length ? ` · ${Math.min(clips.length, 3)} клипа` : ""}
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

          <SectionCard title="Клипы" icon={<Film size={16} />}>
            <div className="dashboard-clip-list">
              {clips.length === 0 ? (
                <div className="empty dashboard-empty-block">
                  <strong>Клипы появятся после завершения эфира</strong>
                  <span>После первого стрима вы сможете сохранять лучшие моменты и делиться ими.</span>
                  <GhostButton onClick={() => navigate("/info")}>Перейти к истории эфиров</GhostButton>
                </div>
              ) : (
                clips.slice(0, 3).map((clip, index) => (
                  <article key={`${clip.url || clip.title || "clip"}-${index}`} className="dashboard-clip-card">
                    <div>
                      <strong>{clip.title || "Лучший момент эфира"}</strong>
                      <p>{clip.creator ? `Автор: ${clip.creator} · ` : ""}{formatCompactNumber(clip.view_count ?? 0)} просмотров</p>
                    </div>
                    <GhostButton onClick={() => window.open(clip.url, "_blank", "noreferrer")}>Открыть клип</GhostButton>
                  </article>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Оффлайн-помощь" icon={<Flame size={16} />}>
            <div className="dashboard-helper-stack">
              <div className="dashboard-helper-card">
                <strong>Что сделать до старта</strong>
                <ul className="dashboard-checklist">
                  <li>Подготовить анонс</li>
                  <li>Скопировать ссылку</li>
                  <li>Отправить в Telegram</li>
                  <li>Проверить донаты и уведомления</li>
                </ul>
              </div>
              <div className="dashboard-helper-card muted">
                <strong>Полезно оффлайн</strong>
                <p>Лучшее окно сегодня: 19:30-21:00. Если хотите собрать аудиторию заранее, отправьте анонс за 30 минут до старта.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Лента событий" icon={<Bell size={16} />}>
            <div className="dashboard-event-list">
              {notifications.length === 0 ? (
                <div className="empty dashboard-empty-block">
                  <strong>Пока мало событий</strong>
                  <span>Создайте первое уведомление о старте эфира, чтобы зрители получили напоминание вовремя.</span>
                  <GhostButton onClick={() => navigate("/announcements")}>Создать уведомление</GhostButton>
                </div>
              ) : (
                notifications.slice(0, 4).map((note) => (
                  <article key={note.created_at} className="dashboard-event-row">
                    <strong>{note.title}</strong>
                    <p>{note.body || "Системное событие сохранено в ленте активности."}</p>
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
