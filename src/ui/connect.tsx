import { useState } from "react";
import { Link } from "react-router-dom";
import { PrimaryButton } from "./components";

const benefitCards = [
  {
    title: "Рабочий дашборд",
    text: "Главная с оффлайн-подсказками, следующими шагами и быстрыми действиями для эфира.",
  },
  {
    title: "История и аналитика",
    text: "Эфиры, клипы и базовая аналитика появятся без ручной настройки карточек и блоков.",
  },
  {
    title: "Гибкий старт",
    text: "Сначала подключаем канал, а Telegram и донаты можно добавить позже в один тап.",
  },
];

export function ConnectScreen({ onConnect }: { onConnect: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isDev = import.meta.env.DEV;

  return (
    <div className="connect-screen">
      <div className="connect-card">
        <div className="connect-orbit connect-orbit-left" />
        <div className="connect-orbit connect-orbit-right" />

        <div className="connect-header">
          <span className="connect-badge">Быстрый старт</span>
          <h1>Подключите канал и получите рабочий экран за минуту</h1>
          <p>Вставьте ссылку на Twitch или YouTube. Мы соберем стартовый дашборд, историю эфиров и базовые сценарии без ручной настройки.</p>
        </div>

        <div className="connect-utility-row">
          <span className="platform-pill twitch"><span className="platform-dot" />Twitch</span>
          <span className="platform-pill youtube"><span className="platform-dot" />YouTube</span>
          <span className="platform-pill neutral"><span className="platform-dot neutral-dot" />Можно сменить позже</span>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            if (!url.trim()) {
              setError("Введите ссылку на канал");
              return;
            }
            onConnect(url.trim());
          }}
        >
          <label className="input-label" htmlFor="channel-url">
            Ссылка на Twitch или YouTube
          </label>
          <input
            id="channel-url"
            className="input"
            placeholder="twitch.tv/... или youtube.com/..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <div className="connect-form-hint">Поддерживаются полные ссылки и короткие адреса канала.</div>
          {error ? <div className="form-error">{error}</div> : null}
          <PrimaryButton type="submit">Продолжить</PrimaryButton>
        </form>

        <div className="connect-inline-note">
          <strong>Что появится после подключения</strong>
          <span>Главная с оффлайн-помощью, история эфиров, анонсы и базовая аналитика для старта.</span>
        </div>

        <div className="connect-highlights">
          {benefitCards.map((item) => (
            <article key={item.title} className="connect-highlight">
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </article>
          ))}
        </div>

        <div className="connect-next-step">
          <div>
            <strong>Следующий шаг</strong>
            <span>После канала стоит подключить Telegram, чтобы публиковать ссылку на эфир и заранее собирать зрителей.</span>
          </div>
          {isDev ? (
            <Link to="/design-agent" className="connect-next-step-link">
              Открыть пример экрана
            </Link>
          ) : (
            <span className="connect-next-step-badge">Сначала подключаем канал</span>
          )}
        </div>

        {isDev ? (
          <div className="connect-preview">
            <div>
              <strong>Локальный просмотр</strong>
              <span>Можно сразу открыть тестовый экран на localhost или перейти в режим оформления без реального подключения канала.</span>
            </div>
            <div className="connect-preview-actions">
              <Link to="/design-agent" className="connect-preview-link">
                Открыть экран дизайна
              </Link>
              <button
                type="button"
                className="connect-preview-link"
                onClick={() => onConnect("https://twitch.tv/local-preview")}
              >
                Открыть тестовый дашборд
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
