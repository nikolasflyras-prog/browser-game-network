import { describe, expect, it } from "vitest";
import { createMarketMakerState, inventoryRiskLabel, playMarketRound, quoteFor } from "./simulation";

describe("Market Maker simulation", () => {
  it("quotes a tighter spread in tight mode than wide mode", () => {
    const state = createMarketMakerState();
    const tight = quoteFor(state, "tight");
    const wide = quoteFor(state, "wide");
    expect(tight.ask - tight.bid).toBeLessThan(wide.ask - wide.bid);
  });

  it("skews quotes down when inventory is long", () => {
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
});
