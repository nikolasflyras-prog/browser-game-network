import { describe, expect, it } from "vitest";
import { chooseMarketMakerPosture, createMarketMakerPrototype, marketMakerPrototypeResult, marketMakerPrototypeView } from "./prototype";

describe("Market Maker prototype adapter", () => {
  it("exposes all five visible quote choices from the same simulation state", () => {
    const view = marketMakerPrototypeView(createMarketMakerPrototype());
    expect(view.quotes).toHaveLength(5);
    expect(view.quotes.find((quote) => quote.posture === "tight")?.ask).toBeLessThan(
      view.quotes.find((quote) => quote.posture === "wide")?.ask ?? Infinity,
    );
  });

  it("completes through the UI-facing choice adapter", () => {
    let session = createMarketMakerPrototype(8, 4);
    for (const posture of ["balanced", "tight", "lean-short", "wide"] as const) {
      session = chooseMarketMakerPosture(session, posture);
    }
    expect(session.state.complete).toBe(true);
    const result = marketMakerPrototypeResult(session);
    expect(result?.style).toBeTypeOf("string");
    expect(result?.totalFills).toBeGreaterThanOrEqual(0);
    expect(result?.peakInventory).toBeGreaterThanOrEqual(Math.abs(result?.endingInventory ?? 0));
    expect(result?.totalRiskPenalty).toBeGreaterThanOrEqual(0);
    expect(result?.noFlowRounds).toBeGreaterThanOrEqual(0);
  });
});
