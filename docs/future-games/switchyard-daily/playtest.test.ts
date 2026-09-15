import { describe, expect, it } from "vitest";
import { auditSwitchyardBalance, runSwitchyardPlaytest } from "./playtest";

describe("Switchyard Daily headless playtest", () => {
  it("is deterministic for a fixed seed and policy", () => {
    expect(runSwitchyardPlaytest(91, "oracle")).toEqual(runSwitchyardPlaytest(91, "oracle"));
  });

  it("is always solvable by reading the visible switch state", () => {
    const audit = auditSwitchyardBalance(256, 10);
    expect(audit.oracle.winRate).toBe(1);
    expect(audit.oracle.averageScore).toBe(1000);
  });

  it("does not reward blindly repeating one action", () => {
    const audit = auditSwitchyardBalance(256, 10);
    const bestStaticWinRate = Math.max(audit.HOLD.winRate, audit.A.winRate, audit.B.winRate, audit.C.winRate);
    expect(bestStaticWinRate).toBeLessThan(0.1);
    expect(audit.oracle.averageScore).toBeGreaterThan(audit.HOLD.averageScore * 5);
  });
});
