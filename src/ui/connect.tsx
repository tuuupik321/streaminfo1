import { useState } from "react";
import { PrimaryButton } from "./components";

export function ConnectScreen({ onConnect }: { onConnect: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="connect-screen">
      <div className="connect-card">
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
      </div>
    </div>
  );
}

