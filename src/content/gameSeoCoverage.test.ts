import { describe, expect, it } from "vitest";
import { publicGameRegistry } from "@/games/registry";
import { getGameSeoContent } from "./gameSeo";
import { getExtraGameSeoContent } from "./gameSeoExtras";

describe("public game guide coverage", () => {
  it("provides guide content for every public game", () => {
    const missing = publicGameRegistry.filter((game) => !(getGameSeoContent(game.slug) ?? getExtraGameSeoContent(game.slug))).map((game) => game.slug);
    expect(missing).toEqual([]);
  });
});
