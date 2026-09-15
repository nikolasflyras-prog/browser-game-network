import { createSwitchyardState, playSwitchyardTurn, type SwitchyardAction, type SwitchyardState } from "./simulation";

export type SwitchyardPrototypeSession = {
  state: SwitchyardState;
};

export function createSwitchyardPrototype(seed = 17, maxTurns = 10): SwitchyardPrototypeSession {
  return { state: createSwitchyardState(seed, maxTurns) };
}

export function chooseSwitchyardAction(
  session: SwitchyardPrototypeSession,
  action: SwitchyardAction,
): SwitchyardPrototypeSession {
  return { state: playSwitchyardTurn(session.state, action) };
}

export function switchyardPrototypeView(session: SwitchyardPrototypeSession) {
  return {
    turn: session.state.turn,
    maxTurns: session.state.maxTurns,
    score: session.state.score,
    strikes: session.state.strikes,
    switches: { ...session.state.switches },
    target: session.state.target,
    complete: session.state.complete,
    won: session.state.won,
    lastOutcome: session.state.history.at(-1) ?? null,
  } as const;
}

export function switchyardPrototypeResult(session: SwitchyardPrototypeSession) {
  if (!session.state.complete) return null;
  return {
    score: session.state.score,
    strikes: session.state.strikes,
    turns: session.state.turn,
    won: session.state.won,
    sequence: session.state.history.map((entry) => entry.correct),
  } as const;
}
