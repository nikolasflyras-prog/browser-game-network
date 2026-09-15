import { describe, expect, it } from "vitest";
import { averageFinalScoreByChoice, enumerateScenarioPaths, scenarioScoreRange } from "../scenario-audit";
import { fabFinalScore, fabRules, fabScenarios, initialFabMetrics } from "./scenarios";

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

  it("does not reward simply maximizing utilization at the bottleneck", () => {
    const averages = averageFinalScoreByChoice(paths, 2);
    expect(averages["maximize-utilization"]).toBeLessThan(averages["improve-scheduling"] - 3);
    expect(averages["maximize-utilization"]).toBeLessThan(averages["buy-tool"] - 3);
  });

  it("creates visible separation between strong and weak operating paths", () => {
    expect(scenarioScoreRange(paths).spread).toBeGreaterThanOrEqual(10);
  });
});
