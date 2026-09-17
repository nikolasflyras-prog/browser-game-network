import { describe, expect, it } from "vitest";
import { gameRegistry, getGameMetadata, publicGameRegistry } from "./registry";

describe("game registry", () => {
  it("uses unique slugs", () => { const slugs = gameRegistry.map((game) => game.slug); expect(new Set(slugs).size).toBe(slugs.length); });
  it("resolves registered games", () => {
    expect(getGameMetadata("system-check")?.status).toBe("diagnostic");
    expect(getGameMetadata("market-maker")?.lane).toBe("Learn");
    expect(getGameMetadata("semiconductor-vc")?.collection).toBe("Semiconductors");
    expect(getGameMetadata("chip-architect")?.category).toBe("Chip Design Lab");
    expect(getGameMetadata("packaging-lab")?.category).toBe("Advanced Packaging Lab");
    expect(getGameMetadata("fab-floor")?.category).toBe("Wafer Fab Operations");
    expect(getGameMetadata("data-center-architect")?.category).toBe("AI Infrastructure");
    expect(getGameMetadata("chip-fab")?.collection).toBe("Semiconductors");
    expect(getGameMetadata("vector-drift")?.category).toBe("Arcade Dodger");
    expect(getGameMetadata("stackline")?.category).toBe("Precision Stacker");
    expect(getGameMetadata("rebound-rush")?.category).toBe("Paddle Arcade");
    expect(getGameMetadata("courier-loop")?.category).toBe("Top-Down Delivery");
    expect(getGameMetadata("magnet-field")?.category).toBe("Physics Collection");
    expect(getGameMetadata("skybound")?.category).toBe("Vertical Platformer");
    expect(getGameMetadata("circuit-coil")?.category).toBe("Growing Trail");
  });
  it("marks the twenty-two public games live", () => {
    expect(publicGameRegistry).toHaveLength(22);
    expect(publicGameRegistry.every((game) => game.status === "live")).toBe(true);
    expect(publicGameRegistry.map((game) => game.slug)).toContain("semiconductor-vc");
    expect(publicGameRegistry.map((game) => game.slug)).toContain("chip-architect");
    expect(publicGameRegistry.map((game) => game.slug)).toContain("packaging-lab");
    expect(publicGameRegistry.map((game) => game.slug)).toContain("fab-floor");
    expect(publicGameRegistry.map((game) => game.slug)).toContain("data-center-architect");
    expect(publicGameRegistry.map((game) => game.slug)).toContain("skybound");
    expect(publicGameRegistry.map((game) => game.slug)).toContain("circuit-coil");
  });
});
