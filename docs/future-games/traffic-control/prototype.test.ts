import { describe, expect, it } from "vitest";
import { advanceTrafficPrototype, createTrafficPrototype, trafficPressureBand, trafficPrototypeResult, trafficPrototypeView } from "./prototype";

describe("Traffic Control prototype adapter", () => {
  it("exposes renderer-friendly state without owning rendering", () => {
    let session = createTrafficPrototype(7);
    session = advanceTrafficPrototype(session, "switch");
    const view = trafficPrototypeView(session);
    expect(view.switching).toBe(true);
    expect(view.phase).toBe("ALL_RED");
    expect(view.pressureBand).toBe("clear");
  });

  it("uses readable pressure bands", () => {
    expect(trafficPressureBand(0.2)).toBe("clear");
    expect(trafficPressureBand(0.5)).toBe("building");
    expect(trafficPressureBand(0.9)).toBe("critical");
  });

  it("only exposes a result after the run ends", () => {
    let session = createTrafficPrototype(5);
    expect(trafficPrototypeResult(session)).toBeNull();
    for (let i = 0; i < 2000 && !session.state.complete; i += 1) {
      session = advanceTrafficPrototype(session, "none");
    }
    expect(trafficPrototypeResult(session)?.reason).toBe("gridlock");
  });
});
