import { describe, expect, it } from "vitest";
import {
  createSupplyChainState,
  currentSupplyScenario,
  playSupplyChoice,
  supplyChainCapabilities,
  supplyChainResult,
  supplyChoiceAvailability,
  supplyMetricChanges,
} from "./model";

describe("Supply Chain Shock production model", () => {
  it("makes early resilience investment unlock alternate capacity later", () => {
    let state = createSupplyChainState();
    state = playSupplyChoice(state, "dual-source");
    expect(supplyChainCapabilities(state.metrics).alternateCapacityReady).toBe(true);
    state = playSupplyChoice(state, "prioritize");
    state = playSupplyChoice(state, "ration");

    const backup = currentSupplyScenario(state)?.choices.find((choice) => choice.id === "activate-backup");
    expect(backup).toBeDefined();
    expect(supplyChoiceAvailability(state, backup!).available).toBe(true);
  });

  it("blocks alternate capacity when the player waited instead of preparing", () => {
    let state = createSupplyChainState();
    state = playSupplyChoice(state, "wait");
    state = playSupplyChoice(state, "prioritize");
    state = playSupplyChoice(state, "ration");

    const backup = currentSupplyScenario(state)?.choices.find((choice) => choice.id === "activate-backup");
    expect(backup).toBeDefined();
    const availability = supplyChoiceAvailability(state, backup!);
    expect(availability.available).toBe(false);
    expect(availability.reason).toMatch(/qualified alternate capacity/i);
  });

  it("lets safety stock absorb part of a logistics shock", () => {
    let buffered = createSupplyChainState();
    buffered = playSupplyChoice(buffered, "safety-stock");
    expect(supplyChainCapabilities(buffered.metrics).safetyStockReady).toBe(true);
    buffered = playSupplyChoice(buffered, "accept-delay");

    let unbuffered = createSupplyChainState();
    unbuffered = playSupplyChoice(unbuffered, "wait");
    unbuffered = playSupplyChoice(unbuffered, "accept-delay");

    expect(buffered.metrics.service).toBeGreaterThan(unbuffered.metrics.service);
    expect(buffered.metrics.backlog).toBeLessThan(unbuffered.metrics.backlog);
    expect(buffered.metrics.inventory).toBeLessThan(65);
  });

  it("exposes concrete metric deltas from the last decision", () => {
    const state = playSupplyChoice(createSupplyChainState(), "dual-source");
    const changes = supplyMetricChanges(state.history.at(-1) ?? null);
    expect(changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: "cash", delta: -18, improvement: -18 }),
      expect.objectContaining({ metric: "resilience", delta: 24, improvement: 24 }),
    ]));
  });

  it("produces a terminal scored operating style", () => {
    let state = createSupplyChainState();
    for (const choice of ["dual-source", "prioritize", "ration", "activate-backup"]) {
      state = playSupplyChoice(state, choice);
    }
    const result = supplyChainResult(state);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
    expect(["resilient", "over-buffered", "lean", "reactive"]).toContain(result!.style);
    expect(result!.strongestImprovement).not.toBeNull();
  });
});
