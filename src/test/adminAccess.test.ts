import { describe, expect, it } from "vitest";
import { isOwnerTelegramId, OWNER_TELEGRAM_ID } from "@/lib/adminAccess";

describe("admin access", () => {
  it("allows only configured owner id", () => {
    expect(isOwnerTelegramId(OWNER_TELEGRAM_ID)).toBe(true);
    expect(isOwnerTelegramId("123")).toBe(false);
    expect(isOwnerTelegramId(null)).toBe(false);
  });
});

