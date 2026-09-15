import { describe, expect, it } from "vitest";
import { averageFinalScoreByChoice, enumerateScenarioPaths, scenarioScoreRange } from "../scenario-audit";
import { fabFinalScore, fabOperatingSignals, fabRules, fabScenarios, initialFabMetrics } from "./scenarios";

const paths = enumerateScenarioPaths(
  fabScenarios,
  initialFabMetrics,
  fabRules,
  (state) => fabFinalScore(state.metrics) + state.score,
);

describe("Chip Fab scenario balance", () => {
  it("enumerates the full deterministic decision space", () => {
    expect(paths).toHaveLength(81);
  });

  it("turns throughput and yield into a visible good-output signal", () => {
    expect(fabOperatingSignals(initialFabMetrics)).toEqual({
      goodOutput: 30,
      congestion: "watch",
      processRisk: "watch",
    });
    expect(fabOperatingSignals({ ...initialFabMetrics, throughput: 82, yield: 52, cycleTime: 76, defectRisk: 61 })).toEqual({
      goodOutput: 43,
      congestion: "high",
      processRisk: "high",
    });
  });

  it("does not reward simply maximizing utilization at the bottleneck", () => {
    const averages = averageFinalScoreByChoice(paths, 2);
    expect(averages["maximize-utilization"]).toBeLessThan(averages["improve-scheduling"] - 3);
    expect(averages["maximize-utilization"]).toBeLessThan(averages["buy-tool"] - 3);
  });

  it("creates visible separation between strong and weak operating paths", () => {
    expect(scenarioScoreRange(paths).spread).toBeGreaterThanOrEqual(10);
  });
});
