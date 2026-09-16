import { describe, expect, it } from "vitest";
import { gameRegistry, getGameMetadata, publicGameRegistry } from "./registry";

describe("game registry", () => {
  it("uses unique slugs", () => {
    const slugs = gameRegistry.map((game) => game.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves registered games", () => {
    expect(getGameMetadata("system-check")?.status).toBe("diagnostic");
    expect(getGameMetadata("market-maker")?.lane).toBe("Learn");
    expect(getGameMetadata("supply-chain-shock")?.category).toBe("Operations Simulation");
    expect(getGameMetadata("chip-fab")?.category).toBe("Semiconductor Simulation");
    expect(getGameMetadata("power-grid-dispatcher")?.category).toBe("Energy Systems Simulation");
    expect(getGameMetadata("vector-drift")?.category).toBe("Arcade Dodger");
    expect(getGameMetadata("pulse-bloom")?.category).toBe("Chain Reaction");
    expect(getGameMetadata("stackline")?.category).toBe("Precision Stacker");
    expect(getGameMetadata("switchyard")?.category).toBe("Routing Arcade");
  });

  it("marks the eleven public games live", () => {
    expect(publicGameRegistry.map((game) => [game.slug, game.status])).toEqual([
      ["run-the-fed", "live"], ["market-maker", "live"], ["supply-chain-shock", "live"], ["chip-fab", "live"], ["power-grid-dispatcher", "live"],
      ["linebreak-daily", "live"], ["orbit-relay", "live"], ["vector-drift", "live"], ["pulse-bloom", "live"], ["stackline", "live"], ["switchyard", "live"],
    ]);
  });
});
