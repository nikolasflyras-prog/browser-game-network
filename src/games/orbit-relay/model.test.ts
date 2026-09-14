import { describe, expect, it } from "vitest";
import {
  difficultyForRelay,
  initialSource,
  intersectsCapture,
  isOutsideBounds,
  nextTargetBase,
  orbitPosition,
  scoreAfterRelay,
  tangentialVelocity,
} from "./model";

describe("Orbit Relay model", () => {
  it("increases difficulty without collapsing capture tolerance", () => {
    const opening = difficultyForRelay(0);
    const later = difficultyForRelay(20);
    expect(later.orbitSpeed).toBeGreaterThan(opening.orbitSpeed);
    expect(later.launchSpeed).toBeGreaterThan(opening.launchSpeed);
    expect(later.targetRadius).toBeLessThan(opening.targetRadius);
    expect(later.targetRadius).toBeGreaterThanOrEqual(21);
  });

  it("places the orbiting player on the expected radius", () => {
    expect(orbitPosition({ x: 100, y: 100 }, 50, 0)).toEqual({ x: 150, y: 100 });
  });

  it("launches tangentially to the orbit", () => {
    const velocity = tangentialVelocity(-Math.PI / 2, 400, true);
    expect(velocity.x).toBeCloseTo(400, 5);
    expect(velocity.y).toBeCloseTo(0, 5);
  });

  it("scores relays and grows the multiplier in steps", () => {
    let state = { relays: 0, score: 0, multiplier: 1 };
    state = scoreAfterRelay(state);
    state = scoreAfterRelay(state);
    state = scoreAfterRelay(state);
    expect(state.relays).toBe(3);
    expect(state.multiplier).toBe(1.25);
    expect(state.score).toBe(325);
  });

  it("detects capture overlap and out-of-bounds misses", () => {
    expect(intersectsCapture({ x: 0, y: 0 }, 8, { x: 25, y: 0 }, 18)).toBe(true);
    expect(intersectsCapture({ x: 0, y: 0 }, 8, { x: 40, y: 0 }, 18)).toBe(false);
    expect(isOutsideBounds({ x: 900, y: 300 }, { width: 800, height: 600 }, 36)).toBe(true);
  });

  it("spawns the next target on the opposite side of the playfield", () => {
    const bounds = { width: 1000, height: 600 };
    const source = initialSource(bounds);
    const target = nextTargetBase(source, bounds, 1);
    expect(source.x).toBeLessThan(bounds.width / 2);
    expect(target.x).toBeGreaterThan(bounds.width / 2);
    expect(target.y).toBeGreaterThan(0);
    expect(target.y).toBeLessThan(bounds.height);
  });
});
