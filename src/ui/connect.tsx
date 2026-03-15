import { useEffect, useMemo, useState } from "react";
import { PrimaryButton } from "./components";
import {
  consumeOAuthResultFromLocation,
  fetchOAuthProviderConfig,
  popStoredOAuthResult,
  startOAuthConnection,
  subscribeToOAuthResults,
  type OAuthPlatform,
  type OAuthProviderConfig,
  type OAuthResult,
} from "../lib/oauth";

const channelOAuthPlatforms: Array<{
  platform: OAuthPlatform;
  label: string;
  helper: string;
  className: string;
}> = [
  {
    platform: "twitch",
    label: "Подключить Twitch",
    helper: "Откроем окно Twitch, где можно сразу дать доступ и вернуться обратно в приложение.",
    className: "twitch",
  },
  {
    platform: "youtube",
    label: "Подключить YouTube",
    helper: "Откроем Google/YouTube в отдельном окне и после подтверждения вернём вас на главный экран.",
    className: "youtube",
  },
];

const defaultProviderConfig: OAuthProviderConfig = {
  twitch: false,
  youtube: false,
  donatealerts: false,
};

type ConnectScreenProps = {
  onConnect: (url: string) => void;
  onOAuthConnected?: () => Promise<void> | void;
  userId: string | number;
  initData?: string | null;
};

function mapOAuthResultMessage(result: OAuthResult) {
  if (result.status === "success") {
    if (result.platform === "twitch") {
      return "Twitch подключён. Собираем главный экран и подтягиваем канал.";
    }
    if (result.platform === "youtube") {
      return "YouTube подключён. Возвращаем вас в приложение и подтягиваем данные канала.";
    }
    return "Подключение выполнено. Продолжаем настройку внутри приложения.";
  }
  return result.message || "Не удалось завершить подключение. Попробуйте ещё раз.";
}

export function ConnectScreen({ onConnect, onOAuthConnected, userId, initData }: ConnectScreenProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);
  const [providerConfig, setProviderConfig] = useState<OAuthProviderConfig>(defaultProviderConfig);
  const [providerLoading, setProviderLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<OAuthPlatform | null>(null);

  const availableOAuthPlatforms = useMemo(
    () => channelOAuthPlatforms.filter((item) => providerConfig[item.platform]),
    [providerConfig],
  );

  useEffect(() => {
    let active = true;

    const loadProviders = async () => {
      try {
        const config = await fetchOAuthProviderConfig();
        if (active) {
          setProviderConfig(config);
        }
      } catch {
        if (active) {
          setProviderConfig(defaultProviderConfig);
        }
      } finally {
        if (active) {
          setProviderLoading(false);
        }
      }
    };

    void loadProviders();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const handleResult = async (result: OAuthResult) => {
      if (!active) return;
      setConnectingPlatform(null);
      setError(result.status === "error" ? mapOAuthResultMessage(result) : null);
      setOauthMessage(mapOAuthResultMessage(result));
      if (result.status === "success" && onOAuthConnected) {
        await onOAuthConnected();
      }
    };

    const immediateResult = consumeOAuthResultFromLocation() || popStoredOAuthResult();
    if (immediateResult) {
      void handleResult(immediateResult);
    }

    const unsubscribe = subscribeToOAuthResults((result) => {
      void handleResult(result);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [onOAuthConnected]);

  const startPlatformConnect = async (platform: OAuthPlatform) => {
    if (!providerConfig[platform]) {
      setError("Этот способ подключения ещё не настроен на сервере.");
      return;
    }
    try {
      setError(null);
      setOauthMessage(null);
      setConnectingPlatform(platform);
      await startOAuthConnection({
        platform,
        userId,
        initData,
        primary: true,
        returnPath: "/",
      });
    } catch {
      setConnectingPlatform(null);
      setError("Не удалось открыть окно авторизации. Попробуйте ещё раз.");
    }
  };

  return (
    <div className="connect-screen">
      <div className="connect-card">

        <div className="connect-header">
          <h1>Подключите канал и соберите стартовый экран за минуту</h1>
          <p>
            Проще всего зайти через Twitch или YouTube: откроем официальное окно платформы, вы дадите доступ и сразу вернётесь обратно в приложение уже с привязанным каналом.
          </p>
        </div>

        
        <div className="connect-oauth-block">
          <div className="connect-oauth-header">
            <strong>Подключить канал через платформу</strong>
            <span>Окно авторизации откроется прямо сейчас, а после подтверждения мы вернём вас обратно в приложение.</span>
          </div>

          <div className="connect-oauth-grid">
            {availableOAuthPlatforms.map((item) => (
              <button
                key={item.platform}
                type="button"
                className={`connect-oauth-button ${item.className}`}
                onClick={() => void startPlatformConnect(item.platform)}
                disabled={connectingPlatform !== null}
              >
                <span className="connect-oauth-title">
                  {connectingPlatform === item.platform ? "Открываем окно..." : item.label}
                </span>
                <span className="connect-oauth-helper">{item.helper}</span>
              </button>
            ))}
          </div>

          {providerLoading ? (
            <div className="connect-oauth-note">Проверяем доступные способы подключения...</div>
          ) : availableOAuthPlatforms.length === 0 ? (
            <div className="connect-oauth-note">
              OAuth-подключение пока не настроено на сервере. Ниже можно подключить канал вручную по ссылке.
            </div>
          ) : (
            <div className="connect-oauth-note">
              После привязки канала донаты и Telegram можно добавить в разделе интеграций без повторной настройки приложения.
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setOauthMessage(null);
            if (!url.trim()) {
              setError("Введите ссылку на канал");
              return;
            }
            onConnect(url.trim());
          }}
        >
          <label className="input-label" htmlFor="channel-url">
            Или вставьте ссылку вручную
          </label>
          <input
            id="channel-url"
            className="input"
            placeholder="twitch.tv/username или youtube.com/@channel или vkplay.live/username"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <div className="connect-form-hint">Поддерживаются полные ссылки и короткий адрес канала.</div>
          {error ? <div className="form-error">{error}</div> : null}
          {oauthMessage ? <div className="connect-success">{oauthMessage}</div> : null}
          <PrimaryButton type="submit">Продолжить по ссылке</PrimaryButton>
        </form>
      </div>
    </div>
  );
}



