import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getGameSeoContent } from "@/content/gameSeo";
import { loadGameRuntime } from "@/games/loaders";
import { gameRegistry } from "@/games/registry";
import { futureGameCandidates } from "./candidate-manifest";

const promotedSlugs = new Set(["market-maker"]);

describe("future-game staging isolation", () => {
  const stagedSlugs = futureGameCandidates
    .map((candidate) => candidate.slug)
    .filter((slug) => !promotedSlugs.has(slug));

  it("keeps unpromoted future candidates out of the public game registry", () => {
    const registered = new Set(gameRegistry.map((game) => game.slug));
    for (const slug of stagedSlugs) expect(registered.has(slug)).toBe(false);
    expect(registered.has("market-maker")).toBe(true);
  });

  it("keeps unpromoted future runtimes out of the production loader map", async () => {
    for (const slug of stagedSlugs) {
      await expect(loadGameRuntime(slug)).rejects.toThrow(`No runtime registered for game: ${slug}`);
    }
  });

  it("keeps unpromoted candidates out of the public sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const slug of stagedSlugs) {
      expect(urls.some((url) => url.includes(`/games/${slug}`))).toBe(false);
    }
    expect(urls.some((url) => url.includes("/games/market-maker"))).toBe(true);
  });

  it("keeps launch SEO copy staged until promotion", () => {
    for (const slug of stagedSlugs) expect(getGameSeoContent(slug)).toBeUndefined();
    expect(getGameSeoContent("market-maker")).toBeDefined();
  });
});
