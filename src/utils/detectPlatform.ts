export type Platform = "twitch" | "youtube";

export function detectPlatform(url: string): Platform {
  const normalized = url.toLowerCase();
  if (normalized.includes("twitch.tv")) return "twitch";
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) return "youtube";
  throw new Error("Не удалось определить платформу");
}

export function extractChannelName(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+/, "/").replace(/\/$/, "");
    if (!path || path === "/") return "channel";
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "channel";
  } catch {
    return "channel";
  }
}
