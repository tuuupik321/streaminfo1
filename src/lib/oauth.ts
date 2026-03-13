import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export type OAuthPlatform = "twitch" | "youtube" | "donatealerts";

export type OAuthProviderConfig = Record<OAuthPlatform, boolean>;

export type OAuthResult = {
  status: "success" | "error";
  platform: OAuthPlatform;
  message: string;
  primary: boolean;
};

type OAuthRedirectPayload = OAuthResult & {
  returnPath: string;
};

const OAUTH_RESULT_STORAGE_KEY = "streamfly_oauth_result_v1";
const OAUTH_RESULT_EVENT = "streamfly-oauth-result";
const OAUTH_QUERY_KEYS = ["oauth_status", "oauth_platform", "oauth_message", "oauth_primary"] as const;
const CANONICAL_APP_ORIGIN = "https://straminfoapp.ru";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      openLink?: (url: string) => void;
      initDataUnsafe?: {
        start_param?: string;
      };
    };
  };
};

function normalizePlatform(value: string | null): OAuthPlatform | null {
  if (value === "twitch" || value === "youtube" || value === "donatealerts") {
    return value;
  }
  return null;
}

function buildStartUrl({
  platform,
  userId,
  initData,
  primary,
  returnPath,
  mode,
}: {
  platform: OAuthPlatform;
  userId: string | number;
  initData?: string | null;
  primary: boolean;
  returnPath: string;
  mode: "popup" | "redirect" | "native" | "telegram";
}) {
  const url = new URL(`/api/oauth/${platform}/start`, getOAuthApiOrigin());
  url.searchParams.set("user_id", String(userId));
  url.searchParams.set("primary", primary ? "1" : "0");
  url.searchParams.set("return_path", returnPath);
  url.searchParams.set("mode", mode);
  if (initData) {
    url.searchParams.set("init_data", initData);
  }
  return url.toString();
}

function getOAuthApiOrigin() {
  if (import.meta.env.DEV) {
    return window.location.origin;
  }

  const currentOrigin = window.location.origin;
  const currentProtocol = window.location.protocol.toLowerCase();

  if (!currentProtocol.startsWith("http")) {
    return CANONICAL_APP_ORIGIN;
  }

  if (currentOrigin.includes("hf.space")) {
    return CANONICAL_APP_ORIGIN;
  }

  return currentOrigin;
}

function isTelegramMiniApp() {
  const tg = (window as TelegramWindow).Telegram?.WebApp;
  return Boolean(tg?.initData);
}

function parseOAuthResult(searchParams: URLSearchParams): OAuthResult | null {
  const status = searchParams.get("oauth_status");
  const platform = normalizePlatform(searchParams.get("oauth_platform"));
  if ((status !== "success" && status !== "error") || !platform) {
    return null;
  }
  return {
    status,
    platform,
    message: searchParams.get("oauth_message") || "",
    primary: searchParams.get("oauth_primary") === "1",
  };
}

function normalizeOAuthRedirectPayload(payload: unknown): OAuthRedirectPayload | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as {
    oauth_status?: string;
    oauth_platform?: string;
    oauth_message?: string;
    oauth_primary?: string;
    return_path?: string;
  };
  const platform = normalizePlatform(candidate.oauth_platform ?? null);
  if (!platform || (candidate.oauth_status !== "success" && candidate.oauth_status !== "error")) {
    return null;
  }
  return {
    status: candidate.oauth_status,
    platform,
    message: candidate.oauth_message || "",
    primary: candidate.oauth_primary === "1",
    returnPath: candidate.return_path || "/integrations",
  };
}

function clearOAuthQueryParams() {
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of OAUTH_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }
}

export function storeOAuthResult(result: OAuthResult) {
  window.localStorage.setItem(OAUTH_RESULT_STORAGE_KEY, JSON.stringify(result));
}

