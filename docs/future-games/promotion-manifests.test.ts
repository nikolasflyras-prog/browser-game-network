import { describe, expect, it } from "vitest";
import { futureGameCandidates } from "./candidate-manifest";
import { futureGamePromotionManifests } from "./promotion-manifests";

describe("future-game promotion manifests", () => {
  it("covers every staged candidate exactly once", () => {
    const candidateSlugs = futureGameCandidates.map((candidate) => candidate.slug).sort();
    const promotionSlugs = Object.keys(futureGamePromotionManifests).sort();
    expect(promotionSlugs).toEqual(candidateSlugs);
  });

  it("keeps every candidate in prototype status until promotion QA passes", () => {
    for (const manifest of Object.values(futureGamePromotionManifests)) {
      expect(manifest.registry.status).toBe("prototype");
      expect(manifest.registry.version).toBe("0.1.0");
      expect(manifest.analytics).toContain("game_action");
      expect(manifest.seo.howTo.length).toBeGreaterThanOrEqual(3);
      expect(manifest.seo.concepts.length).toBeGreaterThanOrEqual(3);
      expect(manifest.seo.strategy.length).toBeGreaterThanOrEqual(2);
      expect(manifest.seo.faqs.length).toBeGreaterThanOrEqual(2);
      expect(manifest.registry.description.length).toBeGreaterThan(80);
      expect(manifest.seo.summary.length).toBeGreaterThan(120);
    }
  });

  it("uses lifecycle completion events appropriate to each format", () => {
    expect(futureGamePromotionManifests["traffic-control"].analytics).toContain("game_over");
    expect(futureGamePromotionManifests["switchyard-daily"].analytics).toContain("daily_completed");
    expect(futureGamePromotionManifests["switchyard-daily"].analytics).toContain("share_clicked");
    for (const slug of ["market-maker", "supply-chain-shock", "chip-fab", "power-grid-dispatcher"] as const) {
      expect(futureGamePromotionManifests[slug].analytics).toContain("game_completed");
    }
  });
});
