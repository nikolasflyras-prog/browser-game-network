export type SwitchId = "A" | "B" | "C";
export type SwitchyardAction = SwitchId | "HOLD";
export type Depot = 0 | 1 | 2 | 3;

export type SwitchyardState = {
  turn: number;
  maxTurns: number;
  score: number;
  strikes: number;
  switches: Record<SwitchId, boolean>;
  target: Depot;
  seed: number;
  complete: boolean;
  won: boolean;
  history: readonly {
    turn: number;
    action: SwitchyardAction;
    target: Depot;
    actual: Depot;
    correct: boolean;
  }[];
};

const ACTIONS: readonly SwitchyardAction[] = ["HOLD", "A", "B", "C"];

function nextRandom(seed: number) {
  const next = (seed * 1103515245 + 12345) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

export function routeDepot(switches: Record<SwitchId, boolean>): Depot {
  if (!switches.A) return switches.B ? 1 : 0;
  return switches.C ? 3 : 2;
}

export function describeSwitchyardRoute(switches: Record<SwitchId, boolean>) {
  return `A→${switches.A ? "RIGHT" : "LEFT"} · B→D${switches.B ? 1 : 0} · C→D${switches.C ? 3 : 2}`;
}

function applyAction(switches: Record<SwitchId, boolean>, action: SwitchyardAction) {
  if (action === "HOLD") return { ...switches };
  return { ...switches, [action]: !switches[action] };
}

export function routeAfterAction(switches: Record<SwitchId, boolean>, action: SwitchyardAction) {
  return routeDepot(applyAction(switches, action));
}

function reachableDepotsForSwitches(switches: Record<SwitchId, boolean>): Depot[] {
  return [...new Set(ACTIONS.map((action) => routeAfterAction(switches, action)))].sort() as Depot[];
}

function generateTarget(switches: Record<SwitchId, boolean>, seed: number) {
  const roll = nextRandom(seed);
  const depots = reachableDepotsForSwitches(switches);
  const index = Math.min(depots.length - 1, Math.floor(roll.value * depots.length));
  return {
    seed: roll.seed,
    target: depots[index] ?? 0,
  };
}

export function createSwitchyardState(seed = 17, maxTurns = 10): SwitchyardState {
  const switches = { A: false, B: false, C: false };
  const generated = generateTarget(switches, seed);
  return {
    turn: 0,
    maxTurns,
    score: 0,
    strikes: 0,
    switches,
    target: generated.target,
    seed: generated.seed,
    complete: false,
    won: false,
    history: [],
  };
}

export function playSwitchyardTurn(state: SwitchyardState, action: SwitchyardAction): SwitchyardState {
  if (state.complete) return state;

  const switches = applyAction(state.switches, action);
  const actual = routeDepot(switches);
  const correct = actual === state.target;
  const turn = state.turn + 1;
  const score = state.score + (correct ? 100 - state.strikes * 10 : 0);
  const strikes = state.strikes + (correct ? 0 : 1);
  const terminal = strikes >= 3 || turn >= state.maxTurns;

  let seed = state.seed;
  let target = state.target;
  if (!terminal) {
    const generated = generateTarget(switches, seed);
    seed = generated.seed;
    target = generated.target;
  }

  return {
    ...state,
    turn,
    score,
    strikes,
    switches,
    target,
    seed,
    complete: terminal,
    won: terminal && strikes < 3 && turn >= state.maxTurns,
    history: [
      ...state.history,
      { turn, action, target: state.target, actual, correct },
    ],
  };
}

export function reachableDepots(state: SwitchyardState): Depot[] {
  return reachableDepotsForSwitches(state.switches);
}
