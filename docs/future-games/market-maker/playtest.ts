import { createMarketMakerState, playMarketRound, type MarketMakerState, type QuotePosture } from "./simulation";

export type MarketMakerBotPolicy = "tight" | "balanced" | "wide" | "inventory-aware";

export type MarketMakerPlaytestResult = {
  seed: number;
  policy: MarketMakerBotPolicy;
  score: number;
  endingInventory: number;
  peakInventory: number;
  totalFills: number;
};

export function chooseMarketPosture(state: MarketMakerState, policy: MarketMakerBotPolicy): QuotePosture {
  if (policy !== "inventory-aware") return policy;
  if (state.inventory >= 2) return "lean-short";
  if (state.inventory <= -2) return "lean-long";
  return "balanced";
}

export function runMarketMakerPlaytest(seed: number, policy: MarketMakerBotPolicy, rounds = 16): MarketMakerPlaytestResult {
  let state = createMarketMakerState(seed, rounds);
  let peakInventory = 0;
  let totalFills = 0;

  while (!state.complete) {
    const posture = chooseMarketPosture(state, policy);
    state = playMarketRound(state, posture);
    peakInventory = Math.max(peakInventory, Math.abs(state.inventory));
    const latest = state.history[state.history.length - 1];
    totalFills += Number(latest.buyFill) + Number(latest.sellFill);
  }

  return {
    seed,
    policy,
    score: state.score,
    endingInventory: state.inventory,
    peakInventory,
    totalFills,
  };
}

export function auditMarketMakerBalance(seeds = 256, rounds = 16) {
  const policies: readonly MarketMakerBotPolicy[] = ["tight", "balanced", "wide", "inventory-aware"];
  const seedList = Array.from({ length: seeds }, (_, index) => index + 1);
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

  return Object.fromEntries(
    policies.map((policy) => {
      const results = seedList.map((seed) => runMarketMakerPlaytest(seed, policy, rounds));
      return [
        policy,
        {
          averageScore: average(results.map((run) => run.score)),
          averageAbsEndingInventory: average(results.map((run) => Math.abs(run.endingInventory))),
          averagePeakInventory: average(results.map((run) => run.peakInventory)),
          averageFills: average(results.map((run) => run.totalFills)),
        },
      ];
    }),
  ) as Record<MarketMakerBotPolicy, {
    averageScore: number;
    averageAbsEndingInventory: number;
    averagePeakInventory: number;
    averageFills: number;
  }>;
}
