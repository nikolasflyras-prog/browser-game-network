import { describe, expect, it } from "vitest";
import { createTrafficState, pressure, stepTraffic, type TrafficAction } from "./simulation";

describe("Traffic Control simulation", () => {
  it("switches from NS to EW through an all-red transition", () => {
    let state = createTrafficState(1);
    state = stepTraffic(state, "switch");
    expect(state.phase).toBe("ALL_RED");
    state = stepTraffic(state, "none");
    state = stepTraffic(state, "none");
    expect(state.phase).toBe("EW");
  });

  it("is deterministic for a fixed seed and action sequence", () => {
    const actions: TrafficAction[] = Array.from({ length: 120 }, (_, index) =>
      index % 17 === 0 ? "switch" : "none",
    );
    const run = () => actions.reduce((state, action) => stepTraffic(state, action), createTrafficState(42));
    expect(run()).toEqual(run());
  });

  it("reports pressure from the largest queue", () => {
    const state = { ...createTrafficState(), nsQueue: 3, ewQueue: 6 };
    expect(pressure(state)).toBeCloseTo(6 / 9);
  });

  it("eventually gridlocks if the player never switches", () => {
    let state = createTrafficState(5);
    for (let i = 0; i < 2000 && !state.complete; i += 1) {
      state = stepTraffic(state, "none");
    }
    expect(state.complete).toBe(true);
    expect(state.gameOverReason).toBe("gridlock");
  });
});
