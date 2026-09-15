import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getGameSeoContent } from "@/content/gameSeo";
import { loadGameRuntime } from "@/games/loaders";
import { gameRegistry } from "@/games/registry";
import { futureGameCandidates } from "./candidate-manifest";

describe("future-game staging isolation", () => {
  const slugs = futureGameCandidates.map((candidate) => candidate.slug);

  it("keeps every future candidate out of the public game registry", () => {
    const registered = new Set(gameRegistry.map((game) => game.slug));
    for (const slug of slugs) expect(registered.has(slug)).toBe(false);
  });

  it("keeps future runtimes out of the production loader map", async () => {
    for (const slug of slugs) {
      await expect(loadGameRuntime(slug)).rejects.toThrow(`No runtime registered for game: ${slug}`);
    }
  });

  it("keeps future candidates out of the public sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const slug of slugs) {
      expect(urls.some((url) => url.includes(`/games/${slug}`))).toBe(false);
    }
  });

  it("keeps launch SEO copy staged until a promotion decision", () => {
    for (const slug of slugs) expect(getGameSeoContent(slug)).toBeUndefined();
  });
});
