import { describe, expect, it } from "vitest";
import {
  createMarketMakerState,
  inventoryRiskLabel,
  marketMakerResult,
  playMarketRound,
  quoteFor,
} from "./model";

describe("Market Maker public model", () => {
  it("quotes a tighter spread in tight mode than wide mode", () => {
    const state = createMarketMakerState();
    const tight = quoteFor(state, "tight");
    const wide = quoteFor(state, "wide");
    expect(tight.ask - tight.bid).toBeLessThan(wide.ask - wide.bid);
  });

  it("skews balanced quotes down when inventory is long", () => {
    const flat = createMarketMakerState();
    const long = { ...flat, inventory: 6 };
    expect(quoteFor(long, "balanced").bid).toBeLessThan(quoteFor(flat, "balanced").bid);
    expect(quoteFor(long, "balanced").ask).toBeLessThan(quoteFor(flat, "balanced").ask);
  });

  it("is deterministic for a fixed seed and choices", () => {
    const play = () => {
      let state = createMarketMakerState(99, 6);
      for (const posture of ["tight", "balanced", "lean-long", "wide", "lean-short", "balanced"] as const) {
        state = playMarketRound(state, posture);
      }
      return state;
    };

    expect(play()).toEqual(play());
    expect(play().complete).toBe(true);
  });

  it("labels inventory risk bands", () => {
    expect(inventoryRiskLabel(0)).toBe("low");
    expect(inventoryRiskLabel(-3)).toBe("medium");
    expect(inventoryRiskLabel(5)).toBe("high");
  });

  it("summarizes a completed dealer run", () => {
    let state = createMarketMakerState(7, 3);
    state = playMarketRound(state, "balanced");
    state = playMarketRound(state, "lean-short");
    state = playMarketRound(state, "wide");
    const result = marketMakerResult(state);

    expect(result).not.toBeNull();
    expect(result?.totalFills).toBeGreaterThanOrEqual(0);
    expect(result?.peakInventory).toBeGreaterThanOrEqual(0);
    expect(result?.style).toBeTruthy();
  });
});
