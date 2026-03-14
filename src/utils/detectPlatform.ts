export type Platform = "twitch" | "youtube" | "vklive";

export function detectPlatform(url: string): Platform {
  const normalized = url.toLowerCase();
  if (normalized.includes("twitch.tv")) return "twitch";
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) return "youtube";
  if (normalized.includes("vkplay.live") || normalized.includes("vkplay.ru") || normalized.includes("vk.com")) return "vklive";
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
