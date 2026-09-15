import { describe, expect, it } from "vitest";
import {
  formatSwitchyardDailyShare,
  switchyardDailyRecord,
  switchyardDailyStorageName,
  switchyardSeedFromDateKey,
  switchyardUtcDateKey,
} from "./daily";

describe("Switchyard Daily metadata", () => {
  it("uses a stable UTC date key and deterministic seed", () => {
    const date = new Date("2026-09-15T23:30:00-04:00");
    expect(switchyardUtcDateKey(date)).toBe("2026-09-16");
    expect(switchyardSeedFromDateKey("2026-09-16")).toBe(switchyardSeedFromDateKey("2026-09-16"));
    expect(switchyardSeedFromDateKey("2026-09-16")).not.toBe(switchyardSeedFromDateKey("2026-09-17"));
  });

  it("creates local-storage friendly completion metadata", () => {
    const result = { score: 920, strikes: 1, won: true, sequence: [true, true, false, true] };
    expect(switchyardDailyStorageName("2026-09-15")).toBe("daily-2026-09-15");
    expect(switchyardDailyRecord(result, "2026-09-15T12:00:00.000Z")).toEqual({
      score: 920,
      strikes: 1,
      won: true,
      sequence: "1101",
      completedAt: "2026-09-15T12:00:00.000Z",
    });
  });

  it("formats a spoiler-safe share card", () => {
    const share = formatSwitchyardDailyShare(
      "2026-09-15",
      { score: 920, strikes: 1, won: true, sequence: [true, true, false, true] },
      4,
      "https://example.com/games/switchyard-daily",
    );
    expect(share).toContain("🟩🟩🟥🟩 3/4");
    expect(share).toContain("4-day streak");
    expect(share).not.toMatch(/target|depot|switch/i);
  });
});
