import { describe, expect, it } from "vitest";
import {
  createPowerGridState,
  currentGridScenario,
  gridChoiceAvailability,
  gridFinalScore,
  gridOperatingSignals,
  playGridChoice,
  powerGridResult,
} from "./model";

describe("Power Grid production model", () => {
  it("starts with flexible storage for both forecast-miss and heatwave responses", () => {
    const state = createPowerGridState();
    expect(gridOperatingSignals(state.metrics)).toMatchObject({
      reliabilityState: "secure",
      reserveState: "adequate",
      storageState: "flexible",
      windStorageReady: true,
      heatwaveStorageReady: true,
    });
  });

  it("makes early battery use deplete the later heatwave option", () => {
    let state = createPowerGridState();
    state = playGridChoice(state, "battery");
    state = playGridChoice(state, "battery-wind");

    expect(state.metrics.storage).toBe(8);
    expect(gridOperatingSignals(state.metrics)).toMatchObject({
      storageState: "depleted",
      windStorageReady: false,
      heatwaveStorageReady: false,
    });

    const mixed = currentGridScenario(state)?.choices.find((choice) => choice.id === "mixed-response");
    expect(mixed).toBeDefined();
    expect(gridChoiceAvailability(state, mixed!)).toEqual({
      available: false,
      reason: "Earlier battery use left too little stored energy for the mixed response.",
    });
    expect(() => playGridChoice(state, "mixed-response")).toThrow(/too little stored energy/i);
  });

  it("preserves the mixed heatwave response when storage is saved", () => {
    let state = createPowerGridState();
    state = playGridChoice(state, "demand-response");
    state = playGridChoice(state, "peaker");

    const mixed = currentGridScenario(state)?.choices.find((choice) => choice.id === "mixed-response");
    expect(mixed).toBeDefined();
    expect(gridChoiceAvailability(state, mixed!).available).toBe(true);

    state = playGridChoice(state, "mixed-response");
    expect(state.metrics.storage).toBe(37);
    expect(gridOperatingSignals(state.metrics).heatwaveStorageReady).toBe(true);
  });

  it("penalizes cheap dispatch choices that violate reliability and reserve buffers", () => {
    let state = createPowerGridState();
    state = playGridChoice(state, "demand-response");
    state = playGridChoice(state, "accept-tight");

    expect(state.operatingPenalty).toBeGreaterThan(0);
    expect(state.metrics.cost).toBeLessThanOrEqual(53);
    expect(gridFinalScore(state.metrics, state.operatingPenalty)).toBeLessThan(gridFinalScore(state.metrics, 0));
  });

  it("completes four decisions with a scored operating style", () => {
    let state = createPowerGridState();
    state = playGridChoice(state, "demand-response");
    state = playGridChoice(state, "peaker");
    state = playGridChoice(state, "mixed-response");
    state = playGridChoice(state, "targeted-curtailment");

    expect(state.complete).toBe(true);
    expect(state.history).toHaveLength(4);
    const result = powerGridResult(state);
    expect(result?.score).toBeGreaterThan(0);
    expect(result?.style).toMatch(/reliability-first|low-carbon|cost-minimizer|balanced-dispatch/);
  });
});
