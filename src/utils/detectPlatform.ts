export type Platform = "twitch" | "youtube" | "vklive";

const KNOWN_DOMAINS = ["twitch.tv", "youtube.com", "youtu.be", "vkplay.live", "vkplay.ru", "vk.com"];

export function normalizeChannelUrl(input: string): string {
  const raw = input.trim();
  if (!raw) return raw;

  const lower = raw.toLowerCase();
  const withScheme = (value: string) => (value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`);

  if (KNOWN_DOMAINS.some((domain) => lower.includes(domain))) {
    return withScheme(raw);
  }

  if (raw.startsWith("@")) {
    return `https://youtube.com/${raw}`;
  }

  if (raw.startsWith("UC") && raw.length > 10) {
    return `https://youtube.com/channel/${raw}`;
  }

  if (raw.includes("/")) {
    return withScheme(raw);
  }

  return `https://twitch.tv/${raw}`;
}

export function detectPlatform(url: string): Platform {
  const normalized = url.toLowerCase();
  if (normalized.includes("twitch.tv")) return "twitch";
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) return "youtube";
  if (normalized.includes("vkplay.live") || normalized.includes("vkplay.ru") || normalized.includes("vk.com")) return "vklive";
  throw new Error("Не удалось определить платформу");
}

export function extractChannelName(url: string): string {
  try {
    const parsed = new URL(normalizeChannelUrl(url));
    const path = parsed.pathname.replace(/\/+/, "/").replace(/\/$/, "");
    if (!path || path === "/") return "channel";
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "channel";
  } catch {
    return "channel";
  }
}