export function popStoredOAuthResult(): OAuthResult | null {
  try {
    const raw = window.localStorage.getItem(OAUTH_RESULT_STORAGE_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(OAUTH_RESULT_STORAGE_KEY);
    const parsed = JSON.parse(raw) as Partial<OAuthResult>;
    if (!parsed || (parsed.status !== "success" && parsed.status !== "error")) return null;
    const platform = normalizePlatform(parsed.platform ?? null);
    if (!platform) return null;
    return {
      status: parsed.status,
      platform,
      message: parsed.message || "",
      primary: Boolean(parsed.primary),
    };
  } catch {
    window.localStorage.removeItem(OAUTH_RESULT_STORAGE_KEY);
    return null;
  }
}

export function consumeOAuthResultFromLocation(): OAuthResult | null {
  const result = parseOAuthResult(new URLSearchParams(window.location.search));
  if (!result) return null;
  clearOAuthQueryParams();
  return result;
}

function getTelegramStartParam(): string | null {
  const queryValue = new URL(window.location.href).searchParams.get("tgWebAppStartParam");
  if (queryValue) return queryValue;
  const tg = (window as TelegramWindow).Telegram?.WebApp;
  return tg?.initDataUnsafe?.start_param || null;
}

async function fetchOAuthRedirectPayload(ticket: string): Promise<OAuthRedirectPayload | null> {
  try {
    const response = await fetch(`${getOAuthApiOrigin()}/api/oauth/result?ticket=${encodeURIComponent(ticket)}`);
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    return normalizeOAuthRedirectPayload(payload);
  } catch {
    return null;
  }
}

export async function consumeOAuthRedirectFromTelegramStartParam(): Promise<string | null> {
  const startParam = getTelegramStartParam();
  if (!startParam || !startParam.startsWith("oauth_")) {
    return null;
  }

  const ticket = startParam.slice("oauth_".length);
  if (!ticket) return null;

  const payload = await fetchOAuthRedirectPayload(ticket);
  if (!payload) return null;

  const url = new URL(payload.returnPath || "/integrations", window.location.origin);
  url.searchParams.set("oauth_status", payload.status);
  url.searchParams.set("oauth_platform", payload.platform);
  if (payload.message) {
    url.searchParams.set("oauth_message", payload.message);
  }
  url.searchParams.set("oauth_primary", payload.primary ? "1" : "0");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function subscribeToOAuthResults(handler: (result: OAuthResult) => void) {
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const payload = (event.data as { type?: string; payload?: OAuthResult } | null)?.payload;
    if ((event.data as { type?: string } | null)?.type !== OAUTH_RESULT_EVENT || !payload) return;
    const platform = normalizePlatform(payload.platform);
    if (!platform || (payload.status !== "success" && payload.status !== "error")) return;
    handler({
      status: payload.status,
      platform,
      message: payload.message || "",
      primary: Boolean(payload.primary),
    });
  };

  const onCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<OAuthResult>).detail;
    if (!detail) return;
    const platform = normalizePlatform(detail.platform);
    if (!platform || (detail.status !== "success" && detail.status !== "error")) return;
    handler({
      status: detail.status,
      platform,
      message: detail.message || "",
      primary: Boolean(detail.primary),
    });
  };

  window.addEventListener("message", onMessage);
  window.addEventListener(OAUTH_RESULT_EVENT, onCustomEvent as EventListener);
  return () => {
    window.removeEventListener("message", onMessage);
    window.removeEventListener(OAUTH_RESULT_EVENT, onCustomEvent as EventListener);
  };
}

export async function fetchOAuthProviderConfig(): Promise<OAuthProviderConfig> {
  const response = await fetch(`${getOAuthApiOrigin()}/api/oauth/providers`);
  const data = (await response.json().catch(() => ({}))) as Partial<OAuthProviderConfig>;
  return {
    twitch: Boolean(data.twitch),
    youtube: Boolean(data.youtube),
    donatealerts: Boolean(data.donatealerts),
  };
}

export async function startOAuthConnection({
  platform,
  userId,
  initData,
  primary = false,
  returnPath,
}: {
  platform: OAuthPlatform;
  userId: string | number;
  initData?: string | null;
  primary?: boolean;
  returnPath: string;
}) {
  if (Capacitor.isNativePlatform()) {
    const url = buildStartUrl({
      platform,
      userId,
      initData,
      primary,
      returnPath,
      mode: "native",
    });
    await Browser.open({ url });
    return;
  }

  if (isTelegramMiniApp()) {
    const url = buildStartUrl({
      platform,
      userId,
      initData,
      primary,
      returnPath,
      mode: "telegram",
    });
    const telegramWebApp = (window as TelegramWindow).Telegram?.WebApp;
    if (typeof telegramWebApp?.openLink === "function") {
      telegramWebApp.openLink(url);
      return;
    }
    window.location.assign(url);
    return;
  }

  const popupUrl = buildStartUrl({
    platform,
    userId,
    initData,
    primary,
    returnPath,
    mode: "popup",
  });

  const width = 520;
  const height = 760;
  const left = Math.max(40, Math.round(window.screenX + window.outerWidth / 2 - width / 2));
  const top = Math.max(40, Math.round(window.screenY + window.outerHeight / 2 - height / 2));
  const popup = window.open(
    popupUrl,
    "streamfly-oauth",
    `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );

  if (!popup) {
    window.location.assign(
      buildStartUrl({
        platform,
        userId,
        initData,
        primary,
        returnPath,
        mode: "redirect",
      }),
    );
  }
}

