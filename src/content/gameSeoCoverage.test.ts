import { describe, expect, it } from "vitest";
import { publicGameRegistry } from "@/games/registry";
import { getAnyGameSeoContent } from "./gameSeoResolver";

describe("public game guide coverage", () => {
  it("provides guide content for every public game", () => {
    const missing = publicGameRegistry.filter((game) => !getAnyGameSeoContent(game.slug)).map((game) => game.slug);
    expect(missing).toEqual([]);
  });
});
