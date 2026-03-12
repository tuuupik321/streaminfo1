import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { StatusBar, Style } from "@capacitor/status-bar";

import { storeOAuthResult, type OAuthResult } from "./oauth";

let initialized = false;

function markNativeShell() {
  document.documentElement.classList.add("native-shell");

  if (Capacitor.getPlatform() === "android") {
    document.documentElement.classList.add("native-android");
  }
}

async function setupStatusBar() {
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: "#07111d" });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // ignore native status bar failures on unsupported environments
  }
}

async function setupAndroidBackButton() {
  if (Capacitor.getPlatform() !== "android") return;

  const appPlugin = App as typeof App & {
    minimizeApp?: () => Promise<void>;
  };

  await App.addListener("backButton", async ({ canGoBack }) => {
    if (canGoBack || window.history.length > 1) {
      window.history.back();
      return;
    }

    if (typeof appPlugin.minimizeApp === "function") {
      await appPlugin.minimizeApp();
      return;
    }

    await App.exitApp();
  });
}

async function setupAppUrlHandling() {
  await App.addListener("appUrlOpen", async ({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "streamfly:" || parsed.host !== "oauth") {
        return;
      }

      const status = parsed.searchParams.get("oauth_status");
      const platform = parsed.searchParams.get("oauth_platform");
      if ((status !== "success" && status !== "error") || !platform) {
        return;
      }

      const result: OAuthResult = {
        status,
        platform: platform as OAuthResult["platform"],
        message: parsed.searchParams.get("oauth_message") || "",
        primary: parsed.searchParams.get("oauth_primary") === "1",
      };

      storeOAuthResult(result);

      try {
        await Browser.close();
      } catch {
        // ignore browser close failures
      }

      const returnPath = parsed.searchParams.get("return_path") || "/integrations";
      const target = new URL(window.location.origin);
      target.pathname = returnPath.startsWith("/") ? returnPath : "/integrations";
      target.searchParams.set("oauth_status", result.status);
      target.searchParams.set("oauth_platform", result.platform);
      if (result.message) {
        target.searchParams.set("oauth_message", result.message);
      }
      target.searchParams.set("oauth_primary", result.primary ? "1" : "0");

      window.location.replace(target.toString());
    } catch {
      // ignore malformed deep links
    }
  });
}

export async function initNativeShell() {
  if (initialized || !Capacitor.isNativePlatform()) return;

  initialized = true;
  markNativeShell();
  await setupStatusBar();
  await setupAppUrlHandling();
  await setupAndroidBackButton();
}
