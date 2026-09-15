import { describe, expect, it } from "vitest";
import { averageFinalScoreByChoice, enumerateScenarioPaths, scenarioScoreRange } from "../scenario-audit";
import { gridFinalScore, gridOperatingSignals, gridRules, gridScenarios, initialGridMetrics } from "./scenarios";

const paths = enumerateScenarioPaths(
  gridScenarios,
  initialGridMetrics,
  gridRules,
  (state) => gridFinalScore(state.metrics, state.score),
);

describe("Power Grid Dispatcher scenario balance", () => {
  it("turns reliability, reserve, and storage into visible operating states", () => {
    expect(gridOperatingSignals(initialGridMetrics)).toEqual({
      reliabilityState: "secure",
      reserveState: "adequate",
      storageState: "flexible",
      windStorageReady: true,
      heatwaveStorageReady: true,
    });
    expect(gridOperatingSignals({ ...initialGridMetrics, reliability: 76, reserve: 18, storage: 8 })).toEqual({
      reliabilityState: "critical",
      reserveState: "critical",
      storageState: "depleted",
      windStorageReady: false,
      heatwaveStorageReady: false,
    });
  });

  it("makes storage a finite resource with future consequences", () => {
    expect(
      paths.some(
        (path) =>
          path.choiceIds[0] === "battery" &&
          path.choiceIds[1] === "battery-wind" &&
          path.choiceIds[2] === "mixed-response",
      ),
    ).toBe(false);
  });

  it("penalizes knowingly running unsafe reserves", () => {
    const averages = averageFinalScoreByChoice(paths, 1);
    expect(averages["accept-tight"]).toBeLessThan(averages["battery-wind"] - 5);
    expect(averages["accept-tight"]).toBeLessThan(averages.peaker);
  });

  it("keeps multiple strategies meaningfully separated", () => {
    expect(scenarioScoreRange(paths).spread).toBeGreaterThanOrEqual(15);
  });
});
