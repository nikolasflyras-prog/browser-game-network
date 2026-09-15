import { describe, expect, it } from "vitest";
import { futureGameCandidates } from "./candidate-manifest";
import { futurePrototypeReadiness } from "./prototype-readiness";

describe("future prototype readiness", () => {
  it("covers every staged candidate", () => {
    expect(futurePrototypeReadiness.map((entry) => entry.slug).sort()).toEqual(
      futureGameCandidates.map((candidate) => candidate.slug).sort(),
    );
  });

  it("keeps every candidate isolated from public routing", () => {
    for (const entry of futurePrototypeReadiness) {
      expect(entry.deterministicLogic).toBe(true);
      expect(entry.balanceGate).toBe(true);
      expect(entry.sessionAdapter).toBe(true);
      expect(entry.analyticsContract).toBe(true);
      expect(entry.publicRoute).toBe(false);
    }
  });
});
