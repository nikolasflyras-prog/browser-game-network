import { fundAssets, fundStats, type FundAssetId, type HedgeFundState } from "./model";

export type FundRegimeId = "risk-on-momentum" | "market-neutral" | "capital-preservation" | "macro-whipsaw";

export type FundRegime = {
  id: FundRegimeId;
  label: string;
  deskLabel: string;
  description: string;
  objective: string;
  grossLimit: number;
  betaLimit: number;
  drawdownLimit: number;
  volatilityMultiplier: number;
  startingOperatingBudget: number;
  preferredExposure: string;
  scoreHint: string;
};

export const FUND_REGIMES: readonly FundRegime[] = [
  {
    id: "risk-on-momentum",
    label: "Risk-On Momentum",
    deskLabel: "GROWTH / MOMENTUM",
    description: "AI and photonics leadership is working, liquidity is deep, and LPs expect you to participate without letting gross exposure run away.",
    objective: "Capture leadership while keeping gross exposure below 165% and drawdown below 10%.",
    grossLimit: 1.65,
    betaLimit: 0.95,
    drawdownLimit: 0.10,
    volatilityMultiplier: 1.15,
    startingOperatingBudget: 1_000_000,
    preferredExposure: "Directional long exposure is acceptable; dead cash is an opportunity cost.",
    scoreHint: "Reward positive P&L and research throughput; modest beta is tolerated.",
  },
  {
    id: "market-neutral",
    label: "Market Neutral",
    deskLabel: "LOW-NET / ALPHA",
    description: "Index direction is noisy and LPs hired you for stock selection. Gross can be meaningful, but beta and net exposure must stay tight.",
    objective: "Build paired long/short risk while holding |beta| below 20% and |net| below 30%.",
    grossLimit: 1.45,
    betaLimit: 0.20,
    drawdownLimit: 0.08,
    volatilityMultiplier: 0.95,
    startingOperatingBudget: 1_400_000,
    preferredExposure: "Research more names, pair longs with shorts, and neutralize market beta frequently.",
    scoreHint: "Strongly rewards alpha with controlled beta; directional bets damage LP confidence.",
  },
  {
    id: "capital-preservation",
    label: "Capital Preservation",
    deskLabel: "DOWNSIDE FIRST",
    description: "Funding markets are tightening and LPs care more about avoiding permanent capital loss than chasing every upside move.",
    objective: "Keep gross below 95%, beta below 45%, and maximum drawdown below 6.5%.",
    grossLimit: 0.95,
    betaLimit: 0.45,
    drawdownLimit: 0.065,
    volatilityMultiplier: 1.30,
    startingOperatingBudget: 1_600_000,
    preferredExposure: "Smaller books, more hedging, and a dedicated risk team are rational even when they reduce upside.",
    scoreHint: "Drawdown control and LP confidence matter more than raw P&L.",
  },
  {
    id: "macro-whipsaw",
    label: "Macro Whipsaw",
    deskLabel: "FAST MACRO TAPE",
    description: "Rates, policy headlines, and risk appetite are reversing quickly. The same beta that helps one minute can hurt the next.",
    objective: "Survive alternating macro shocks with gross below 135%, beta below 35%, and drawdown below 8%.",
    grossLimit: 1.35,
    betaLimit: 0.35,
    drawdownLimit: 0.08,
    volatilityMultiplier: 1.65,
    startingOperatingBudget: 1_300_000,
    preferredExposure: "Use the index hedge actively and do not confuse a short-lived macro move with company-specific alpha.",
    scoreHint: "Rewards rapid risk adaptation, clean hedging, and survival through reversals.",
  },
] as const;

export function fundRegimeById(id: FundRegimeId) {
  return FUND_REGIMES.find((regime) => regime.id === id) ?? FUND_REGIMES[0];
}

export function regimeForRun(runNumber: number) {
  const safe = Number.isFinite(runNumber) ? Math.max(0, Math.floor(runNumber)) : 0;
  return FUND_REGIMES[safe % FUND_REGIMES.length];
}

export function initializeRegimeState(state: HedgeFundState, regime: FundRegime): HedgeFundState {
  return {
    ...state,
    operatingBudget: regime.startingOperatingBudget,
    newsTimer: Math.min(state.newsTimer, regime.id === "macro-whipsaw" ? 9 : regime.id === "capital-preservation" ? 12 : 16),
  };
}

function regimeWave(regime: FundRegime, elapsed: number) {
  if (regime.id === "macro-whipsaw") {
    const phase = Math.floor(elapsed / 22) % 2 === 0 ? 1 : -1;
    return { indexDrift: phase * 0.00024, growthDrift: phase * 0.00016, defensiveDrift: phase * -0.00008 };
  }
  if (regime.id === "risk-on-momentum") return { indexDrift: 0.00006, growthDrift: 0.00015, defensiveDrift: -0.00002 };
  if (regime.id === "capital-preservation") return { indexDrift: -0.000055, growthDrift: -0.00008, defensiveDrift: 0.000035 };
  return { indexDrift: 0, growthDrift: 0.000025, defensiveDrift: 0.000015 };
}

