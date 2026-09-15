import { describe, expect, it } from "vitest";
import {
  activeSwitchyardDailyStreak,
  formatSwitchyardDailyShare,
  isBetterSwitchyardDailyResult,
  switchyardDailyId,
  switchyardDailyRecord,
  switchyardDailyStorageName,
  switchyardDateKeyFromDailyId,
  switchyardSeedFromDateKey,
  switchyardUtcDateKey,
} from "./daily";

describe("Switchyard Daily metadata", () => {
  it("uses a stable UTC date key, public daily ID, and deterministic seed", () => {
    const date = new Date("2026-09-15T23:30:00-04:00");
    expect(switchyardUtcDateKey(date)).toBe("2026-09-16");
    expect(switchyardDailyId("2026-09-16")).toBe("SWY-20260916");
    expect(switchyardDateKeyFromDailyId("SWY-20260916")).toBe("2026-09-16");
    expect(() => switchyardDailyId("09/16/2026")).toThrow(/Invalid date key/);
    expect(() => switchyardDateKeyFromDailyId("2026-09-16")).toThrow(/Invalid daily ID/);
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

  it("keeps the best result for a date instead of letting a replay regress it", () => {
    const best = { score: 920, strikes: 1, won: true, sequence: "111011", completedAt: "2026-09-15T12:00:00.000Z" };
    const worse = { ...best, score: 810, strikes: 2, completedAt: "2026-09-15T13:00:00.000Z" };
    const better = { ...best, score: 980, strikes: 0, completedAt: "2026-09-15T14:00:00.000Z" };
    expect(isBetterSwitchyardDailyResult(null, best)).toBe(true);
    expect(isBetterSwitchyardDailyResult(best, worse)).toBe(false);
    expect(isBetterSwitchyardDailyResult(best, better)).toBe(true);
  });

  it("counts only consecutive successful daily clears", () => {
    expect(activeSwitchyardDailyStreak(["2026-09-13", "2026-09-14", "2026-09-15"], "2026-09-15")).toBe(3);
    expect(activeSwitchyardDailyStreak(["2026-09-13", "2026-09-14"], "2026-09-15")).toBe(2);
    expect(activeSwitchyardDailyStreak(["2026-09-13", "2026-09-15"], "2026-09-15")).toBe(1);
  });

  it("formats a spoiler-safe, non-color-only share card", () => {
    const share = formatSwitchyardDailyShare(
      "2026-09-15",
      { score: 920, strikes: 1, won: true, sequence: [true, true, false, true] },
      4,
      "https://example.com/games/switchyard-daily",
    );
    expect(share).toContain("Switchyard Daily · SWY-20260915");
    expect(share).toContain("Routes ✓ ✓ × ✓ · 3/4 correct");
    expect(share).toContain("4-day streak");
    expect(share).not.toMatch(/target|depot|switch [abc]/i);
    expect(share).not.toMatch(/[🟩🟥]/u);
  });
});
