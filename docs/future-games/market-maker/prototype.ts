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
  return {
    score: session.state.score,
    endingInventory: session.state.inventory,
    cash: session.state.cash,
    fairValue: session.state.fairValue,
    style: marketMakerStyle(session.state),
  } as const;
}
