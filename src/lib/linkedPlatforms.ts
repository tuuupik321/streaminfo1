export type LinkedPlatform = "twitch" | "youtube" | "donationalerts";

const STORAGE_KEY = "linked_accounts";

type StoredAccount = {
  platform: LinkedPlatform;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getLinkedPlatforms(): LinkedPlatform[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAccount[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => item?.platform)
      .filter((platform): platform is LinkedPlatform =>
        platform === "twitch" || platform === "youtube" || platform === "donationalerts",
      );
  } catch {
    return [];
  }
}

/** Returns true if at least one streaming platform (Twitch or YouTube) is linked */
export function hasAnyStreamingPlatform(): boolean {
  const platforms = new Set(getLinkedPlatforms());
  return platforms.has("twitch") || platforms.has("youtube");
}

/** @deprecated Use hasAnyStreamingPlatform instead */
export function hasRequiredStatsIntegrations() {
  return hasAnyStreamingPlatform();
}
