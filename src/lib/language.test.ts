import { describe, it, expect, vi } from "vitest";
import { detectTelegramUiLanguage } from "./language";

describe("detectTelegramUiLanguage", () => {
  it("should return 'ru' for Russian language code", () => {
    vi.stubGlobal("navigator", { language: "ru-RU" });
    expect(detectTelegramUiLanguage()).toBe("ru");
  });

  it("should return 'en' for English language code", () => {
    vi.stubGlobal("navigator", { language: "en-US" });
    expect(detectTelegramUiLanguage()).toBe("en");
  });

  it("should return 'uk' for Ukrainian language code", () => {
    vi.stubGlobal("navigator", { language: "uk-UA" });
    expect(detectTelegramUiLanguage()).toBe("uk");
  });

  it("should fall back to 'ru' for unsupported language codes", () => {
    vi.stubGlobal("navigator", { language: "de-DE" });
    expect(detectTelegramUiLanguage()).toBe("ru");
  });
});
