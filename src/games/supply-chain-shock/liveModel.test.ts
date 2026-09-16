import { describe, expect, it } from "vitest";
import {
  advanceLiveSupplyChain,
  createLiveSupplyChainState,
  liveSupplyResult,
  liveSupplySignals,
  supplyEventForTick,
  updateLiveSupplyControls,
} from "./liveModel";

describe("Supply Chain live model", () => {
  it("moves through warning, port delay, demand spike, and supplier failure regimes", () => {
    expect(supplyEventForTick(0).eventId).toBe("supplier-warning");
    expect(supplyEventForTick(8).eventId).toBe("port-delay");
    expect(supplyEventForTick(16).eventId).toBe("demand-spike");
    expect(supplyEventForTick(24).eventId).toBe("supplier-failure");
  });

  it("puts orders into a lead-time pipeline before they become inventory", () => {
    let state = createLiveSupplyChainState();
    state = advanceLiveSupplyChain(state);
    expect(state.inTransit.length).toBeGreaterThan(0);
    expect(liveSupplySignals(state).inTransitUnits).toBeGreaterThan(0);
    expect(state.inventory).toBeLessThan(28);
  });

  it("air freight shortens port-delay lead time versus ocean freight", () => {
    let ocean = createLiveSupplyChainState();
    let air = createLiveSupplyChainState();
    for (let index = 0; index < 8; index += 1) {
      ocean = advanceLiveSupplyChain(ocean);
      air = advanceLiveSupplyChain(air);
    }
    ocean = updateLiveSupplyControls(ocean, { freightMode: "ocean" });
    air = updateLiveSupplyControls(air, { freightMode: "air" });
    ocean = advanceLiveSupplyChain(ocean);
    air = advanceLiveSupplyChain(air);
    expect(ocean.history.at(-1)?.leadTime).toBeGreaterThan(air.history.at(-1)?.leadTime ?? 0);
  });

  it("backup sourcing protects order flow during supplier failure", () => {
    let primary = createLiveSupplyChainState();
    let backup = createLiveSupplyChainState();
    for (let index = 0; index < 24; index += 1) {
      primary = advanceLiveSupplyChain(primary);
      backup = advanceLiveSupplyChain(backup);
    }
    primary = updateLiveSupplyControls(primary, { sourceMode: "primary" });
    backup = updateLiveSupplyControls(backup, { sourceMode: "backup" });
    primary = advanceLiveSupplyChain(primary);
    backup = advanceLiveSupplyChain(backup);
    expect(primary.history.at(-1)?.ordered).toBeLessThan(backup.history.at(-1)?.ordered ?? 0);
  });

  it("completes a continuous network run with service and backlog results", () => {
    let state = createLiveSupplyChainState(12);
    while (!state.complete) state = advanceLiveSupplyChain(state);
    const result = liveSupplyResult(state);
    expect(state.history).toHaveLength(12);
    expect(result?.score).toBeGreaterThan(0);
    expect(result?.service).toBeGreaterThanOrEqual(0);
    expect(result?.backlog).toBeGreaterThanOrEqual(0);
  });
});
