import { useState } from "react";
import { Link } from "react-router-dom";
import { PrimaryButton } from "./components";

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
          <h1>Подключите ваш канал</h1>
          <p>Вставьте ссылку на Twitch или YouTube, а мы соберем стартовый дашборд и базовые блоки автоматически.</p>
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
            placeholder="https://twitch.tv/yourname или https://youtube.com/@channel"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          {error ? <div className="form-error">{error}</div> : null}
          <PrimaryButton type="submit">Продолжить</PrimaryButton>
        </form>
        <div className="connect-foot">
          <span className="platform-pill twitch"><span className="platform-dot" />Twitch</span>
          <span className="platform-pill youtube"><span className="platform-dot" />YouTube</span>
        </div>
        <div className="connect-highlights">
          <article className="connect-highlight">
            <strong>Пульс эфира</strong>
            <span>Покажет активность чата, всплески вовлеченности и заметные моменты по ходу стрима.</span>
          </article>
          <article className="connect-highlight">
            <strong>Готовые блоки</strong>
            <span>Соберет аккуратный рабочий экран без ручной настройки карточек и виджетов.</span>
          </article>
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
