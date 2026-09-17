import { describe, expect, it } from "vitest";
import {
  advanceFund,
  createHedgeFundState,
  fundLayout,
  fundStats,
  interactFund,
  type HedgeFundState,
} from "./model";

function advanceSeconds(state: HedgeFundState, seconds: number) {
  let current = state;
  let event = "none";
  const steps = Math.ceil(seconds / 0.05);
  for (let index = 0; index < steps; index += 1) {
    const result = advanceFund(current, { x: 0, y: 0 }, 0.05);
    current = result.state;
    if (result.event !== "none") event = result.event;
  }
  return { state: current, event };
}

describe("Hedge Fund Floor model", () => {
  it("turns physical research into a scored investment idea", () => {
    const initial = createHedgeFundState(17);
    const atResearch = { ...initial, playerX: fundLayout.research.x, playerY: fundLayout.research.y };
    const started = interactFund(atResearch);

    expect(started.event).toBe("research_started");
    expect(started.state.activeIdeaId).not.toBeNull();
    expect(started.state.researchTimer).toBeGreaterThan(0);

    const finished = advanceSeconds(started.state, 8);
    expect(finished.state.researchTimer).toBe(0);
    expect(finished.state.researchSignal).not.toBeNull();
    expect(finished.state.researchCount).toBe(1);
  });

  it("executes a real long position from the trading floor", () => {
    const initial = createHedgeFundState(22);
    const researched = {
      ...initial,
      activeIdeaId: "aurora" as const,
      researchTimer: 0,
      researchSignal: 0.6,
      researchConfidence: 0.7,
      playerX: fundLayout.tradePads[0].x,
      playerY: fundLayout.tradePads[0].y,
    };

    const traded = interactFund(researched);
    expect(traded.event).toBe("trade_long");
    expect(traded.state.positions).toHaveLength(1);
    expect(traded.state.positions[0].shares).toBeGreaterThan(0);
    expect(traded.state.cash).toBeLessThan(initial.cash - 4_900_000);
    expect(fundStats(traded.state).grossExposure).toBeGreaterThan(0.04);
  });

  it("uses the risk desk to neutralize portfolio beta", () => {
    const initial = createHedgeFundState(28);
    const researched = {
      ...initial,
      activeIdeaId: "aurora" as const,
      researchTimer: 0,
      researchSignal: 0.5,
      playerX: fundLayout.tradePads[0].x,
      playerY: fundLayout.tradePads[0].y,
    };
    const traded = interactFund(researched).state;
    const before = Math.abs(fundStats(traded).betaExposure);
    const atRisk = { ...traded, playerX: fundLayout.riskPads[0].x, playerY: fundLayout.riskPads[0].y };
    const hedged = interactFund(atRisk);
    const after = Math.abs(fundStats(hedged.state).betaExposure);

    expect(hedged.event).toBe("hedge_set");
    expect(hedged.state.hedgeActive).toBe(true);
    expect(after).toBeLessThan(before * 0.05);
  });

  it("makes analyst hires speed up future research", () => {
    const initial = createHedgeFundState(31);
    const firstStart = interactFund({ ...initial, playerX: fundLayout.research.x, playerY: fundLayout.research.y }).state;
    const baselineDuration = firstStart.researchTimer;

    const hired = interactFund({
      ...initial,
      playerX: fundLayout.hirePads[0].x,
      playerY: fundLayout.hirePads[0].y,
    });
    expect(hired.event).toBe("staff_hired");
    expect(hired.state.staff.analyst).toBe(1);

    const staffedStart = interactFund({
      ...hired.state,
      playerX: fundLayout.research.x,
      playerY: fundLayout.research.y,
    }).state;
    expect(staffedStart.researchTimer).toBeLessThan(baselineDuration);
  });

  it("injects live market news while the player is moving", () => {
    const initial = createHedgeFundState(41);
    const beforePrices = { ...initial.prices };
    const result = advanceFund({ ...initial, newsTimer: 0.001 }, { x: 1, y: 0 }, 0.05);

    expect(result.event).toBe("news");
    expect(result.state.newsLabel).not.toBeNull();
    expect(result.state.newsTimeLeft).toBeGreaterThan(0);
    expect(Object.keys(result.state.prices).some((id) => result.state.prices[id as keyof typeof result.state.prices] !== beforePrices[id as keyof typeof beforePrices])).toBe(true);
  });

  it("ends the run when drawdown breaches the hard fund limit", () => {
    const initial = createHedgeFundState(55);
    const result = advanceFund({ ...initial, cash: 87_000_000 }, { x: 0, y: 0 }, 0.05);

    expect(result.event).toBe("game_over");
    expect(result.state.mode).toBe("gameover");
    expect(result.state.maxDrawdown).toBeGreaterThanOrEqual(0.12);
  });
});
