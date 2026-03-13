import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ru.streamfly.app",
  appName: "Streamfly",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    url: "https://straminfoapp.ru",
    cleartext: false,
    allowNavigation: ["straminfoapp.ru"],
  },
};

export default config;
