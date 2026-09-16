import { describe, expect, it } from "vitest";
import { circlesOverlap, particleSeeds, pulseRadius, roundConfig, roundScore } from "./model";

describe("Pulse Bloom model", () => {
  it("raises the capture target across rounds", () => {
    expect(roundConfig(4).target).toBeGreaterThan(roundConfig(1).target);
    expect(roundConfig(4).particleCount).toBeGreaterThan(roundConfig(1).particleCount);
  });

  it("expands and contracts a pulse", () => {
    const config = roundConfig(1);
    expect(pulseRadius(0, config.pulseDuration, config.maxPulseRadius)).toBe(0);
    expect(pulseRadius(config.pulseDuration / 2, config.pulseDuration, config.maxPulseRadius)).toBeCloseTo(config.maxPulseRadius, 4);
    expect(pulseRadius(config.pulseDuration, config.pulseDuration, config.maxPulseRadius)).toBe(0);
  });

  it("detects circle overlap", () => {
    expect(circlesOverlap({ x: 0, y: 0 }, 10, { x: 15, y: 0 }, 6)).toBe(true);
    expect(circlesOverlap({ x: 0, y: 0 }, 10, { x: 30, y: 0 }, 6)).toBe(false);
  });

  it("rewards clearing the round", () => {
    expect(roundScore(2, 7, 7)).toBeGreaterThan(roundScore(2, 6, 7));
  });

  it("generates deterministic moving particles", () => {
    expect(particleSeeds(99, 4, 800, 600)).toEqual(particleSeeds(99, 4, 800, 600));
  });
});
