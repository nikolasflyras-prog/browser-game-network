import { describe, expect, it } from "vitest";
import { circleHitsGate, clampPlayerX, difficultyForScore, gateClearScore, nextGate } from "./model";

describe("Vector Drift model", () => {
  it("tightens the course as gates are cleared", () => {
    const early = difficultyForScore(0);
    const late = difficultyForScore(20);
    expect(late.gateSpeed).toBeGreaterThan(early.gateSpeed);
    expect(late.spawnMs).toBeLessThan(early.spawnMs);
    expect(late.gapWidth).toBeLessThan(early.gapWidth);
  });

  it("generates deterministic gates inside the playfield", () => {
    const a = nextGate(42, 900, 3);
    const b = nextGate(42, 900, 3);
    expect(a).toEqual(b);
    expect(a.gapCenter - a.gapWidth / 2).toBeGreaterThan(20);
    expect(a.gapCenter + a.gapWidth / 2).toBeLessThan(880);
  });

  it("distinguishes a clean pass from a collision", () => {
    expect(circleHitsGate(450, 500, 12, 500, 20, 450, 120)).toBe(false);
    expect(circleHitsGate(390, 500, 12, 500, 20, 450, 120)).toBe(true);
  });

  it("rewards near-miss gate clears", () => {
    expect(gateClearScore(0, 450, 450, 120)).toBe(10);
    expect(gateClearScore(0, 501, 450, 120)).toBe(15);
  });

  it("keeps the player inside the playfield", () => {
    expect(clampPlayerX(-50, 600)).toBe(18);
    expect(clampPlayerX(700, 600)).toBe(582);
  });
});
