import {
  createSwitchyardState,
  playSwitchyardTurn,
  routeAfterAction,
  type SwitchyardAction,
  type SwitchyardState,
} from "./simulation";

export type SwitchyardBotPolicy = "oracle" | SwitchyardAction;

export type SwitchyardPlaytestResult = {
  seed: number;
  policy: SwitchyardBotPolicy;
  score: number;
  turns: number;
  strikes: number;
  won: boolean;
};

const ACTIONS: readonly SwitchyardAction[] = ["HOLD", "A", "B", "C"];

function oracleAction(state: SwitchyardState): SwitchyardAction {
  return ACTIONS.find((action) => routeAfterAction(state.switches, action) === state.target) ?? "HOLD";
}

export function runSwitchyardPlaytest(
  seed: number,
  policy: SwitchyardBotPolicy,
  maxTurns = 10,
): SwitchyardPlaytestResult {
  let state = createSwitchyardState(seed, maxTurns);

  while (!state.complete) {
    state = playSwitchyardTurn(state, policy === "oracle" ? oracleAction(state) : policy);
  }

  return {
    seed,
    policy,
    score: state.score,
    turns: state.turn,
    strikes: state.strikes,
    won: state.won,
  };
}

export function auditSwitchyardBalance(seeds = 256, maxTurns = 10) {
  const policies: readonly SwitchyardBotPolicy[] = ["oracle", "HOLD", "A", "B", "C"];
  const seedList = Array.from({ length: seeds }, (_, index) => index + 1);
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

  return Object.fromEntries(
    policies.map((policy) => {
      const results = seedList.map((seed) => runSwitchyardPlaytest(seed, policy, maxTurns));
      return [
        policy,
        {
          winRate: results.filter((result) => result.won).length / results.length,
          averageScore: average(results.map((result) => result.score)),
          averageTurns: average(results.map((result) => result.turns)),
        },
      ];
    }),
  ) as Record<SwitchyardBotPolicy, { winRate: number; averageScore: number; averageTurns: number }>;
}
