import { describe, expect, it } from "vitest";
import { gameRegistry, getGameMetadata, getPublicGames, getRelatedGames } from "./registry";

describe("game registry", () => {
  it("uses unique slugs", () => {
    const slugs = gameRegistry.map((game) => game.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves registered games", () => {
    expect(getGameMetadata("system-check")?.status).toBe("diagnostic");
    expect(getGameMetadata("orbit-relay")?.category).toBe("Arcade");
  });

  it("keeps engineering diagnostics out of public discovery", () => {
    expect(getPublicGames().map((game) => game.slug)).toEqual(["orbit-relay"]);
  });

  it("does not suggest diagnostics as related games", () => {
    expect(getRelatedGames("orbit-relay")).toEqual([]);
  });
});
