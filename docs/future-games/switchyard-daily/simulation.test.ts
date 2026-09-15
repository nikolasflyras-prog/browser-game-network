import { describe, expect, it } from "vitest";
import {
  createSwitchyardState,
  describeSwitchyardRoute,
  playSwitchyardTurn,
  reachableDepots,
  routeDepot,
  type SwitchyardAction,
} from "./simulation";

const actions: SwitchyardAction[] = ["HOLD", "A", "B", "C"];

describe("Switchyard Daily simulation", () => {
  it("routes through A first, then the active branch switch", () => {
    expect(routeDepot({ A: false, B: false, C: false })).toBe(0);
    expect(routeDepot({ A: false, B: true, C: false })).toBe(1);
    expect(routeDepot({ A: true, B: false, C: false })).toBe(2);
    expect(routeDepot({ A: true, B: false, C: true })).toBe(3);
  });

  it("describes every switch position without relying on color", () => {
    expect(describeSwitchyardRoute({ A: false, B: false, C: false })).toBe("A→LEFT · B→D0 · C→D2");
    expect(describeSwitchyardRoute({ A: true, B: true, C: true })).toBe("A→RIGHT · B→D1 · C→D3");
  });

  it("always generates a target reachable in one action", () => {
    let state = createSwitchyardState(123, 10);
    for (let turn = 0; turn < 8 && !state.complete; turn += 1) {
      expect(reachableDepots(state)).toContain(state.target);
      const action = actions.find((candidate) => playSwitchyardTurn({ ...state, maxTurns: 99 }, candidate).history.at(-1)?.correct);
      expect(action).toBeDefined();
      state = playSwitchyardTurn(state, action ?? "HOLD");
    }
  });

  it("ends after three strikes", () => {
    let state = createSwitchyardState(4, 20);
    while (!state.complete) {
      const wrong = actions.find((candidate) => !playSwitchyardTurn({ ...state, maxTurns: 99 }, candidate).history.at(-1)?.correct);
      expect(wrong).toBeDefined();
      state = playSwitchyardTurn(state, wrong ?? "HOLD");
    }
    expect(state.strikes).toBe(3);
    expect(state.won).toBe(false);
  });
});
