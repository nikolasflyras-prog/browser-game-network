export type GridMetric = "reliability" | "cost" | "emissions" | "reserve" | "storage";
export type GridMetrics = Record<GridMetric, number>;

export type GridRequirement = { min: number };
export type GridChoice = {
  id: string;
  label: string;
  detail: string;
  impacts: Partial<GridMetrics>;
  requirements?: Partial<Record<GridMetric, GridRequirement>>;
  unavailableFeedback?: string;
  feedback: string;
};

export type GridScenario = {
  id: string;
  title: string;
  prompt: string;
  choices: readonly GridChoice[];
};

export type GridHistoryEntry = {
  scenarioId: string;
  choiceId: string;
  before: GridMetrics;
  after: GridMetrics;
  operatingPenalty: number;
  feedback: string;
};

export type PowerGridState = {
  scenarioIndex: number;
  metrics: GridMetrics;
  history: readonly GridHistoryEntry[];
  operatingPenalty: number;
  complete: boolean;
};

export type PowerGridResult = {
  score: number;
  style: "reliability-first" | "low-carbon" | "cost-minimizer" | "balanced-dispatch";
  strongestImprovement: { metric: GridMetric; delta: number } | null;
  biggestPressure: { metric: GridMetric; delta: number } | null;
};

export const initialGridMetrics: GridMetrics = {
  reliability: 92,
  cost: 52,
  emissions: 58,
  reserve: 48,
  storage: 52,
};

export const gridMetricDirections: Record<GridMetric, "higher" | "lower"> = {
  reliability: "higher",
  cost: "lower",
  emissions: "lower",
  reserve: "higher",
  storage: "higher",
};

export const gridScenarios: readonly GridScenario[] = [
  {
    id: "morning-ramp",
    title: "Morning ramp",
    prompt: "Demand rises faster than forecast while solar output is still low.",
    choices: [
      { id: "gas-ramp", label: "Ramp gas generation", detail: "Bring flexible gas units up quickly.", impacts: { reliability: 8, reserve: 6, cost: 8, emissions: 10 }, feedback: "Flexible gas protected reliability, but raised both operating cost and emissions." },
      { id: "battery", label: "Discharge batteries", detail: "Use stored energy to cover the ramp.", impacts: { reliability: 7, reserve: 4, storage: -20, cost: 2, emissions: -3 }, requirements: { storage: { min: 20 } }, unavailableFeedback: "There is not enough stored energy for this dispatch.", feedback: "Storage covered the short ramp cleanly, but left less energy for later stress periods." },
      { id: "demand-response", label: "Call demand response", detail: "Pay large users to reduce load temporarily.", impacts: { reliability: 6, reserve: 5, cost: 5, emissions: -5 }, feedback: "Reducing demand balanced the system without adding generation, but the program has a real cost." },
    ],
  },
  {
    id: "wind-drop",
    title: "Wind forecast miss",
    prompt: "Wind output falls sharply just as industrial load peaks.",
    choices: [
      { id: "peaker", label: "Start peakers", detail: "Use fast-start generation to restore reserves.", impacts: { reliability: 10, reserve: 11, cost: 14, emissions: 14 }, feedback: "Peakers restored reserves quickly, but they are expensive and emissions intensive." },
      { id: "battery-wind", label: "Use storage", detail: "Cover the renewable shortfall with batteries.", impacts: { reliability: 8, reserve: 7, storage: -24, cost: 3 }, requirements: { storage: { min: 24 } }, unavailableFeedback: "Earlier dispatches left too little stored energy to cover this wind shortfall.", feedback: "Storage smoothed the renewable miss, but depleted a limited flexibility resource." },
      { id: "accept-tight", label: "Run tight reserves", detail: "Avoid dispatch cost and hope conditions recover.", impacts: { reliability: -12, reserve: -18, cost: -4, emissions: -3 }, feedback: "You saved money in the moment, but violated the reliability buffer and exposed the system to the next contingency." },
    ],
  },
  {
    id: "heatwave",
    title: "Heatwave afternoon",
    prompt: "Air-conditioning demand reaches a new seasonal high and the reserve margin is shrinking.",
    choices: [
      { id: "all-resources", label: "Dispatch all firm capacity", detail: "Prioritize reliability regardless of cost.", impacts: { reliability: 12, reserve: 10, cost: 16, emissions: 11 }, feedback: "Firm generation protected the system, but at a high economic and environmental cost." },
      { id: "mixed-response", label: "Mix storage + demand response", detail: "Use two flexible resources to avoid the most expensive plants.", impacts: { reliability: 10, reserve: 8, storage: -15, cost: 8, emissions: -2 }, requirements: { storage: { min: 15 } }, unavailableFeedback: "Earlier battery use left too little stored energy for the mixed response.", feedback: "A portfolio response maintained reliability while limiting peaker use, at the cost of stored energy." },
      { id: "price-signal", label: "Use emergency pricing", detail: "Let scarcity prices reduce discretionary demand.", impacts: { reliability: 5, reserve: 5, cost: 11, emissions: -5 }, feedback: "Scarcity pricing reduced demand, but customers experienced a sharp price increase." },
    ],
  },
  {
    id: "transmission-outage",
    title: "Transmission outage",
    prompt: "A major line trips, trapping cheap generation away from the highest-demand zone.",
    choices: [
      { id: "local-dispatch", label: "Dispatch local generation", detail: "Use more expensive plants inside the constrained zone.", impacts: { reliability: 12, reserve: 6, cost: 13, emissions: 8 }, feedback: "Local generation solved the transmission constraint but increased system cost." },
      { id: "targeted-curtailment", label: "Targeted load reduction", detail: "Reduce demand inside the constrained zone.", impacts: { reliability: 8, reserve: 5, cost: 6, emissions: -4 }, feedback: "Targeted demand reduction relieved the overloaded path without requiring as much local generation." },
      { id: "reroute", label: "Reroute power flows", detail: "Use remaining transmission paths closer to their limits.", impacts: { reliability: 2, reserve: -3, cost: 1 }, feedback: "Re-dispatch bought time, but pushed other lines closer to their operating limits." },
    ],
  },
] as const;

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

