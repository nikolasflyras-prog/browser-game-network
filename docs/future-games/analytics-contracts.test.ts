import { describe, expect, it } from "vitest";
import { futureGameCandidates } from "./candidate-manifest";
import { analyticsContractFor, analyticsEventNamesFor, futureGameAnalyticsContracts } from "./analytics-contracts";
import { resolvedPromotionManifest } from "./promotion-analytics";

describe("future game analytics contracts", () => {
  it("covers every staged candidate exactly once", () => {
    const slugs = futureGameAnalyticsContracts.map((contract) => contract.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect([...slugs].sort()).toEqual(futureGameCandidates.map((candidate) => candidate.slug).sort());
  });

  it("provides decision and terminal instrumentation for every game", () => {
    for (const candidate of futureGameCandidates) {
      const contract = analyticsContractFor(candidate.slug);
      expect(contract).toBeDefined();
      expect(contract?.events.some((event) => event.event === "game_action" || event.event === "level_completed")).toBe(true);
      expect(contract?.events.some((event) => event.event === "game_completed" || event.event === "game_over" || event.event === "daily_completed")).toBe(true);
      expect(contract?.events.every((event) => event.properties.length > 0)).toBe(true);
    }
  });

  it("makes the resolved promotion manifest use the contract as its analytics source of truth", () => {
    for (const candidate of futureGameCandidates) {
      const slug = candidate.slug as Parameters<typeof resolvedPromotionManifest>[0];
      expect(resolvedPromotionManifest(slug).analytics).toEqual(analyticsEventNamesFor(slug));
    }
  });
});
