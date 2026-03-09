import { Twitch, Youtube, Heart } from "lucide-react";

export interface LinkedAccount {
  id: string;
  platform: "twitch" | "youtube" | "donationalerts";
  username: string;
  linkedChannels: string[];
}

export interface TelegramChannel {
  id: string;
  bot_token: string;
  chat_id: string;
  channel_name: string | null;
  is_verified: boolean;
}

export interface PartnerLink { id: string; name: string; url: string; }
export interface InlineButton { id: string; text: string; url: string; }
export interface MessageTemplate { id: string; name: string; text: string; }

export interface TelegramWebAppUser { id?: number; }
export interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: { user?: TelegramWebAppUser };
}
export interface TelegramWindow extends Window {
  Telegram?: { WebApp?: TelegramWebApp };
}

export const platformInfo = {
  twitch: { icon: Twitch, label: "Twitch", color: "text-[#9146FF]", borderHover: "hover:border-[#9146FF]/50" },
  youtube: { icon: Youtube, label: "YouTube", color: "text-[#FF0000]", borderHover: "hover:border-[#FF0000]/50" },
  donationalerts: { icon: Heart, label: "DonationAlerts", color: "text-[#F57B20]", borderHover: "hover:border-[#F57B20]/50" },
} as const;
