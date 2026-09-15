import { createTrafficState, pressure, stepTraffic, type TrafficAction, type TrafficState } from "./simulation";

export type TrafficPrototypeSession = {
  state: TrafficState;
  peakPressure: number;
  switches: number;
};

export type TrafficPressureBand = "clear" | "building" | "critical";

export function trafficPressureBand(value: number): TrafficPressureBand {
  if (value < 0.4) return "clear";
  if (value < 0.75) return "building";
  return "critical";
}

export function createTrafficPrototype(seed = 1): TrafficPrototypeSession {
  return { state: createTrafficState(seed), peakPressure: 0, switches: 0 };
}

export function advanceTrafficPrototype(
  session: TrafficPrototypeSession,
  action: TrafficAction,
): TrafficPrototypeSession {
  const state = stepTraffic(session.state, action);
  const currentPressure = pressure(state);
  return {
    state,
    peakPressure: Math.max(session.peakPressure, currentPressure),
    switches: session.switches + Number(action === "switch"),
  };
}

export function trafficPrototypeView(session: TrafficPrototypeSession) {
  const currentPressure = pressure(session.state);
  return {
    tick: session.state.tick,
    score: session.state.score,
    combo: session.state.combo,
    phase: session.state.phase,
    switching: session.state.phase === "ALL_RED",
    nsQueue: session.state.nsQueue,
    ewQueue: session.state.ewQueue,
    pressure: currentPressure,
    pressureBand: trafficPressureBand(currentPressure),
    complete: session.state.complete,
    gameOverReason: session.state.gameOverReason ?? null,
  } as const;
}

export function trafficPrototypeResult(session: TrafficPrototypeSession) {
  if (!session.state.complete) return null;
  return {
    score: session.state.score,
    ticks: session.state.tick,
    switches: session.switches,
    peakPressure: session.peakPressure,
    reason: session.state.gameOverReason ?? "gridlock",
  } as const;
}
