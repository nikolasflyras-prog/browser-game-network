import { describe, expect, it } from "vitest";
import {
  SEMI_VC_FUND_SIZE,
  advanceSemiVc,
  createSemiVcState,
  interactSemiVc,
  semiVcCompanies,
  semiVcFundNav,
  semiVcLayout,
} from "./model";

describe("Semiconductor VC office model", () => {
  it("starts with a $10M fund and an actual founder waiting in the office", () => {
    const state = createSemiVcState(7);
    expect(state.dryPowder).toBe(SEMI_VC_FUND_SIZE);
    expect(state.incoming).toHaveLength(1);
    expect(state.incoming[0]?.companyId).toBe("latchwave");
    expect(state.staff).toBe(1);
  });

  it("requires spatial movement before the founder file can be picked up", () => {
    const state = createSemiVcState(7);
    const tooFar = interactSemiVc(state);
    expect(tooFar.event).toBe("none");

    const nearFounder = {
      ...state,
      playerX: semiVcLayout.pitchSpots[0].x,
      playerY: semiVcLayout.pitchSpots[0].y,
    };
    const picked = interactSemiVc(nearFounder);
    expect(picked.event).toBe("deal_picked_up");
    expect(picked.state.activeDealId).toBe("latchwave");
    expect(picked.state.incoming).toHaveLength(0);
  });

  it("lets the player physically route a deal through diligence before investment committee", () => {
    const base = createSemiVcState(9);
    const picked = interactSemiVc({
      ...base,
      playerX: semiVcLayout.pitchSpots[0].x,
      playerY: semiVcLayout.pitchSpots[0].y,
    }).state;

    const diligenced = interactSemiVc({
      ...picked,
      playerX: semiVcLayout.diligence.x,
      playerY: semiVcLayout.diligence.y,
    });
    expect(diligenced.event).toBe("diligence_complete");
    expect(diligenced.state.activeDealDiligenced).toBe(true);
    expect(diligenced.state.analystCooldown).toBeGreaterThan(0);

    const investPad = semiVcLayout.icPads.find((pad) => pad.id === "500k");
    expect(investPad).toBeTruthy();
    const invested = interactSemiVc({
      ...diligenced.state,
      playerX: investPad!.x,
      playerY: investPad!.y,
    });
    expect(invested.event).toBe("investment_made");
    expect(invested.state.investments).toBe(1);
    expect(invested.state.dryPowder).toBe(SEMI_VC_FUND_SIZE - 500_000);
    expect(invested.state.holdings[0]?.companyId).toBe("latchwave");
    expect(invested.state.holdings[0]?.ownershipPct).toBeCloseTo(500_000 / (12_000_000 + 3_000_000) * 100, 5);
  });

  it("turns staff hiring into a real operating tradeoff", () => {
    const state = createSemiVcState(11);
    const hired = interactSemiVc({
      ...state,
      playerX: semiVcLayout.hire.x,
      playerY: semiVcLayout.hire.y,
    });
    expect(hired.event).toBe("staff_hired");
    expect(hired.state.staff).toBe(2);
    expect(hired.state.operatingBudget).toBe(850_000);
  });

  it("marks the portfolio while time and news continue to move without player clicks", () => {
    const company = semiVcCompanies[1];
    const state = {
      ...createSemiVcState(13),
      holdings: [{
        companyId: company.id,
        invested: 1_000_000,
        ownershipPct: 1.5,
        mark: 1_000_000,
        supportBoost: 0,
      }],
      dryPowder: 9_000_000,
      newsLabel: "AI demand surge",
      newsTheme: "ai" as const,
      newsEffect: 0.002,
      newsTimeLeft: 10,
      dealSpawnTimer: 99,
      newsTimer: 99,
      portfolioTimer: 99,
    };
    const before = semiVcFundNav(state);
    let current = state;
    for (let i = 0; i < 40; i += 1) {
      current = advanceSemiVc(current, { x: 0, y: 0 }, 0.05).state;
    }
    expect(current.elapsed).toBeGreaterThan(1.9);
    expect(current.holdings[0]?.mark).not.toBe(1_000_000);
    expect(semiVcFundNav(current)).not.toBe(before);
  });

  it("supports portfolio companies by using follow-on reserves", () => {
    const state = {
      ...createSemiVcState(17),
      dryPowder: 9_000_000,
      holdings: [{
        companyId: "voltcrest",
        invested: 1_000_000,
        ownershipPct: 3.5,
        mark: 1_050_000,
        supportBoost: 0,
      }],
      portfolioAlertCompanyId: "voltcrest",
      portfolioAlertTimeLeft: 20,
      playerX: semiVcLayout.portfolioPads[1].x,
      playerY: semiVcLayout.portfolioPads[1].y,
    };
    const supported = interactSemiVc(state);
    expect(supported.event).toBe("follow_on");
    expect(supported.state.dryPowder).toBe(8_750_000);
    expect(supported.state.holdings[0]?.invested).toBe(1_250_000);
    expect(supported.state.portfolioAlertCompanyId).toBeNull();
  });
});
