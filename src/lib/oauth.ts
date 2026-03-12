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

const OAUTH_RESULT_STORAGE_KEY = "streamfly_oauth_result_v1";
const OAUTH_RESULT_EVENT = "streamfly-oauth-result";
const OAUTH_QUERY_KEYS = ["oauth_status", "oauth_platform", "oauth_message", "oauth_primary"] as const;

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
  mode: "popup" | "redirect" | "native";
}) {
  const url = new URL(`/api/oauth/${platform}/start`, window.location.origin);
  url.searchParams.set("user_id", String(userId));
  url.searchParams.set("primary", primary ? "1" : "0");
  url.searchParams.set("return_path", returnPath);
  url.searchParams.set("mode", mode);
  if (initData) {
    url.searchParams.set("init_data", initData);
  }
  return url.toString();
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
  const response = await fetch("/api/oauth/providers");
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
