import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { getOrCreateUserId } from "./database/users";
import "./index.css";
import { initNativeShell } from "./lib/nativeShell";

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: {
        user?: {
          id?: number;
        };
      };
    };
  };
};

const tgWindow = window as TelegramWindow;
const fallbackUserId = getOrCreateUserId();
const appToken = import.meta.env.VITE_APP_TOKEN || "";

if (!tgWindow.Telegram?.WebApp) {
  const initData = new URLSearchParams({
    app_token: appToken,
    user_id: fallbackUserId,
  }).toString();
  tgWindow.Telegram = {
    ...(tgWindow.Telegram ?? {}),
    WebApp: {
      initData,
      initDataUnsafe: { user: { id: Number(fallbackUserId) } },
    },
  };
} else {
  const webApp = tgWindow.Telegram.WebApp;
  if (!webApp.initData) {
    webApp.initData = new URLSearchParams({
      app_token: appToken,
      user_id: fallbackUserId,
    }).toString();
  }
  if (!webApp.initDataUnsafe?.user?.id) {
    webApp.initDataUnsafe = {
      ...(webApp.initDataUnsafe ?? {}),
      user: { id: Number(fallbackUserId) },
    };
  }
}

if (!import.meta.env.DEV) {
  console.warn = () => undefined;
}

void initNativeShell();

createRoot(document.getElementById("root")!).render(<App />);
