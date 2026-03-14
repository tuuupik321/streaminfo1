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
if (!tgWindow.Telegram?.WebApp?.initData) {
  const userId = getOrCreateUserId();
  const appToken = import.meta.env.VITE_APP_TOKEN || "";
  const initData = new URLSearchParams({
    app_token: appToken,
    user_id: userId,
  }).toString();
  tgWindow.Telegram = {
    WebApp: {
      initData,
      initDataUnsafe: { user: { id: Number(userId) } },
    },
  };
}

if (!import.meta.env.DEV) {
  console.warn = () => undefined;
}

void initNativeShell();

createRoot(document.getElementById("root")!).render(<App />);
