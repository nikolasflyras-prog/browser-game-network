import { describe, expect, it } from "vitest";
import { averageFinalScoreByChoice, enumerateScenarioPaths, scenarioScoreRange } from "../scenario-audit";
import { initialSupplyMetrics, supplyChainFinalScore, supplyChainRules, supplyChainScenarios } from "./scenarios";

const paths = enumerateScenarioPaths(
  supplyChainScenarios,
  initialSupplyMetrics,
  supplyChainRules,
  (state) => supplyChainFinalScore(state.metrics) + state.score,
);

describe("Supply Chain Shock scenario balance", () => {
  it("creates real path dependence for alternate supply", () => {
    const backupPaths = paths.filter((path) => path.choiceIds[3] === "activate-backup");
    expect(backupPaths.length).toBeGreaterThan(0);
    expect(backupPaths.every((path) => path.choiceIds[0] === "dual-source")).toBe(true);
  });

  it("makes dual sourcing and safety stock competitive preparation strategies", () => {
    const averages = averageFinalScoreByChoice(paths, 0);
    expect(Math.abs(averages["dual-source"] - averages["safety-stock"])).toBeLessThan(3);
    expect(averages["dual-source"]).toBeGreaterThan(averages.wait);
    expect(averages["safety-stock"]).toBeGreaterThan(averages.wait);
  });

  it("produces enough score separation for decisions to matter", () => {
    expect(scenarioScoreRange(paths).spread).toBeGreaterThanOrEqual(20);
  });
});
