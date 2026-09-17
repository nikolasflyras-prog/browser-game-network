import { describe, expect, it } from "vitest";
import { createHedgeFundState } from "./model";
import {
  FUND_REGIMES,
  applyMandatePressure,
  applyRegimeFrame,
  evaluateMandate,
  initializeRegimeState,
  regimeForRun,
  regimeScoreAdjustment,
} from "./regimes";

describe("hedge fund regimes", () => {
  it("rotates deterministically through four distinct mandates", () => {
    expect(FUND_REGIMES).toHaveLength(4);
    expect(new Set(FUND_REGIMES.map((regime) => regime.id)).size).toBe(4);
    expect(new Set(FUND_REGIMES.map((regime) => regime.objective)).size).toBe(4);
    expect(regimeForRun(0).id).toBe("risk-on-momentum");
    expect(regimeForRun(1).id).toBe("market-neutral");
    expect(regimeForRun(2).id).toBe("capital-preservation");
    expect(regimeForRun(3).id).toBe("macro-whipsaw");
    expect(regimeForRun(4).id).toBe("risk-on-momentum");
  });

  it("changes starting operating budget and news cadence by mandate", () => {
    const base = createHedgeFundState(7);
    const preservation = initializeRegimeState(base, regimeForRun(2));
    const whipsaw = initializeRegimeState(base, regimeForRun(3));
    expect(preservation.operatingBudget).toBe(1_600_000);
    expect(whipsaw.operatingBudget).toBe(1_300_000);
    expect(whipsaw.newsTimer).toBeLessThan(preservation.newsTimer);
  });

  it("makes market-neutral beta discipline much tighter than momentum", () => {
    const state = createHedgeFundState(11);
    const exposed = { ...state, hedgeShares: 900_000, hedgeActive: true };
    const momentum = evaluateMandate(exposed, regimeForRun(0));
    const neutral = evaluateMandate(exposed, regimeForRun(1));
    expect(momentum.betaBreach).toBe(false);
    expect(neutral.betaBreach).toBe(true);
    expect(neutral.pressure).toBeGreaterThan(momentum.pressure);
  });

  it("market-neutral also rejects a highly directional net book", () => {
    const state = createHedgeFundState(13);
    const directional = {
      ...state,
      positions: [{ assetId: "gridline" as const, shares: 1_200_000, avgPrice: state.prices.gridline }],
      cash: state.cash - 1_200_000 * state.prices.gridline,
    };
    const check = evaluateMandate(directional, regimeForRun(1));
    expect(check.netBreach).toBe(true);
    expect(check.compliant).toBe(false);
  });

  it("capital preservation penalizes excessive drawdown earlier", () => {
    const base = createHedgeFundState(19);
    const stressed = { ...base, highWaterNav: 110_000_000, cash: 100_000_000 };
    const check = evaluateMandate(stressed, regimeForRun(2));
    expect(check.drawdownBreach).toBe(true);
    const pressured = applyMandatePressure(stressed, regimeForRun(2), 1);
    expect(pressured.reputation).toBeLessThan(stressed.reputation);
  });

  it("macro whipsaw reverses market direction across regime phases", () => {
    const regime = regimeForRun(3);
    const base = initializeRegimeState(createHedgeFundState(23), regime);
    const early = applyRegimeFrame({ ...base, elapsed: 10 }, regime, 0.05);
    const late = applyRegimeFrame({ ...base, elapsed: 30 }, regime, 0.05);
    expect(early.indexPrice).toBeGreaterThan(base.indexPrice);
    expect(late.indexPrice).toBeLessThan(base.indexPrice);
  });

  it("regime scoring rewards behavior aligned with each mandate", () => {
    const neutral = regimeForRun(1);
    const clean = createHedgeFundState(31);
    const betaHeavy = { ...clean, hedgeShares: 1_000_000, hedgeActive: true };
    expect(regimeScoreAdjustment(clean, neutral)).toBeGreaterThan(regimeScoreAdjustment(betaHeavy, neutral));
  });
});
