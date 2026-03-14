import type { Platform } from "../utils/detectPlatform";
import { twitchTheme } from "../platforms/twitch";
import { youtubeTheme } from "../platforms/youtube";
import { vkLiveTheme } from "../platforms/vklive";

export type PlatformTheme = {
  platform: Platform;
  name: string;
  colors: {
    accent: string;
    bg: string;
  };
  sections: string[];
};

export function getThemeByPlatform(platform: Platform): PlatformTheme {
  if (platform === "youtube") return youtubeTheme;
  if (platform === "vklive") return vkLiveTheme;
  return twitchTheme;
}
