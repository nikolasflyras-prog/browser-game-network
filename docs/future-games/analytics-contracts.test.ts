import { describe, expect, it } from "vitest";
import { futureGameCandidates } from "./candidate-manifest";
import { analyticsContractFor, futureGameAnalyticsContracts } from "./analytics-contracts";

describe("future game analytics contracts", () => {
  it("covers every staged candidate exactly once", () => {
    const slugs = futureGameAnalyticsContracts.map((contract) => contract.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect([...slugs].sort()).toEqual(futureGameCandidates.map((candidate) => candidate.slug).sort());
  });

  it("provides decision-level instrumentation for every game", () => {
    for (const candidate of futureGameCandidates) {
      const contract = analyticsContractFor(candidate.slug);
      expect(contract).toBeDefined();
      expect(contract?.events.some((event) => event.event === "game_action" || event.event === "level_completed")).toBe(true);
    }
  });
});
