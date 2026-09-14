import { describe, expect, it } from "vitest";
import { activeDailyStreak, formatDailyShare, offsetDateKey } from "./progress";

describe("Linebreak Daily progress", () => {
  it("counts a streak through today when today is complete", () => {
    expect(activeDailyStreak(["2026-09-12", "2026-09-13", "2026-09-14"], "2026-09-14")).toBe(3);
  });

  it("keeps yesterday's streak active before today's puzzle is finished", () => {
    expect(activeDailyStreak(["2026-09-12", "2026-09-13"], "2026-09-14")).toBe(2);
  });

  it("stops at the first missing day", () => {
    expect(activeDailyStreak(["2026-09-10", "2026-09-12", "2026-09-14"], "2026-09-14")).toBe(1);
  });

  it("handles UTC date boundaries", () => {
    expect(offsetDateKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(offsetDateKey("2024-03-01", -1)).toBe("2024-02-29");
  });

  it("formats a compact share result", () => {
    expect(formatDailyShare("2026-09-14", 7, 8, 3, "https://example.com/game")).toBe(
      "Linebreak Daily — 2026-09-14\n7/8 ink · 1 spare\n🔥 3-day streak\nhttps://example.com/game",
    );
  });
});
