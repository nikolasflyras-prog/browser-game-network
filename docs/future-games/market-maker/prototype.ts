import {
  createMarketMakerState,
  inventoryRiskLabel,
  playMarketRound,
  quoteFor,
  type MarketMakerState,
  type QuotePosture,
} from "./simulation";

export const marketMakerPostures: readonly QuotePosture[] = ["tight", "balanced", "wide", "lean-long", "lean-short"];

export type MarketMakerPrototypeSession = {
  state: MarketMakerState;
};

export type MarketMakerStyle = "balanced-dealer" | "inventory-heavy" | "loss-making" | "selective";

export function marketMakerStyle(state: MarketMakerState): MarketMakerStyle {
  if (state.score < 0) return "loss-making";
  if (Math.abs(state.inventory) >= 4) return "inventory-heavy";
  if (Math.abs(state.inventory) <= 1) return "balanced-dealer";
  return "selective";
}

export function createMarketMakerPrototype(seed = 7, maxRounds = 16): MarketMakerPrototypeSession {
  return { state: createMarketMakerState(seed, maxRounds) };
}

export function chooseMarketMakerPosture(
  session: MarketMakerPrototypeSession,
  posture: QuotePosture,
): MarketMakerPrototypeSession {
  return { state: playMarketRound(session.state, posture) };
}

export function marketMakerPrototypeView(session: MarketMakerPrototypeSession) {
  return {
    round: session.state.round,
    maxRounds: session.state.maxRounds,
    fairValue: session.state.fairValue,
    inventory: session.state.inventory,
    inventoryRisk: inventoryRiskLabel(session.state.inventory),
    score: session.state.score,
    complete: session.state.complete,
    quotes: marketMakerPostures.map((posture) => ({ posture, ...quoteFor(session.state, posture) })),
    lastRound: session.state.history.at(-1) ?? null,
  } as const;
}

export function marketMakerPrototypeResult(session: MarketMakerPrototypeSession) {
  if (!session.state.complete) return null;
  const totalFills = session.state.history.reduce(
    (sum, round) => sum + Number(round.buyFill) + Number(round.sellFill),
    0,
  );
  const peakInventory = session.state.history.reduce(
    (peak, round) => Math.max(peak, Math.abs(round.inventoryAfter)),
    0,
  );
  const totalRiskPenalty = session.state.history.reduce((sum, round) => sum + round.riskPenalty, 0);
  const noFlowRounds = session.state.history.filter((round) => !round.buyFill && !round.sellFill).length;

  return {
    score: session.state.score,
    endingInventory: session.state.inventory,
    cash: session.state.cash,
    fairValue: session.state.fairValue,
    style: marketMakerStyle(session.state),
    totalFills,
    peakInventory,
    totalRiskPenalty: Math.round(totalRiskPenalty * 100) / 100,
    noFlowRounds,
  } as const;
}
