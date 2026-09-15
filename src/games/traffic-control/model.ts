export type Axis = "NS" | "EW";
export type SignalPhase = Axis | "ALL_RED";
export type TrafficAction = "none" | "switch";

export type TrafficState = {
  tick: number;
  score: number;
  combo: number;
  phase: SignalPhase;
  pendingPhase?: Axis;
  phaseTicksRemaining: number;
  nsQueue: number;
  ewQueue: number;
  nsArrivalIn: number;
  ewArrivalIn: number;
  spawnInterval: number;
  waveAxis: Axis;
  waveTicksRemaining: number;
  seed: number;
  complete: boolean;
  gameOverReason?: "gridlock";
};

export type TrafficSession = {
  state: TrafficState;
  peakPressure: number;
  switches: number;
};

export type TrafficBotPolicy = "idle" | "pressure" | "periodic";

const MAX_QUEUE = 9;
const SWITCH_DELAY = 3;
const HEAVY_WAVE_MULTIPLIER = 0.65;
const LIGHT_WAVE_MULTIPLIER = 1.25;
const MIN_WAVE_TICKS = 45;
const WAVE_JITTER_TICKS = 55;

function random(seed: number) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

function nextArrival(seed: number, interval: number) {
  const result = random(seed);
  const jitter = Math.max(1, Math.round(interval * (0.65 + result.value * 0.7)));
  return { seed: result.seed, ticks: jitter };
}

function difficultyInterval(tick: number) {
  if (tick > 900) return 3;
  if (tick > 600) return 4;
  if (tick > 360) return 5;
  if (tick > 180) return 6;
  return 8;
}

function arrivalIntervalForAxis(state: TrafficState, axis: Axis) {
  const waveMultiplier = state.waveAxis === axis ? HEAVY_WAVE_MULTIPLIER : LIGHT_WAVE_MULTIPLIER;
  return state.spawnInterval * waveMultiplier;
}

function advanceTrafficWave(state: TrafficState): TrafficState {
  const waveTicksRemaining = state.waveTicksRemaining - 1;
  if (waveTicksRemaining > 0) return { ...state, waveTicksRemaining };
  const axisRoll = random(state.seed);
  const durationRoll = random(axisRoll.seed);
  return {
    ...state,
    seed: durationRoll.seed,
    waveAxis: axisRoll.value < 0.5 ? "NS" : "EW",
    waveTicksRemaining: MIN_WAVE_TICKS + Math.round(durationRoll.value * WAVE_JITTER_TICKS),
  };
}

export function createTrafficState(seed = 1): TrafficState {
  return {
    tick: 0,
    score: 0,
    combo: 0,
    phase: "NS",
    phaseTicksRemaining: 0,
    nsQueue: 0,
    ewQueue: 0,
    nsArrivalIn: 4,
    ewArrivalIn: 7,
    spawnInterval: 8,
    waveAxis: "NS",
    waveTicksRemaining: 60,
    seed,
    complete: false,
  };
}

export function stepTraffic(state: TrafficState, action: TrafficAction): TrafficState {
  if (state.complete) return state;
  let next = { ...state, tick: state.tick + 1 };
  next.spawnInterval = difficultyInterval(next.tick);
  next = advanceTrafficWave(next);

  if (action === "switch" && (next.phase === "NS" || next.phase === "EW") && next.phaseTicksRemaining === 0) {
    next.pendingPhase = next.phase === "NS" ? "EW" : "NS";
    next.phase = "ALL_RED";
    next.phaseTicksRemaining = SWITCH_DELAY;
  }

  if (next.phase === "ALL_RED") {
    next.phaseTicksRemaining -= 1;
    if (next.phaseTicksRemaining <= 0) {
      next.phase = next.pendingPhase ?? "NS";
      next.pendingPhase = undefined;
      next.phaseTicksRemaining = 0;
    }
  }

  next.nsArrivalIn -= 1;
  next.ewArrivalIn -= 1;
  if (next.nsArrivalIn <= 0) {
    next.nsQueue += 1;
    const arrival = nextArrival(next.seed, arrivalIntervalForAxis(next, "NS"));
    next.seed = arrival.seed;
    next.nsArrivalIn = arrival.ticks;
  }
  if (next.ewArrivalIn <= 0) {
    next.ewQueue += 1;
    const arrival = nextArrival(next.seed, arrivalIntervalForAxis(next, "EW"));
    next.seed = arrival.seed;
    next.ewArrivalIn = arrival.ticks;
  }

  const canClear = next.phase !== "ALL_RED" && next.tick % 2 === 0;
  if (canClear && next.phase === "NS" && next.nsQueue > 0) {
    next.nsQueue -= 1;
    next.combo += 1;
    next.score += 10 + Math.min(40, next.combo);
  } else if (canClear && next.phase === "EW" && next.ewQueue > 0) {
    next.ewQueue -= 1;
    next.combo += 1;
    next.score += 10 + Math.min(40, next.combo);
  } else if (next.nsQueue >= 6 || next.ewQueue >= 6) {
    next.combo = Math.max(0, next.combo - 1);
  }

  if (next.nsQueue > MAX_QUEUE || next.ewQueue > MAX_QUEUE) {
    next.complete = true;
    next.gameOverReason = "gridlock";
  }
  return next;
}

