export type QuotePosture = "tight" | "balanced" | "wide" | "lean-long" | "lean-short";

export type MarketRound = {
  round: number;
  posture: QuotePosture;
  bid: number;
  ask: number;
  fairBefore: number;
  fairAfter: number;
  buyFill: boolean;
  sellFill: boolean;
  inventoryBefore: number;
  inventoryAfter: number;
  cashAfter: number;
  markedPnl: number;
  riskPenalty: number;
  scoreAfter: number;
  feedback: string;
};

export type MarketMakerState = {
  round: number;
  maxRounds: number;
  fairValue: number;
  inventory: number;
  cash: number;
  score: number;
  seed: number;
  complete: boolean;
  history: readonly MarketRound[];
};

type QuoteProfile = {
  halfSpread: number;
  skew: number;
  fillBias: number;
};

const PROFILES: Record<QuotePosture, QuoteProfile> = {
  tight: { halfSpread: 0.06, skew: 0, fillBias: 0.18 },
  balanced: { halfSpread: 0.12, skew: 0, fillBias: 0 },
  wide: { halfSpread: 0.22, skew: 0, fillBias: -0.16 },
  "lean-long": { halfSpread: 0.13, skew: 0.07, fillBias: -0.01 },
  "lean-short": { halfSpread: 0.13, skew: -0.07, fillBias: -0.01 },
};

function nextRandom(seed: number) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

function roundToCent(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createMarketMakerState(seed = 7, maxRounds = 16): MarketMakerState {
  return {
    round: 0,
    maxRounds,
    fairValue: 100,
    inventory: 0,
    cash: 0,
    score: 0,
    seed,
    complete: false,
    history: [],
  };
}

export function quoteFor(state: MarketMakerState, posture: QuotePosture) {
  const profile = PROFILES[posture];
  const inventorySkew = clamp(state.inventory * 0.015, -0.15, 0.15);
  const center = state.fairValue + profile.skew - inventorySkew;
  return {
    bid: roundToCent(center - profile.halfSpread),
    ask: roundToCent(center + profile.halfSpread),
  };
}

export function playMarketRound(state: MarketMakerState, posture: QuotePosture): MarketMakerState {
  if (state.complete) return state;

  const fairBefore = state.fairValue;
  const inventoryBefore = state.inventory;
  const profile = PROFILES[posture];
  const quote = quoteFor(state, posture);

  let seed = state.seed;
  const buyRoll = nextRandom(seed);
  seed = buyRoll.seed;
  const sellRoll = nextRandom(seed);
  seed = sellRoll.seed;
  const moveRoll = nextRandom(seed);
  seed = moveRoll.seed;
  const pressureRoll = nextRandom(seed);
  seed = pressureRoll.seed;

  const directionalPressure = pressureRoll.value * 2 - 1;
  const spreadCost = profile.halfSpread * 0.9;
  const buyFillProbability = clamp(0.58 + profile.fillBias + directionalPressure * 0.16 - spreadCost, 0.08, 0.94);
  const sellFillProbability = clamp(0.58 + profile.fillBias - directionalPressure * 0.16 - spreadCost, 0.08, 0.94);

  const buyFill = buyRoll.value < buyFillProbability;
  const sellFill = sellRoll.value < sellFillProbability;

  let inventory = state.inventory;
  let cash = state.cash;

  // Customer buys from us at our ask: inventory falls, cash rises.
  if (buyFill) {
    inventory -= 1;
    cash += quote.ask;
  }

  // Customer sells to us at our bid: inventory rises, cash falls.
  if (sellFill) {
    inventory += 1;
    cash -= quote.bid;
  }

  const volatility = 0.32;
  const randomMove = (moveRoll.value * 2 - 1) * volatility;
  const informedMove = directionalPressure * 0.16;
  const fairAfter = roundToCent(Math.max(1, fairBefore + randomMove + informedMove));

  const markedPnl = roundToCent(cash + inventory * fairAfter);
  const riskPenalty = roundToCent(Math.max(0, Math.abs(inventory) - 2) ** 2 * 0.18);
  const score = roundToCent(markedPnl - riskPenalty);

  let feedback = "Your quotes balanced spread capture and inventory risk.";
  if (buyFill && sellFill) feedback = "You captured both sides of the spread and finished the round flat to the two customer trades.";
  else if (!buyFill && !sellFill) feedback = "No flow reached your quotes. Wider pricing can protect you, but it may also earn nothing.";
  else if (Math.abs(inventory) >= 4) feedback = "Inventory is becoming the main risk. Skew quotes to encourage flow that reduces the position.";
  else if (posture === "tight") feedback = "Tight quotes attracted flow, increasing both spread opportunity and exposure to informed trading.";
  else if (posture === "wide") feedback = "Wide quotes reduced fill risk, but you gave up trading opportunities.";

  const nextRound = state.round + 1;
  const entry: MarketRound = {
    round: nextRound,
    posture,
    bid: quote.bid,
    ask: quote.ask,
    fairBefore,
    fairAfter,
    buyFill,
    sellFill,
    inventoryBefore,
    inventoryAfter: inventory,
    cashAfter: roundToCent(cash),
    markedPnl,
    riskPenalty,
    scoreAfter: score,
    feedback,
  };

  return {
    ...state,
    round: nextRound,
    fairValue: fairAfter,
    inventory,
    cash: roundToCent(cash),
    score,
    seed,
    complete: nextRound >= state.maxRounds,
    history: [...state.history, entry],
  };
}

export function inventoryRiskLabel(inventory: number) {
  const absolute = Math.abs(inventory);
  if (absolute <= 1) return "low" as const;
  if (absolute <= 3) return "medium" as const;
  return "high" as const;
}
