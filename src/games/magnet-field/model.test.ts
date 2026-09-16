import { describe, expect, it } from "vitest";
import { advanceMagnet, createMagnetState, magnetFieldRadius } from "./model";

const WIDTH = 900;
const HEIGHT = 600;

describe("Magnet Field model", () => {
  it("creates a deterministic mixed particle field", () => {
    const a = createMagnetState(WIDTH, HEIGHT, 42);
    const b = createMagnetState(WIDTH, HEIGHT, 42);
    expect(a.particles).toEqual(b.particles);
    expect(a.particles.some((particle) => particle.kind === "bomb")).toBe(true);
    expect(a.particles.some((particle) => particle.kind === "scrap")).toBe(true);
  });

  it("moves the magnet and drains energy only while the field is active", () => {
    const state = createMagnetState(WIDTH, HEIGHT);
    const active = advanceMagnet(state, { x: 1, y: 0, active: true }, 0.05, WIDTH, HEIGHT).state;
    expect(active.magnetX).toBeGreaterThan(state.magnetX);
    expect(active.energy).toBeLessThan(state.energy);
    const resting = advanceMagnet({ ...active, energy: 50 }, { x: 0, y: 0, active: false }, 0.05, WIDTH, HEIGHT).state;
    expect(resting.energy).toBeGreaterThan(50);
  });

  it("pulls nearby scrap toward the magnet", () => {
    const state = createMagnetState(WIDTH, HEIGHT);
    const scrap = { id: 99, kind: "scrap" as const, x: state.magnetX + magnetFieldRadius * 0.6, y: state.magnetY, vx: 0, vy: 0 };
    const result = advanceMagnet({ ...state, particles: [scrap] }, { x: 0, y: 0, active: true }, 0.05, WIDTH, HEIGHT).state;
    expect(result.particles[0].vx).toBeLessThan(0);
  });

  it("scores scrap and builds combo when it reaches the core", () => {
    const state = createMagnetState(WIDTH, HEIGHT);
    const scrap = { id: 77, kind: "scrap" as const, x: state.magnetX + 2, y: state.magnetY, vx: 0, vy: 0 };
    const result = advanceMagnet({ ...state, particles: [scrap] }, { x: 0, y: 0, active: false }, 0.01, WIDTH, HEIGHT);
    expect(result.events).toContain("scrap");
    expect(result.state.score).toBeGreaterThan(0);
    expect(result.state.combo).toBe(1);
    expect(result.state.particles).toHaveLength(0);
  });

  it("ends the run when a bomb consumes the final life", () => {
    const state = createMagnetState(WIDTH, HEIGHT);
    const bomb = { id: 88, kind: "bomb" as const, x: state.magnetX, y: state.magnetY, vx: 0, vy: 0 };
    const result = advanceMagnet({ ...state, lives: 1, particles: [bomb] }, { x: 0, y: 0, active: false }, 0.01, WIDTH, HEIGHT);
    expect(result.events).toContain("game_over");
    expect(result.state.mode).toBe("gameover");
    expect(result.state.lives).toBe(0);
  });
});
