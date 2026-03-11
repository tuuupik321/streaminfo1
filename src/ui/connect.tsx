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
          <span className="connect-badge">Streamer Onboarding</span>
          <h1>Подключите ваш канал</h1>
          <p>Вставьте ссылку на Twitch или YouTube канал, и мы настроим панель автоматически.</p>
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
            Вставьте ссылку на Twitch или YouTube канал
          </label>
          <input
            id="channel-url"
            className="input"
            placeholder="https://twitch.tv/yourname или https://youtube.com/@channel"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          {error ? <div className="form-error">{error}</div> : null}
          <PrimaryButton type="submit">Подключить канал</PrimaryButton>
        </form>
        <div className="connect-foot">
          <span className="platform-pill twitch"><span className="platform-dot" />Twitch</span>
          <span className="platform-pill youtube"><span className="platform-dot" />YouTube</span>
        </div>
        <div className="connect-highlights">
          <article className="connect-highlight">
            <strong>Live Pulse</strong>
            <span>Покажет активность чата и пиковые моменты в реальном времени.</span>
          </article>
          <article className="connect-highlight">
            <strong>Auto Scenes</strong>
            <span>Соберет рабочий дашборд без ручной настройки виджетов.</span>
          </article>
        </div>
        {isDev ? (
          <div className="connect-preview">
            <div>
              <strong>Локальный preview</strong>
              <span>Открой изменяемую страницу сразу на localhost или зайди в demo-режим без ручного подключения канала.</span>
            </div>
            <div className="connect-preview-actions">
              <Link to="/design-agent" className="connect-preview-link">
                Открыть Design Agent
              </Link>
              <button
                type="button"
                className="connect-preview-link"
                onClick={() => onConnect("https://twitch.tv/local-preview")}
              >
                Открыть demo dashboard
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
