import { describe, expect, it } from "vitest";
import {
  advanceLivePowerGrid,
  createLivePowerGridState,
  gridConditionsForTick,
  liveGridBalanceState,
  liveGridResult,
  updateLiveGridControls,
} from "./liveModel";

describe("Power Grid live model", () => {
  it("moves through four distinct operating regimes", () => {
    expect(gridConditionsForTick(0).eventId).toBe("morning-ramp");
    expect(gridConditionsForTick(8).eventId).toBe("wind-drop");
    expect(gridConditionsForTick(16).eventId).toBe("heatwave");
    expect(gridConditionsForTick(24).eventId).toBe("transmission-outage");
    expect(gridConditionsForTick(24).firmCapacity).toBeLessThan(gridConditionsForTick(23).firmCapacity);
  });

  it("spends finite battery energy while discharging", () => {
    let state = createLivePowerGridState();
    state = updateLiveGridControls(state, { battery: "discharge" });
    state = advanceLivePowerGrid(state);
    expect(state.storage).toBeLessThan(58);
    expect(state.history[0]?.batteryPower).toBeGreaterThan(0);
  });

  it("uses a finite demand-response budget", () => {
    let state = createLivePowerGridState();
    state = updateLiveGridControls(state, { demandResponse: true });
    for (let index = 0; index < 8; index += 1) state = advanceLivePowerGrid(state);
    expect(state.demandResponseBudget).toBe(0);
    expect(state.controls.demandResponse).toBe(false);
  });

  it("caps thermal delivery during the transmission outage", () => {
    let state = createLivePowerGridState();
    state = updateLiveGridControls(state, { thermal: 92 });
    for (let index = 0; index < 25; index += 1) state = advanceLivePowerGrid(state);
    const outageEntry = state.history.find((entry) => entry.eventId === "transmission-outage");
    expect(outageEntry?.thermal).toBeLessThanOrEqual(outageEntry?.firmCapacity ?? 0);
  });

  it("completes a continuous session with a scored result", () => {
    let state = createLivePowerGridState(12);
    state = updateLiveGridControls(state, { thermal: 65 });
    while (!state.complete) state = advanceLivePowerGrid(state);
    const result = liveGridResult(state);
    expect(state.history).toHaveLength(12);
    expect(result?.score).toBeGreaterThan(0);
    expect(result?.energyNotServed).toBeGreaterThanOrEqual(0);
    expect(liveGridBalanceState(2)).toBe("stable");
    expect(liveGridBalanceState(12)).toBe("emergency");
  });
});
