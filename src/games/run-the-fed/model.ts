export type ScenarioId =
  | "soft-landing"
  | "inflation-shock"
  | "recession"
  | "asset-bubble"
  | "energy-shock";

export type MacroSnapshot = {
  quarter: number;
  policyRate: number;
  inflation: number;
  unemployment: number;
  growth: number;
  consumerSpending: number;
  businessInvestment: number;
  assetPrices: number;
  financialStability: number;
};

export type ScenarioShock = {
  quarter: number;
  title: string;
  description: string;
  inflation: number;
  unemployment: number;
  growth: number;
  spending: number;
  investment: number;
  assets: number;
  stability: number;
};

export type FedScenario = {
  id: ScenarioId;
  name: string;
  brief: string;
  neutralRate: number;
  start: Omit<MacroSnapshot, "quarter">;
  shocks: readonly ScenarioShock[];
};

export type QuarterResult = {
  next: MacroSnapshot;
  explanation: string;
  shock: ScenarioShock | null;
};

export type ScoreResult = {
  score: number;
  grade: "A" | "B" | "C" | "D";
  diagnosis: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;

export const fedScenarios: readonly FedScenario[] = [
  {
    id: "soft-landing",
    name: "Soft Landing",
    brief: "Inflation is still elevated, growth is above trend, and the labor market is tight. Cool demand without causing an unnecessary recession.",
    neutralRate: 2.75,
    start: {
      policyRate: 4.5,
      inflation: 4.2,
      unemployment: 3.7,
      growth: 2.8,
      consumerSpending: 103,
      businessInvestment: 102,
      assetPrices: 108,
      financialStability: 88,
    },
    shocks: [
      {
        quarter: 3,
        title: "Demand cools",
        description: "Households begin to slow discretionary spending as previous tightening works through credit conditions.",
        inflation: -0.2,
        unemployment: 0.1,
        growth: -0.3,
        spending: -1.2,
        investment: -0.5,
        assets: -1,
        stability: 1,
      },
    ],
  },
  {
    id: "inflation-shock",
    name: "Inflation Shock",
    brief: "Inflation is running above target when a fresh price shock hits. Restore price stability without over-tightening the economy.",
    neutralRate: 2.75,
    start: {
      policyRate: 3.25,
      inflation: 3.2,
      unemployment: 4,
      growth: 2.4,
      consumerSpending: 101,
      businessInvestment: 101,
      assetPrices: 105,
      financialStability: 90,
    },
    shocks: [
      {
        quarter: 2,
        title: "Broad price shock",
        description: "Input costs jump across several sectors, lifting prices while weighing on real activity.",
        inflation: 1.2,
        unemployment: 0.1,
        growth: -0.4,
        spending: -0.8,
        investment: -0.9,
        assets: -2,
        stability: -1,
      },
    ],
  },
  {
    id: "recession",
    name: "Recession",
    brief: "Growth has stalled and unemployment is climbing while policy remains restrictive. Support activity without reigniting inflation.",
    neutralRate: 2.5,
    start: {
      policyRate: 4.25,
      inflation: 2.5,
      unemployment: 4.8,
      growth: 0.3,
      consumerSpending: 97,
      businessInvestment: 95,
      assetPrices: 96,
      financialStability: 84,
    },
    shocks: [
      {
        quarter: 1,
        title: "Credit contraction",
        description: "Banks tighten lending standards, hitting hiring, investment, and interest-sensitive spending.",
        inflation: -0.2,
        unemployment: 0.4,
        growth: -1.1,
        spending: -1.4,
        investment: -2,
        assets: -4,
        stability: -4,
      },
    ],
  },
  {
    id: "asset-bubble",
    name: "Asset Bubble",
    brief: "Growth is strong and financial markets are exuberant. Lean against overheating without destabilizing the financial system.",
    neutralRate: 2.75,
    start: {
      policyRate: 3,
      inflation: 2.8,
      unemployment: 3.6,
      growth: 3.1,
      consumerSpending: 104,
      businessInvestment: 105,
      assetPrices: 118,
      financialStability: 81,
    },
    shocks: [
      {
        quarter: 4,
        title: "Risk-off reversal",
        description: "Valuations reset suddenly, tightening financial conditions and exposing fragile balance sheets.",
        inflation: -0.2,
        unemployment: 0.2,
        growth: -0.7,
        spending: -0.7,
        investment: -1.1,
        assets: -12,
        stability: -8,
      },
    ],
  },
  {
    id: "energy-shock",
    name: "Energy Shock",
    brief: "An energy-price spike raises inflation while weakening real growth. Decide how much of the supply shock monetary policy should offset.",
    neutralRate: 2.75,
    start: {
      policyRate: 3.5,
      inflation: 3.5,
      unemployment: 4,
      growth: 1.8,
      consumerSpending: 100,
      businessInvestment: 99,
      assetPrices: 101,
      financialStability: 88,
    },
    shocks: [
      {
        quarter: 2,
        title: "Energy supply shock",
        description: "Fuel and power costs surge, lifting headline prices and squeezing household purchasing power.",
        inflation: 1.5,
        unemployment: 0.2,
        growth: -0.8,
        spending: -1.3,
        investment: -0.7,
        assets: -3,
        stability: -2,
      },
    ],
  },
] as const;

export function getFedScenario(id: ScenarioId): FedScenario {
  const scenario = fedScenarios.find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`Unknown Fed scenario: ${id}`);
  return scenario;
}

