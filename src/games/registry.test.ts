import { describe, expect, it } from "vitest";
import { gameRegistry, getGameMetadata } from "./registry";

describe("game registry", () => {
  it("uses unique slugs", () => {
    const slugs = gameRegistry.map((game) => game.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves registered games", () => {
    expect(getGameMetadata("system-check")?.status).toBe("diagnostic");
  });
});
