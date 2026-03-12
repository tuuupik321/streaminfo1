import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

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

export async function initNativeShell() {
  if (initialized || !Capacitor.isNativePlatform()) return;

  initialized = true;
  markNativeShell();
  await setupStatusBar();
  await setupAndroidBackButton();
}
