import { describe, expect, it } from "vitest";
import { resolveStackDrop, stackDifficulty, stackSpawnX } from "./model";

describe("Stackline model", () => {
  it("ramps horizontal speed as the tower grows", () => {
    expect(stackDifficulty(12).speed).toBeGreaterThan(stackDifficulty(0).speed);
    expect(stackDifficulty(12).perfectTolerance).toBeLessThan(stackDifficulty(0).perfectTolerance);
  });

  it("snaps near-perfect drops to the platform below", () => {
    expect(resolveStackDrop(400, 180, 403, 180, 0)).toMatchObject({ hit: true, perfect: true, x: 400, width: 180 });
  });

  it("trims overhang from imperfect drops", () => {
    const result = resolveStackDrop(400, 180, 440, 180, 3);
    expect(result.hit).toBe(true);
    expect(result.perfect).toBe(false);
    expect(result.width).toBe(140);
    expect(result.x).toBe(420);
  });

  it("ends the run when there is no overlap", () => {
    expect(resolveStackDrop(400, 120, 540, 120, 8).hit).toBe(false);
  });

  it("spawns moving blocks from alternating playfield edges", () => {
    expect(stackSpawnX(1, 100, 800)).toBe(62);
    expect(stackSpawnX(-1, 100, 800)).toBe(738);
  });
});
