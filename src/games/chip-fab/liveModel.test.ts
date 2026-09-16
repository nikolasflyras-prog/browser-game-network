import { describe, expect, it } from "vitest";
import {
  advanceLiveChipFab,
  createLiveChipFabState,
  fabEventForTick,
  liveFabResult,
  liveFabSignals,
  scheduleFabMaintenance,
  updateLiveFabControls,
} from "./liveModel";

describe("Chip Fab live model", () => {
  it("moves through distinct ramp, drift, bottleneck, and maintenance regimes", () => {
    expect(fabEventForTick(0).eventId).toBe("ramp");
    expect(fabEventForTick(8).eventId).toBe("metrology-drift");
    expect(fabEventForTick(16).eventId).toBe("lithography-bottleneck");
    expect(fabEventForTick(24).eventId).toBe("maintenance-risk");
  });

  it("builds WIP when starts are pushed into a constrained line", () => {
    let state = createLiveChipFabState();
    state = updateLiveFabControls(state, { startMode: "push", focus: "etch" });
    for (let index = 0; index < 12; index += 1) state = advanceLiveChipFab(state);
    expect(liveFabSignals(state).totalWip).toBeGreaterThan(0);
  });

  it("takes a station offline for preventive maintenance and restores health", () => {
    let state = createLiveChipFabState();
    state = scheduleFabMaintenance(state, "lithography");
    expect(state.stations.lithography.maintenanceTicks).toBe(2);
    state = advanceLiveChipFab(state);
    expect(state.stations.lithography.maintenanceTicks).toBe(1);
    state = advanceLiveChipFab(state);
    expect(state.stations.lithography.maintenanceTicks).toBe(0);
    expect(state.stations.lithography.health).toBe(98);
  });

  it("crew focus changes which station receives extra capacity", () => {
    let litho = createLiveChipFabState(8);
    litho = updateLiveFabControls(litho, { startMode: "push", focus: "lithography" });
    let metro = createLiveChipFabState(8);
    metro = updateLiveFabControls(metro, { startMode: "push", focus: "metrology" });
    for (let index = 0; index < 5; index += 1) {
      litho = advanceLiveChipFab(litho);
      metro = advanceLiveChipFab(metro);
    }
    expect(litho.stations.lithography.queue).toBeLessThanOrEqual(metro.stations.lithography.queue);
  });

  it("completes a timed run with production, yield, WIP, and score", () => {
    let state = createLiveChipFabState(12);
    while (!state.complete) state = advanceLiveChipFab(state);
    const result = liveFabResult(state);
    expect(state.history).toHaveLength(12);
    expect(result?.goodDie).toBeGreaterThan(0);
    expect(result?.yieldRate).toBeGreaterThan(0);
    expect(result?.endingWip).toBeGreaterThanOrEqual(0);
    expect(result?.score).toBeGreaterThan(0);
  });
});
