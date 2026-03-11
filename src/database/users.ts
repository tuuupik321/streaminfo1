import type { Platform } from "../utils/detectPlatform";

export type UserProfile = {
  platform: Platform;
  channel_url: string;
  channel_name: string;
  connected: boolean;
};

const STORAGE_KEY = "streamer_profile_v1";

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
