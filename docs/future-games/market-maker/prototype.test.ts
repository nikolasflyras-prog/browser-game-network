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
    expect(marketMakerPrototypeResult(session)?.style).toBeTypeOf("string");
  });
});
