import { describe, expect, it } from "vitest";
import {
  SEMI_VC_BOARD_SUPPORT_COST,
  SEMI_VC_FOLLOW_ON_CHECK,
  SEMI_VC_FUND_SIZE,
  advanceSemiVc,
  createSemiVcState,
  interactSemiVc,
  semiVcCompanies,
  semiVcDpi,
  semiVcExitCandidate,
  semiVcFundNav,
  semiVcLayout,
  semiVcTvpi,
  type SemiVcState,
} from "./model";

describe("Semiconductor VC office model", () => {
  it("starts with a $10M fund and an actual founder waiting in the office", () => {
    const state = createSemiVcState(7);
    expect(state.dryPowder).toBe(SEMI_VC_FUND_SIZE);
    expect(state.distributions).toBe(0);
    expect(state.reserveSpent).toBe(0);
    expect(state.portfolioEvents).toBe(0);
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
    const state: SemiVcState = {
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
      newsTheme: "ai",
      newsEffect: 0.002,
      newsTimeLeft: 10,
      dealSpawnTimer: 99,
      newsTimer: 99,
      portfolioTimer: 99,
    };
    const before = semiVcFundNav(state);
    let current: SemiVcState = state;
    for (let i = 0; i < 40; i += 1) {
      current = advanceSemiVc(current, { x: 0, y: 0 }, 0.05).state;
    }
    expect(current.elapsed).toBeGreaterThan(1.9);
    expect(current.holdings[0]?.mark).not.toBe(1_000_000);
    expect(semiVcFundNav(current)).not.toBe(before);
  });

  it("gives the first owned company a milestone event that can progress into liquidity", () => {
    const state: SemiVcState = {
      ...createSemiVcState(15),
      dryPowder: 9_500_000,
      holdings: [{
        companyId: "latchwave",
        invested: 500_000,
        ownershipPct: 3.33,
        mark: 507_000,
        supportBoost: 0,
      }],
      dealSpawnTimer: 99,
      newsTimer: 99,
      portfolioTimer: 0,
    };

    const alert = advanceSemiVc(state, { x: 0, y: 0 }, 0.05);
    expect(alert.event).toBe("portfolio_alert");
    expect(alert.state.portfolioAlertKind).toBe("design_win");
    expect(alert.state.portfolioEvents).toBe(1);

    const supported = interactSemiVc({
      ...alert.state,
      playerX: semiVcLayout.portfolioPads[1].x,
      playerY: semiVcLayout.portfolioPads[1].y,
    });
    expect(supported.event).toBe("follow_on");
    expect(supported.state.operatingBudget).toBe(SEMI_VC_OPERATING_BUDGET - SEMI_VC_BOARD_SUPPORT_COST);
    expect(semiVcExitCandidate(supported.state)?.companyId).toBe("latchwave");
  });

  it("uses reserves to support a financing and preserve ownership", () => {
    const state: SemiVcState = {
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
      portfolioAlertKind: "up_round",
      portfolioAlertHeadline: "Voltcrest: outside lead offers a higher-priced round",
      portfolioAlertTimeLeft: 20,
      playerX: semiVcLayout.portfolioPads[1].x,
      playerY: semiVcLayout.portfolioPads[1].y,
    };
    const supported = interactSemiVc(state);
    expect(supported.event).toBe("follow_on");
    expect(supported.state.dryPowder).toBe(9_000_000 - SEMI_VC_FOLLOW_ON_CHECK);
    expect(supported.state.reserveSpent).toBe(SEMI_VC_FOLLOW_ON_CHECK);
    expect(supported.state.holdings[0]?.invested).toBe(1_000_000 + SEMI_VC_FOLLOW_ON_CHECK);
    expect(supported.state.holdings[0]?.ownershipPct).toBeGreaterThan(3.5);
    expect(supported.state.portfolioAlertCompanyId).toBeNull();
  });

  it("shows the dilution tradeoff when an up round is not followed", () => {
    const state: SemiVcState = {
      ...createSemiVcState(19),
      dryPowder: 9_000_000,
      holdings: [{
        companyId: "latchwave",
        invested: 1_000_000,
        ownershipPct: 8,
        mark: 1_300_000,
        supportBoost: 0,
      }],
      portfolioAlertCompanyId: "latchwave",
      portfolioAlertKind: "up_round",
      portfolioAlertHeadline: "Latchwave: outside lead offers a higher-priced round",
      portfolioAlertTimeLeft: 20,
      playerX: semiVcLayout.portfolioPads[0].x,
      playerY: semiVcLayout.portfolioPads[0].y,
    };
    const declined = interactSemiVc(state);
    expect(declined.event).toBe("follow_on_declined");
    expect(declined.state.dryPowder).toBe(9_000_000);
    expect(declined.state.holdings[0]?.mark).toBeGreaterThan(1_300_000);
    expect(declined.state.holdings[0]?.ownershipPct).toBeCloseTo(6.56, 5);
  });

  it("uses operating budget rather than reserves for board support after a design win", () => {
    const state: SemiVcState = {
      ...createSemiVcState(23),
      dryPowder: 8_500_000,
      operatingBudget: 800_000,
      holdings: [{
        companyId: "latticebridge",
        invested: 1_500_000,
        ownershipPct: 4.5,
        mark: 1_650_000,
        supportBoost: 0,
      }],
      portfolioAlertCompanyId: "latticebridge",
      portfolioAlertKind: "design_win",
      portfolioAlertHeadline: "Latticebridge: major design win needs board-level execution support",
      portfolioAlertTimeLeft: 20,
      playerX: semiVcLayout.portfolioPads[1].x,
      playerY: semiVcLayout.portfolioPads[1].y,
    };
    const supported = interactSemiVc(state);
    expect(supported.event).toBe("follow_on");
    expect(supported.state.dryPowder).toBe(8_500_000);
    expect(supported.state.reserveSpent).toBe(0);
    expect(supported.state.operatingBudget).toBe(800_000 - SEMI_VC_BOARD_SUPPORT_COST);
    expect(supported.state.holdings[0]?.mark).toBeCloseTo(1_980_000, -2);
  });

  it("turns an unrealized winner into distributions and DPI at the exit desk", () => {
    const state: SemiVcState = {
      ...createSemiVcState(29),
      dryPowder: 8_000_000,
      holdings: [{
        companyId: "photonmesa",
        invested: 1_000_000,
        ownershipPct: 2.25,
        mark: 1_600_000,
        supportBoost: 0,
      }],
      playerX: semiVcLayout.exit.x,
      playerY: semiVcLayout.exit.y,
    };
    expect(semiVcTvpi(state)).toBeCloseTo(0.96, 5);
    expect(semiVcDpi(state)).toBe(0);

    const exited = interactSemiVc(state);
    expect(exited.event).toBe("exit_realized");
    expect(exited.state.holdings).toHaveLength(0);
    expect(exited.state.dryPowder).toBe(8_000_000);
    expect(exited.state.distributions).toBe(1_600_000);
    expect(exited.state.exits).toBe(1);
    expect(semiVcDpi(exited.state)).toBeCloseTo(0.16, 5);
    expect(semiVcTvpi(exited.state)).toBeCloseTo(0.96, 5);
  });
});