export function initialFedState(scenario: FedScenario): MacroSnapshot {
  return { quarter: 0, ...scenario.start };
}

export function normalizePolicyRate(rate: number): number {
  return clamp(Math.round(rate * 4) / 4, 0, 10);
}

export function advanceQuarter(
  current: MacroSnapshot,
  selectedRate: number,
  scenario: FedScenario,
): QuarterResult {
  if (current.quarter >= 8) throw new Error("Simulation already complete");

  const policyRate = normalizePolicyRate(selectedRate);
  const nextQuarter = current.quarter + 1;
  const shock = scenario.shocks.find((candidate) => candidate.quarter === nextQuarter) ?? null;
  const gap = policyRate - scenario.neutralRate;
  const move = policyRate - current.policyRate;
  const excessGrowth = current.growth - 2;

  const growth = clamp(
    current.growth * 0.42 + 2 * 0.58 - gap * 0.3 + (shock?.growth ?? 0),
    -5,
    7,
  );
  const inflation = clamp(
    current.inflation * 0.72 + 2 * 0.28 - gap * 0.13 + excessGrowth * 0.06 + (shock?.inflation ?? 0),
    -1,
    10,
  );
  const unemployment = clamp(
    current.unemployment + gap * 0.08 - excessGrowth * 0.05 + (shock?.unemployment ?? 0),
    2.5,
    12,
  );
  const consumerSpending = clamp(
    current.consumerSpending + (growth - 2) * 0.7 - gap * 0.45 + (shock?.spending ?? 0),
    75,
    130,
  );
  const businessInvestment = clamp(
    current.businessInvestment + (growth - 2) * 0.95 - gap * 0.7 + (shock?.investment ?? 0),
    70,
    140,
  );
  const assetPrices = clamp(
    current.assetPrices + (growth - 2) * 1.1 - gap * 1.15 + (shock?.assets ?? 0),
    60,
    160,
  );
  const bubblePenalty = Math.max(0, current.assetPrices - 112) * 0.08;
  const financialStability = clamp(
    current.financialStability + 0.7 - Math.abs(move) * 2.2 - bubblePenalty + (shock?.stability ?? 0),
    20,
    100,
  );

  const next: MacroSnapshot = {
    quarter: nextQuarter,
    policyRate: round2(policyRate),
    inflation: round1(inflation),
    unemployment: round1(unemployment),
    growth: round1(growth),
    consumerSpending: round1(consumerSpending),
    businessInvestment: round1(businessInvestment),
    assetPrices: round1(assetPrices),
    financialStability: round1(financialStability),
  };

  const stance = gap > 0.25 ? "restrictive" : gap < -0.25 ? "supportive" : "near neutral";
  const moveText = Math.abs(move) < 0.01
    ? "You held the policy rate steady."
    : `You ${move > 0 ? "raised" : "cut"} the policy rate by ${Math.abs(move).toFixed(2)} points.`;
  const shockText = shock ? ` ${shock.title}: ${shock.description}` : "";
  const explanation = `${moveText} Policy is ${stance}; demand and inflation respond with lags, while abrupt moves can strain financial stability.${shockText}`;

  return { next, explanation, shock };
}

export function scoreFedRun(history: readonly MacroSnapshot[]): ScoreResult {
  if (!history.length) return { score: 0, grade: "D", diagnosis: "No quarters completed yet." };

  const average = (selector: (state: MacroSnapshot) => number) =>
    history.reduce((sum, state) => sum + selector(state), 0) / history.length;

  const inflationError = average((state) => Math.abs(state.inflation - 2));
  const unemploymentError = average((state) => Math.abs(state.unemployment - 4.2));
  const growthError = average((state) => Math.abs(state.growth - 2));
  const stabilityShortfall = average((state) => Math.max(0, 80 - state.financialStability));
  const rateVolatility = history.slice(1).reduce((sum, state, index) => {
    return sum + Math.abs(state.policyRate - history[index].policyRate);
  }, 0) / Math.max(1, history.length - 1);

  const penalty =
    inflationError * 10 +
    unemploymentError * 5 +
    growthError * 6 +
    stabilityShortfall * 0.45 +
    rateVolatility * 3;
  const score = Math.round(clamp(100 - penalty, 0, 100));
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D";

  const final = history[history.length - 1];
  const diagnosis = final.inflation > 3
    ? "Inflation remained the main problem. More sustained restraint or earlier tightening may have helped."
    : final.unemployment > 5.5 || final.growth < 0.5
      ? "The economy finished weak. Policy may have stayed restrictive for too long or adjusted too abruptly."
      : final.financialStability < 65
        ? "Macro outcomes improved, but financial stability deteriorated. Smaller policy moves may have reduced stress."
        : "You kept the economy relatively balanced across inflation, employment, growth, and financial stability.";

  return { score, grade, diagnosis };
}
