import { describe, expect, it } from "vitest";
import { advanceSkybound, createSkyboundState } from "./model";

const WIDTH = 900;
const HEIGHT = 620;

describe("Skybound model", () => {
  it("builds deterministic platform layouts", () => {
    expect(createSkyboundState(WIDTH, HEIGHT, 55).platforms).toEqual(createSkyboundState(WIDTH, HEIGHT, 55).platforms);
  });

  it("steers horizontally while airborne", () => {
    const state = createSkyboundState(WIDTH, HEIGHT);
    const moved = advanceSkybound(state, 1, 0.04, WIDTH, HEIGHT).state;
    expect(moved.playerX).toBeGreaterThan(state.playerX);
    expect(moved.vx).toBeGreaterThan(0);
  });

  it("bounces from a platform when descending", () => {
    const state = createSkyboundState(WIDTH, HEIGHT);
    const base = state.platforms[0];
    const falling = { ...state, playerX: base.x + base.width / 2, playerY: base.y - 19, vy: 220 };
    const result = advanceSkybound(falling, 0, 0.04, WIDTH, HEIGHT);
    expect(result.event).toBe("landed");
    expect(result.state.vy).toBeLessThan(0);
    expect(result.state.landings).toBe(1);
  });

  it("scrolls the world when the player climbs above the camera line", () => {
    const state = createSkyboundState(WIDTH, HEIGHT);
    const climbing = { ...state, playerY: HEIGHT * 0.32, vy: -300 };
    const result = advanceSkybound(climbing, 0, 0.03, WIDTH, HEIGHT).state;
    expect(result.heightClimbed).toBeGreaterThan(0);
    expect(result.playerY).toBeCloseTo(HEIGHT * 0.38);
  });

  it("ends the run when the player falls below the viewport", () => {
    const state = { ...createSkyboundState(WIDTH, HEIGHT), playerY: HEIGHT + 80, vy: 300, platforms: [] };
    const result = advanceSkybound(state, 0, 0.02, WIDTH, HEIGHT);
    expect(result.event).toBe("game_over");
    expect(result.state.mode).toBe("gameover");
  });
});
