import type { Platform } from "../utils/detectPlatform";

export type UserProfile = {
  platform: Platform;
  channel_url: string;
  channel_name: string;
  connected: boolean;
};

const STORAGE_KEY = "streamer_profile_v1";
const USER_ID_KEY = "streamer_user_id";

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

export function getOrCreateUserId(): string {
  const existing = window.localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  const id = value.toString();
  window.localStorage.setItem(USER_ID_KEY, id);
  return id;
}
