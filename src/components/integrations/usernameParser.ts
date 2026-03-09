import type { LinkedAccount } from "./types";

const USERNAME_RULES: Record<LinkedAccount["platform"], RegExp> = {
  twitch: /^[A-Za-z0-9_]{4,25}$/,
  youtube: /^[A-Za-z0-9_.-]{3,100}$/,
  donationalerts: /^[A-Za-z0-9_.-]{3,50}$/,
};

export const sanitizeUsername = (value: string) => value.trim().replace(/^@+/, "");

export const isValidUsername = (value: string, platform: LinkedAccount["platform"]) =>
  USERNAME_RULES[platform].test(sanitizeUsername(value));

const normalizeUrlInput = (value: string) =>
  /^https?:\/\//i.test(value) ? value : `https://${value}`;

export const extractFromUrl = (rawUrl: string, platform: LinkedAccount["platform"]): { username: string | null; error?: string } => {
  try {
    const url = new URL(normalizeUrlInput(rawUrl));
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean);

    if (platform === "twitch") {
      if (!["twitch.tv", "m.twitch.tv"].includes(host)) {
        return { username: null, error: "Используй ссылку с twitch.tv (например, https://twitch.tv/username)" };
      }
      if (parts.length === 0) return { username: null, error: "Не найден никнейм в ссылке" };
      const candidate = sanitizeUsername(parts[0]);
      return isValidUsername(candidate, platform) ? { username: candidate } : { username: null, error: "Некорректный никнейм Twitch" };
    }

    if (platform === "youtube") {
      if (!["youtube.com", "m.youtube.com"].includes(host)) {
        return { username: null, error: "Используй ссылку с youtube.com (например, https://youtube.com/@username)" };
      }
      let candidate = "";
      if (parts[0]?.startsWith("@")) {
        candidate = sanitizeUsername(parts[0]);
      } else if (["channel", "c", "user"].includes(parts[0]) && parts[1]) {
        candidate = sanitizeUsername(parts[1]);
      }
      if (!candidate) return { username: null, error: "Не найден канал в ссылке YouTube" };
      return isValidUsername(candidate, platform) ? { username: candidate } : { username: null, error: "Некорректный ID канала YouTube" };
    }

    if (platform === "donationalerts") {
      if (!["donationalerts.com", "www.donationalerts.com"].includes(host)) {
        return { username: null, error: "Используй ссылку с donationalerts.com" };
      }
      if (parts.length === 0) return { username: null, error: "Не найден никнейм в ссылке" };
      const candidate = sanitizeUsername(parts[0] === "r" ? parts[1] ?? "" : parts[0]);
      return isValidUsername(candidate, platform) ? { username: candidate } : { username: null, error: "Некорректный никнейм DonationAlerts" };
    }

    return { username: null, error: "Неподдерживаемая платформа" };
  } catch {
    return { username: null, error: "Некорректная ссылка" };
  }
};

export const parseUsernameOrLink = (value: string, platform: LinkedAccount["platform"]): { username: string | null; error?: string } => {
  const trimmed = value.trim();
  if (!trimmed) return { username: null, error: "Введи ссылку или никнейм" };

  const looksLikeUrl = /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed) || trimmed.includes("/");
  if (looksLikeUrl) return extractFromUrl(trimmed, platform);

  const username = sanitizeUsername(trimmed);
  return isValidUsername(username, platform) ? { username } : { username: null, error: "Некорректный никнейм" };
};
