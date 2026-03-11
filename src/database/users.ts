import type { Platform } from "../utils/detectPlatform";

export type UserProfile = {
  platform: Platform;
  channel_url: string;
  channel_name: string;
  connected: boolean;
};

const STORAGE_KEY = "streamer_profile_v1";
const USER_ID_KEY = "streamer_user_id";
const INT64_MAX = 9223372036854775807n;

export function getUserProfile(): UserProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearUserProfile(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

function normalizeUserId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = typeof value === "string" ? value.trim() : String(value);
  if (!raw) return null;
  try {
    const parsed = BigInt(raw);
    if (parsed <= 0n || parsed > INT64_MAX) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function createSafeRandomUserId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  value &= INT64_MAX;
  if (value === 0n) {
    value = 1n;
  }
  return value.toString();
}

export function getOrCreateUserId(preferredId?: string | number | bigint | null): string {
  const preferred = normalizeUserId(preferredId);
  if (preferred) {
    window.localStorage.setItem(USER_ID_KEY, preferred);
    return preferred;
  }

  const existing = normalizeUserId(window.localStorage.getItem(USER_ID_KEY));
  if (existing) {
    window.localStorage.setItem(USER_ID_KEY, existing);
    return existing;
  }

  const id = createSafeRandomUserId();
  window.localStorage.setItem(USER_ID_KEY, id);
  return id;
}