function assetRegimeTilt(assetId: FundAssetId, growthDrift: number, defensiveDrift: number) {
  if (assetId === "aurora" || assetId === "photonix" || assetId === "memora" || assetId === "cloudforge") return growthDrift;
  return defensiveDrift;
}

export function applyRegimeFrame(state: HedgeFundState, regime: FundRegime, dt: number): HedgeFundState {
  if (state.mode !== "playing" || dt <= 0) return state;
  const clampedDt = Math.max(0, Math.min(0.05, dt));
  const wave = regimeWave(regime, state.elapsed);
  const prices = { ...state.prices };
  const volatilityPulse = 1 + Math.sin(state.elapsed * 0.73) * 0.00011 * regime.volatilityMultiplier;

  for (const asset of fundAssets) {
    const tilt = assetRegimeTilt(asset.id, wave.growthDrift, wave.defensiveDrift);
    prices[asset.id] = Math.max(3, prices[asset.id] * (1 + (tilt * clampedDt) + (volatilityPulse - 1) * clampedDt));
  }

  const indexPrice = Math.max(10, state.indexPrice * (1 + wave.indexDrift * clampedDt));
  return { ...state, prices, indexPrice };
}

export type MandateCheck = {
  compliant: boolean;
  grossBreach: boolean;
  betaBreach: boolean;
  netBreach: boolean;
  drawdownBreach: boolean;
  pressure: number;
  summary: string;
};

export function evaluateMandate(state: HedgeFundState, regime: FundRegime): MandateCheck {
  const stats = fundStats(state);
  const grossBreach = stats.grossExposure > regime.grossLimit;
  const betaBreach = Math.abs(stats.betaExposure) > regime.betaLimit;
  const netBreach = regime.id === "market-neutral" && Math.abs(stats.netExposure) > 0.30;
  const drawdownBreach = stats.drawdown > regime.drawdownLimit;
  const pressure =
    Math.max(0, stats.grossExposure - regime.grossLimit) * 1.4 +
    Math.max(0, Math.abs(stats.betaExposure) - regime.betaLimit) * 1.9 +
    (regime.id === "market-neutral" ? Math.max(0, Math.abs(stats.netExposure) - 0.30) * 1.5 : 0) +
    Math.max(0, stats.drawdown - regime.drawdownLimit) * 5;
  const breaches = [grossBreach ? "gross" : null, betaBreach ? "beta" : null, netBreach ? "net" : null, drawdownBreach ? "drawdown" : null].filter(Boolean);
  return {
    compliant: breaches.length === 0,
    grossBreach,
    betaBreach,
    netBreach,
    drawdownBreach,
    pressure,
    summary: breaches.length ? `Mandate breach: ${breaches.join(" / ")}` : "Mandate compliant",
  };
}

export function applyMandatePressure(state: HedgeFundState, regime: FundRegime, dt: number): HedgeFundState {
  if (state.mode !== "playing") return state;
  const check = evaluateMandate(state, regime);
  if (check.compliant) return state;
  const staffProtection = Math.max(0.45, 1 - state.staff.risk * 0.18);
  const reputationLoss = check.pressure * Math.max(0, dt) * 10 * staffProtection;
  const reputation = Math.max(0, state.reputation - reputationLoss);
  const hardDrawdownFailure = check.drawdownBreach && fundStats(state).drawdown >= regime.drawdownLimit + 0.025;
  return {
    ...state,
    reputation,
    riskBreaches: state.riskBreaches + check.pressure * Math.max(0, dt),
    mode: hardDrawdownFailure || reputation <= 0 ? "gameover" : state.mode,
  };
}

export function regimeScoreAdjustment(state: HedgeFundState, regime: FundRegime) {
  const stats = fundStats(state);
  const check = evaluateMandate(state, regime);
  let adjustment = check.compliant ? 225 : -Math.round(check.pressure * 1400);
  if (regime.id === "market-neutral") adjustment += Math.round((0.22 - Math.min(0.22, Math.abs(stats.betaExposure))) * 900);
  if (regime.id === "capital-preservation") adjustment += Math.round((regime.drawdownLimit - Math.min(regime.drawdownLimit, state.maxDrawdown)) * 4500);
  if (regime.id === "risk-on-momentum") adjustment += Math.round(Math.max(0, stats.pnl) / 80_000);
  if (regime.id === "macro-whipsaw" && state.hedgeActive) adjustment += 120;
  return adjustment;
}
