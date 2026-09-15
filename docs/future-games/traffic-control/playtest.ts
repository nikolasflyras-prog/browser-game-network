import { createTrafficState, stepTraffic, type TrafficAction, type TrafficState } from "./simulation";

export type TrafficBotPolicy = "idle" | "pressure" | "periodic";

export type TrafficPlaytestResult = {
  seed: number;
  policy: TrafficBotPolicy;
  ticks: number;
  score: number;
  switches: number;
  peakQueue: number;
  complete: boolean;
};

function choosePressureAction(state: TrafficState): TrafficAction {
  if (state.phase === "ALL_RED") return "none";
  const activeQueue = state.phase === "NS" ? state.nsQueue : state.ewQueue;
  const waitingQueue = state.phase === "NS" ? state.ewQueue : state.nsQueue;

  if (waitingQueue >= 7) return "switch";
  if (waitingQueue >= 3 && waitingQueue >= activeQueue + 2) return "switch";
  if (activeQueue === 0 && waitingQueue >= 2) return "switch";
  return "none";
}

export function runTrafficPlaytest(
  seed: number,
  policy: TrafficBotPolicy,
  maxTicks = 1800,
  periodicInterval = 18,
): TrafficPlaytestResult {
  let state = createTrafficState(seed);
  let switches = 0;
  let peakQueue = 0;

  while (!state.complete && state.tick < maxTicks) {
    let action: TrafficAction = "none";
    if (policy === "pressure") action = choosePressureAction(state);
    if (policy === "periodic" && state.tick > 0 && state.tick % periodicInterval === 0 && state.phase !== "ALL_RED") {
      action = "switch";
    }

    if (action === "switch") switches += 1;
    state = stepTraffic(state, action);
    peakQueue = Math.max(peakQueue, state.nsQueue, state.ewQueue);
  }

  return {
    seed,
    policy,
    ticks: state.tick,
    score: state.score,
    switches,
    peakQueue,
    complete: state.complete,
  };
}

function summarize(results: readonly TrafficPlaytestResult[]) {
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    averageTicks: average(results.map((run) => run.ticks)),
    averageScore: average(results.map((run) => run.score)),
    survivalRate: results.filter((run) => !run.complete).length / results.length,
    averageSwitches: average(results.map((run) => run.switches)),
  };
}

export function auditTrafficBalance(seeds = 64, maxTicks = 1800) {
  const seedList = Array.from({ length: seeds }, (_, index) => index + 1);
  const idle = summarize(seedList.map((seed) => runTrafficPlaytest(seed, "idle", maxTicks)));
  const pressure = summarize(seedList.map((seed) => runTrafficPlaytest(seed, "pressure", maxTicks)));
  const periodicIntervals = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40] as const;
  const periodic = periodicIntervals.map((interval) => ({
    interval,
    ...summarize(seedList.map((seed) => runTrafficPlaytest(seed, "periodic", maxTicks, interval))),
  }));
  const bestPeriodic = periodic.reduce((best, candidate) =>
    candidate.averageScore > best.averageScore ? candidate : best,
  );

  return { seeds, idle, pressure, periodic, bestPeriodic };
}
