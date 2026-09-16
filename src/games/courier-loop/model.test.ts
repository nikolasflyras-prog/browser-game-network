import { describe, expect, it } from "vitest";
import { advanceCourier, courierMap, courierTarget, createCourierState } from "./model";

const WIDTH = 1000;
const HEIGHT = 600;

describe("Courier Loop model", () => {
  it("starts at the depot with a delivery loaded", () => {
    const state = createCourierState(WIDTH, HEIGHT);
    const map = courierMap(WIDTH, HEIGHT);
    expect(state.phase).toBe("delivery");
    expect(state.x).toBeCloseTo(map.depot.x);
    expect(courierTarget(state, WIDTH, HEIGHT)).toEqual(map.destinations[0]);
  });

  it("moves in two dimensions and clamps diagonal input", () => {
    const state = createCourierState(WIDTH, HEIGHT);
    const result = advanceCourier(state, { x: 1, y: 1 }, 0.05, WIDTH, HEIGHT).state;
    expect(result.x).toBeGreaterThan(state.x);
    expect(result.y).toBeGreaterThan(state.y);
    expect(Math.hypot(result.vx, result.vy)).toBeLessThanOrEqual(221);
  });

  it("blocks movement through buildings and applies one collision penalty", () => {
    const obstacle = courierMap(WIDTH, HEIGHT).obstacles[0];
    const state = { ...createCourierState(WIDTH, HEIGHT), x: obstacle.x - 15, y: obstacle.y + obstacle.height / 2 };
    const result = advanceCourier(state, { x: 1, y: 0 }, 0.05, WIDTH, HEIGHT);
    expect(result.event).toBe("collision");
    expect(result.state.x).toBe(state.x);
    expect(result.state.timeLeft).toBeLessThan(state.timeLeft - 1);
  });

  it("delivers a package then requires a depot pickup", () => {
    const state = createCourierState(WIDTH, HEIGHT);
    const target = courierTarget(state, WIDTH, HEIGHT);
    const delivered = advanceCourier({ ...state, x: target.x, y: target.y }, { x: 0, y: 0 }, 0.01, WIDTH, HEIGHT);
    expect(delivered.event).toBe("delivered");
    expect(delivered.state.deliveries).toBe(1);
    expect(delivered.state.phase).toBe("pickup");
    const depot = courierMap(WIDTH, HEIGHT).depot;
    const picked = advanceCourier({ ...delivered.state, x: depot.x, y: depot.y }, { x: 0, y: 0 }, 0.01, WIDTH, HEIGHT);
    expect(picked.event).toBe("picked_up");
    expect(picked.state.phase).toBe("delivery");
    expect(picked.state.destinationIndex).toBe(1);
  });

  it("ends the run when the clock expires", () => {
    const state = { ...createCourierState(WIDTH, HEIGHT), timeLeft: 0.02 };
    const result = advanceCourier(state, { x: 0, y: 0 }, 0.05, WIDTH, HEIGHT);
    expect(result.event).toBe("game_over");
    expect(result.state.phase).toBe("gameover");
    expect(result.state.timeLeft).toBe(0);
  });
});
