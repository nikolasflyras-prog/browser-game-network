import { describe, expect, it } from "vitest";
import { advanceCircuitCoil, coilStepSeconds, createCircuitCoilState, queueCoilDirection } from "./model";

describe("Circuit Coil model", () => {
  it("creates deterministic food placement", () => { expect(createCircuitCoilState(26, 18, 42).food).toEqual(createCircuitCoilState(26, 18, 42).food); });
  it("moves the head one cell each step", () => { const state = createCircuitCoilState(); const next = advanceCircuitCoil(state).state; expect(next.body[0].x).toBe(state.body[0].x + 1); expect(next.body).toHaveLength(state.body.length); });
  it("rejects immediate reversal", () => { const state = createCircuitCoilState(); expect(queueCoilDirection(state, "left").queuedDirection).toBe("right"); });
  it("grows and scores when a node is collected", () => { const state = createCircuitCoilState(); const food = { x: state.body[0].x + 1, y: state.body[0].y }; const result = advanceCircuitCoil({ ...state, food }); expect(result.event).toBe("food"); expect(result.state.score).toBe(1); expect(result.state.body).toHaveLength(state.body.length + 1); });
  it("ends on wall collision and speeds up with score", () => { const state = { ...createCircuitCoilState(8, 8), body: [{ x: 7, y: 4 }, { x: 6, y: 4 }, { x: 5, y: 4 }] }; const result = advanceCircuitCoil(state, 8, 8); expect(result.event).toBe("game_over"); expect(result.state.mode).toBe("gameover"); expect(coilStepSeconds(10)).toBeLessThan(coilStepSeconds(0)); });
});