function penaltyFor(metrics: GridMetrics) {
  const reliabilityShortfall = Math.max(0, 92 - metrics.reliability);
  const reserveShortfall = Math.max(0, 40 - metrics.reserve);
  return Math.round(reliabilityShortfall * 2 + reserveShortfall);
}

export function createPowerGridState(): PowerGridState {
  return { scenarioIndex: 0, metrics: { ...initialGridMetrics }, history: [], operatingPenalty: 0, complete: false };
}

export function currentGridScenario(state: PowerGridState) {
  return gridScenarios[state.scenarioIndex] ?? null;
}

export function gridChoiceAvailability(state: PowerGridState, choice: GridChoice) {
  const blocked = Object.entries(choice.requirements ?? {}).find(([metric, requirement]) => state.metrics[metric as GridMetric] < (requirement?.min ?? 0));
  return blocked ? { available: false, reason: choice.unavailableFeedback ?? "This response is not available with the remaining system resources." } : { available: true, reason: null };
}

export function playGridChoice(state: PowerGridState, choiceId: string): PowerGridState {
  if (state.complete) return state;
  const scenario = currentGridScenario(state);
  if (!scenario) return { ...state, complete: true };
  const choice = scenario.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} for ${scenario.id}`);
  const availability = gridChoiceAvailability(state, choice);
  if (!availability.available) throw new Error(availability.reason ?? `Choice ${choiceId} unavailable`);

  const before = { ...state.metrics };
  const after = { ...state.metrics };
  for (const metric of Object.keys(choice.impacts) as GridMetric[]) {
    after[metric] = clamp(after[metric] + (choice.impacts[metric] ?? 0));
  }
  const operatingPenalty = penaltyFor(after);
  const nextIndex = state.scenarioIndex + 1;
  return {
    scenarioIndex: nextIndex,
    metrics: after,
    history: [...state.history, { scenarioId: scenario.id, choiceId: choice.id, before, after: { ...after }, operatingPenalty, feedback: choice.feedback }],
    operatingPenalty: state.operatingPenalty + operatingPenalty,
    complete: nextIndex >= gridScenarios.length,
  };
}

export function gridOperatingSignals(metrics: GridMetrics) {
  const reliabilityState = metrics.reliability >= 92 ? "secure" : metrics.reliability >= 80 ? "watch" : "critical";
  const reserveState = metrics.reserve >= 40 ? "adequate" : metrics.reserve >= 25 ? "tight" : "critical";
  const storageState = metrics.storage >= 24 ? "flexible" : metrics.storage >= 15 ? "limited" : "depleted";
  return {
    reliabilityState,
    reserveState,
    storageState,
    windStorageReady: metrics.storage >= 24,
    heatwaveStorageReady: metrics.storage >= 15,
  } as const;
}

export function gridMetricChanges(entry: GridHistoryEntry | null) {
  if (!entry) return [];
  return (Object.keys(entry.before) as GridMetric[])
    .map((metric) => {
      const delta = entry.after[metric] - entry.before[metric];
      const improvement = gridMetricDirections[metric] === "higher" ? delta : -delta;
      return { metric, delta, improvement };
    })
    .filter((entry) => entry.delta !== 0);
}

export function gridFinalScore(metrics: GridMetrics, operatingPenalty = 0) {
  const costControl = 100 - metrics.cost;
  const emissionsControl = 100 - metrics.emissions;
  const raw = metrics.reliability * 0.4 + costControl * 0.2 + emissionsControl * 0.2 + metrics.reserve * 0.1 + metrics.storage * 0.1;
  return Math.max(0, Math.round(raw - operatingPenalty));
}

export function gridStyle(metrics: GridMetrics): PowerGridResult["style"] {
  if (metrics.reliability >= 90 && metrics.cost >= 72) return "reliability-first";
  if (metrics.emissions <= 45 && metrics.reliability >= 78) return "low-carbon";
  if (metrics.cost <= 45 && metrics.reserve < 40) return "cost-minimizer";
  return "balanced-dispatch";
}

export function powerGridResult(state: PowerGridState): PowerGridResult | null {
  if (!state.complete) return null;
  const ranked = (Object.keys(initialGridMetrics) as GridMetric[])
    .map((metric) => {
      const delta = state.metrics[metric] - initialGridMetrics[metric];
      const improvement = gridMetricDirections[metric] === "higher" ? delta : -delta;
      return { metric, delta, improvement };
    })
    .sort((a, b) => b.improvement - a.improvement);
  const strongest = ranked.find((entry) => entry.improvement > 0) ?? null;
  const pressure = [...ranked].reverse().find((entry) => entry.improvement < 0) ?? null;
  return {
    score: gridFinalScore(state.metrics, state.operatingPenalty),
    style: gridStyle(state.metrics),
    strongestImprovement: strongest ? { metric: strongest.metric, delta: strongest.delta } : null,
    biggestPressure: pressure ? { metric: pressure.metric, delta: pressure.delta } : null,
  };
}
