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
  });

  it("marks the four public games live", () => {
    expect(publicGameRegistry.map((game) => [game.slug, game.status])).toEqual([
      ["run-the-fed", "live"],
      ["market-maker", "live"],
      ["linebreak-daily", "live"],
      ["orbit-relay", "live"],
    ]);
  });
});
