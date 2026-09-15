import { describe, expect, it } from "vitest";
import { auditTrafficBalance, runTrafficPlaytest } from "./playtest";

describe("Traffic Control headless playtest", () => {
  it("is deterministic for the same seed and policy", () => {
    expect(runTrafficPlaytest(27, "pressure")).toEqual(runTrafficPlaytest(27, "pressure"));
  });

  it("rewards queue-aware play over doing nothing", () => {
    const audit = auditTrafficBalance(64, 900);
    expect(audit.pressure.averageTicks).toBeGreaterThan(audit.idle.averageTicks * 3);
    expect(audit.pressure.averageScore).toBeGreaterThan(audit.idle.averageScore * 10);
  });

  it("does not collapse into a fixed periodic tapping rhythm", () => {
    const audit = auditTrafficBalance(64, 900);
    expect(audit.pressure.averageScore).toBeGreaterThan(audit.bestPeriodic.averageScore * 1.2);
  });
});
