import type { Platform } from "../utils/detectPlatform";
import { twitchTheme } from "../platforms/twitch";
import { youtubeTheme } from "../platforms/youtube";

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
  return platform === "youtube" ? youtubeTheme : twitchTheme;
}