export function trafficPressure(state: TrafficState) {
  return Math.max(state.nsQueue, state.ewQueue) / MAX_QUEUE;
}

export function createTrafficSession(seed = 1): TrafficSession {
  return { state: createTrafficState(seed), peakPressure: 0, switches: 0 };
}

export function advanceTrafficSession(session: TrafficSession, action: TrafficAction): TrafficSession {
  const state = stepTraffic(session.state, action);
  return {
    state,
    peakPressure: Math.max(session.peakPressure, trafficPressure(state)),
    switches: session.switches + Number(action === "switch"),
  };
}

export function trafficView(session: TrafficSession) {
  const pressure = trafficPressure(session.state);
  return {
    tick: session.state.tick,
    score: session.state.score,
    combo: session.state.combo,
    phase: session.state.phase,
    switching: session.state.phase === "ALL_RED",
    nsQueue: session.state.nsQueue,
    ewQueue: session.state.ewQueue,
    pressure,
    pressureBand: pressure < 0.4 ? "clear" : pressure < 0.75 ? "building" : "critical",
    complete: session.state.complete,
    gameOverReason: session.state.gameOverReason ?? null,
  } as const;
}

export function trafficResult(session: TrafficSession) {
  if (!session.state.complete) return null;
  return {
    score: session.state.score,
    ticks: session.state.tick,
    switches: session.switches,
    peakPressure: session.peakPressure,
    reason: session.state.gameOverReason ?? "gridlock",
  } as const;
}

function pressurePolicy(state: TrafficState): TrafficAction {
  if (state.phase === "ALL_RED") return "none";
  const activeQueue = state.phase === "NS" ? state.nsQueue : state.ewQueue;
  const waitingQueue = state.phase === "NS" ? state.ewQueue : state.nsQueue;
  if (waitingQueue >= 7) return "switch";
  if (waitingQueue >= 3 && waitingQueue >= activeQueue + 2) return "switch";
  if (activeQueue === 0 && waitingQueue >= 2) return "switch";
  return "none";
}

export function runTrafficPolicy(seed: number, policy: TrafficBotPolicy, maxTicks = 900, periodicInterval = 18) {
  let state = createTrafficState(seed);
  let switches = 0;
  while (!state.complete && state.tick < maxTicks) {
    let action: TrafficAction = "none";
    if (policy === "pressure") action = pressurePolicy(state);
    if (policy === "periodic" && state.tick > 0 && state.tick % periodicInterval === 0 && state.phase !== "ALL_RED") action = "switch";
    if (action === "switch") switches += 1;
    state = stepTraffic(state, action);
  }
  return { seed, policy, ticks: state.tick, score: state.score, switches, complete: state.complete };
}

export function auditTrafficBalance(seeds = 64, maxTicks = 900) {
  const seedList = Array.from({ length: seeds }, (_, index) => index + 1);
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const summarize = (runs: ReturnType<typeof runTrafficPolicy>[]) => ({
    averageTicks: average(runs.map((run) => run.ticks)),
    averageScore: average(runs.map((run) => run.score)),
  });
  const idle = summarize(seedList.map((seed) => runTrafficPolicy(seed, "idle", maxTicks)));
  const pressure = summarize(seedList.map((seed) => runTrafficPolicy(seed, "pressure", maxTicks)));
  const intervals = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40] as const;
  const periodic = intervals.map((interval) => ({ interval, ...summarize(seedList.map((seed) => runTrafficPolicy(seed, "periodic", maxTicks, interval))) }));
  const bestPeriodic = periodic.reduce((best, candidate) => candidate.averageScore > best.averageScore ? candidate : best);
  return { idle, pressure, periodic, bestPeriodic };
}
