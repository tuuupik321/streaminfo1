import { Capacitor } from "@capacitor/core";

export function isNativeAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function getAdaptiveRefetchInterval(defaultMs: number, nativeAndroidMs = defaultMs) {
  return isNativeAndroidApp() ? nativeAndroidMs : defaultMs;
}

export function isDocumentPollingAllowed() {
  if (typeof document === "undefined") {
    return true;
  }

  return document.visibilityState !== "hidden";
}
