import { describe, expect, it } from "vitest";
import {
  advanceQuarter,
  fedScenarios,
  getFedScenario,
  initialFedState,
  normalizePolicyRate,
  scoreFedRun,
  type MacroSnapshot,
} from "./model";

describe("Run the Fed model", () => {
  it("ships five deterministic scenarios", () => {
    expect(fedScenarios).toHaveLength(5);
    expect(new Set(fedScenarios.map((scenario) => scenario.id)).size).toBe(5);
  });

  it("normalizes policy rates to 25 bp increments and safe bounds", () => {
    expect(normalizePolicyRate(3.13)).toBe(3.25);
    expect(normalizePolicyRate(-2)).toBe(0);
    expect(normalizePolicyRate(12)).toBe(10);
  });

  it("higher restrictive policy cools growth and inflation versus an easier stance", () => {
    const scenario = getFedScenario("soft-landing");
    const start = initialFedState(scenario);
    const tighter = advanceQuarter(start, 5.5, scenario).next;
    const easier = advanceQuarter(start, 2.5, scenario).next;

    expect(tighter.growth).toBeLessThan(easier.growth);
    expect(tighter.inflation).toBeLessThan(easier.inflation);
    expect(tighter.unemployment).toBeGreaterThan(easier.unemployment);
  });

  it("applies scenario shocks on their configured quarter", () => {
    const scenario = getFedScenario("inflation-shock");
    const q0 = initialFedState(scenario);
    const q1 = advanceQuarter(q0, q0.policyRate, scenario);
    const q2 = advanceQuarter(q1.next, q1.next.policyRate, scenario);

    expect(q1.shock).toBeNull();
    expect(q2.shock?.title).toBe("Broad price shock");
    expect(q2.next.inflation).toBeGreaterThan(q1.next.inflation);
  });

  it("penalizes abrupt rate moves through financial stability", () => {
    const scenario = getFedScenario("asset-bubble");
    const start = initialFedState(scenario);
    const steady = advanceQuarter(start, start.policyRate, scenario).next;
    const abrupt = advanceQuarter(start, start.policyRate + 3, scenario).next;
    expect(abrupt.financialStability).toBeLessThan(steady.financialStability);
  });

  it("scores balanced runs above clearly unstable ones", () => {
    const balanced: MacroSnapshot[] = Array.from({ length: 8 }, (_, index) => ({
      quarter: index + 1,
      policyRate: 3,
      inflation: 2.1,
      unemployment: 4.2,
      growth: 2,
      consumerSpending: 101,
      businessInvestment: 101,
      assetPrices: 103,
      financialStability: 88,
    }));
    const unstable: MacroSnapshot[] = Array.from({ length: 8 }, (_, index) => ({
      quarter: index + 1,
      policyRate: index % 2 === 0 ? 1 : 7,
      inflation: 5.5,
      unemployment: 7,
      growth: -1,
      consumerSpending: 90,
      businessInvestment: 85,
      assetPrices: 80,
      financialStability: 50,
    }));

    expect(scoreFedRun(balanced).score).toBeGreaterThan(scoreFedRun(unstable).score);
    expect(scoreFedRun(balanced).grade).toBe("A");
  });

  it("stops after eight quarters", () => {
    const scenario = getFedScenario("recession");
    const state = { ...initialFedState(scenario), quarter: 8 };
    expect(() => advanceQuarter(state, state.policyRate, scenario)).toThrow("Simulation already complete");
  });
});
