import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ru.streamfly.app",
  appName: "Streamfly",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    url: "https://streamfly-bot.onrender.com",
    cleartext: false,
    allowNavigation: ["streamfly-bot.onrender.com"],
  },
};

export default config;
