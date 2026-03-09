export const OWNER_TELEGRAM_ID = "6983727854";
export const OWNER_TELEGRAM_ID_STORAGE_KEY = "owner_telegram_id";
export const ADMIN_ROLES = new Set(["owner", "moderator"]);

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          id?: number;
        };
      };
    };
  };
};

export function getCurrentTelegramId(): string | null {
  if (typeof window === "undefined") return null;
  const id = (window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user?.id;
  return typeof id === "number" ? String(id) : null;
}

export function isOwnerTelegramId(id: string | null): boolean {
  return Boolean(id) && id === OWNER_TELEGRAM_ID;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return Boolean(role) && ADMIN_ROLES.has(String(role));
}

export function hasAdminSession(currentTelegramId: string | null): boolean {
  if (typeof window === "undefined") return false;
  const authed = sessionStorage.getItem("admin_auth") === "true";
  const token = sessionStorage.getItem("admin_token");
  const sessionTelegramId = sessionStorage.getItem("admin_telegram_id");
  if (!authed || !token) return false;
  if (!currentTelegramId) return false;
  return sessionTelegramId === currentTelegramId;
}

export function setLocalOwnerTelegramId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OWNER_TELEGRAM_ID_STORAGE_KEY, id);
}
