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

export function pressure(state: TrafficState) {
  return Math.max(state.nsQueue, state.ewQueue) / MAX_QUEUE;
}
