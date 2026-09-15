export type SupplyMetric = "cash" | "service" | "inventory" | "resilience" | "backlog";

export type SupplyMetrics = Record<SupplyMetric, number>;

export type SupplyChoice = {
  id: string;
  label: string;
  detail: string;
  impacts: Partial<SupplyMetrics>;
  feedback: string;
  requirement?: { metric: SupplyMetric; min: number; unavailable: string };
  resolveImpacts?: (metrics: SupplyMetrics) => Partial<SupplyMetrics>;
};

export type SupplyScenario = {
  id: string;
  title: string;
  prompt: string;
  choices: readonly SupplyChoice[];
};

export type SupplyHistoryEntry = {
  scenarioId: string;
  choiceId: string;
  before: SupplyMetrics;
  after: SupplyMetrics;
  feedback: string;
};

export type SupplyChainState = {
  scenarioIndex: number;
  metrics: SupplyMetrics;
  history: readonly SupplyHistoryEntry[];
  complete: boolean;
};

export type SupplyChainResult = {
  score: number;
  style: "resilient" | "over-buffered" | "lean" | "reactive";
  strongestImprovement: { metric: SupplyMetric; delta: number } | null;
  biggestPressure: { metric: SupplyMetric; delta: number } | null;
};

export const initialSupplyMetrics: SupplyMetrics = {
  cash: 70,
  service: 88,
  inventory: 45,
  resilience: 35,
  backlog: 12,
};

const metricMinimums: SupplyMetrics = { cash: 0, service: 0, inventory: 0, resilience: 0, backlog: 0 };
const metricMaximums: SupplyMetrics = { cash: 100, service: 100, inventory: 100, resilience: 100, backlog: 100 };

function clampMetric(metric: SupplyMetric, value: number) {
  return Math.min(metricMaximums[metric], Math.max(metricMinimums[metric], value));
}

function consumeSafetyStock(metrics: SupplyMetrics) {
  if (metrics.inventory < 60) return {};
  return { service: 14, backlog: -14, inventory: -16 } satisfies Partial<SupplyMetrics>;
}

export const supplyScenarios: readonly SupplyScenario[] = [
  {
    id: "supplier-warning",
    title: "Supplier warning",
    prompt: "Your sole display-controller supplier reports unstable yields. Demand is still normal. What do you do before anything actually breaks?",
    choices: [
      {
        id: "dual-source",
        label: "Qualify a second supplier",
        detail: "Spend now to create an alternate source.",
        impacts: { cash: -18, resilience: 24, inventory: 3 },
        feedback: "You paid a meaningful qualification cost, but created alternate capacity before the disruption arrived.",
      },
      {
        id: "safety-stock",
        label: "Build safety stock",
        detail: "Buy extra units while supply is available.",
        impacts: { cash: -7, inventory: 20, resilience: 10 },
        feedback: "Buffer inventory tied up working capital, but it can absorb a near-term logistics shock.",
      },
      {
        id: "wait",
        label: "Wait for evidence",
        detail: "Preserve cash and avoid overreacting.",
        impacts: { cash: 3, resilience: -7 },
        feedback: "You preserved cash, but remained exposed to a single point of failure.",
      },
    ],
  },
  {
    id: "port-delay",
    title: "Port congestion",
    prompt: "Ocean lead times jump by three weeks and customer orders are already scheduled.",
    choices: [
      {
        id: "airfreight",
        label: "Use air freight",
        detail: "Protect service at a steep logistics cost.",
        impacts: { cash: -14, service: 8, backlog: -8 },
        resolveImpacts: consumeSafetyStock,
        feedback: "Expediting protected customers. If you built safety stock earlier, that buffer also absorbs part of the delay.",
      },
      {
        id: "prioritize",
        label: "Prioritize key customers",
        detail: "Allocate scarce inventory to the highest-value accounts.",
        impacts: { service: 2, backlog: 3, inventory: -5, cash: 2 },
        resolveImpacts: consumeSafetyStock,
        feedback: "Allocation limited the damage; prior safety stock makes the tradeoff materially easier.",
      },
      {
        id: "accept-delay",
        label: "Accept the delay",
        detail: "Avoid expedite costs and wait for the network to clear.",
        impacts: { cash: 4, service: -12, backlog: 14 },
        resolveImpacts: consumeSafetyStock,
        feedback: "Cash was preserved. Any earlier safety stock is consumed to cushion service and backlog before the delay reaches customers.",
      },
    ],
  },
  {
    id: "demand-spike",
    title: "Demand spike",
    prompt: "A competitor recalls a major product and your weekly orders jump 35%.",
    choices: [
      {
        id: "overtime",
        label: "Add overtime",
        detail: "Push the current network harder for four weeks.",
        impacts: { cash: -8, service: 9, backlog: -7, resilience: -5 },
        feedback: "Overtime captured the demand spike, but reduced operating slack and increased fatigue risk.",
      },
      {
        id: "ration",
        label: "Cap new orders",
        detail: "Protect existing commitments and refuse marginal demand.",
        impacts: { service: 5, backlog: -2, cash: -2 },
        feedback: "You protected promised service but left some upside on the table.",
      },
      {
        id: "chase-all",
        label: "Accept every order",
        detail: "Maximize bookings now and solve fulfillment later.",
        impacts: { cash: 8, backlog: 20, service: -10 },
        feedback: "Bookings surged, but the operating system could not support the promise dates.",
      },
    ],
  },
  {
    id: "supplier-failure",
    title: "Supplier shutdown",
    prompt: "The original supplier stops shipments for six weeks. Your preparation is now tested.",
    choices: [
      {
        id: "activate-backup",
        label: "Activate alternate capacity",
        detail: "Shift volume to supply you qualified before the shutdown.",
        impacts: { cash: -8, service: 6, resilience: 8, backlog: -9 },
        requirement: {
          metric: "resilience",
          min: 50,
          unavailable: "You do not have enough qualified alternate capacity to activate a backup supplier.",
        },
        feedback: "Prepared alternate capacity converted an earlier resilience investment into real service protection.",
      },
      {
        id: "broker-market",
        label: "Buy from brokers",
        detail: "Source spot inventory at a large premium.",
        impacts: { cash: -18, service: 4, backlog: -5, resilience: -2 },
        feedback: "Spot purchasing bridged the gap, but at a severe cost and with little long-term resilience benefit.",
      },
      {
        id: "production-cut",
        label: "Cut production",
        detail: "Protect cash and wait for normal supply.",
        impacts: { cash: 5, service: -18, backlog: 20 },
        feedback: "You protected liquidity but transferred the disruption directly to customers.",
      },
    ],
  },
] as const;

export const supplyMetricDirections: Record<SupplyMetric, "higher" | "lower" | "neutral"> = {
  cash: "higher",
  service: "higher",
  inventory: "neutral",
  resilience: "higher",
  backlog: "lower",
};

export function createSupplyChainState(): SupplyChainState {
  return {
    scenarioIndex: 0,
    metrics: { ...initialSupplyMetrics },
    history: [],
    complete: false,
  };
}

export function currentSupplyScenario(state: SupplyChainState) {
  return supplyScenarios[state.scenarioIndex] ?? null;
}

export function supplyChoiceAvailability(state: SupplyChainState, choice: SupplyChoice) {
  const requirement = choice.requirement;
  if (!requirement) return { available: true, reason: null } as const;
  const available = state.metrics[requirement.metric] >= requirement.min;
  return { available, reason: available ? null : requirement.unavailable } as const;
}

function resolvedImpacts(choice: SupplyChoice, metrics: SupplyMetrics) {
  const impacts: Partial<SupplyMetrics> = { ...choice.impacts };
  const dynamic = choice.resolveImpacts?.(metrics) ?? {};
  for (const metric of Object.keys(dynamic) as SupplyMetric[]) {
    impacts[metric] = (impacts[metric] ?? 0) + (dynamic[metric] ?? 0);
  }
  return impacts;
}

export function playSupplyChoice(state: SupplyChainState, choiceId: string): SupplyChainState {
  if (state.complete) return state;
  const scenario = currentSupplyScenario(state);
  if (!scenario) return { ...state, complete: true };
  const choice = scenario.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} for ${scenario.id}`);
  const availability = supplyChoiceAvailability(state, choice);
  if (!availability.available) throw new Error(availability.reason ?? "Choice unavailable");

  const before = { ...state.metrics };
  const after = { ...state.metrics };
  const impacts = resolvedImpacts(choice, before);
  for (const metric of Object.keys(impacts) as SupplyMetric[]) {
    after[metric] = clampMetric(metric, after[metric] + (impacts[metric] ?? 0));
  }

  const nextIndex = state.scenarioIndex + 1;
  return {
    scenarioIndex: nextIndex,
    metrics: after,
    history: [...state.history, { scenarioId: scenario.id, choiceId: choice.id, before, after: { ...after }, feedback: choice.feedback }],
    complete: nextIndex >= supplyScenarios.length,
  };
}

export function supplyChainCapabilities(metrics: SupplyMetrics) {
  return {
    alternateCapacityReady: metrics.resilience >= 50,
    safetyStockReady: metrics.inventory >= 60,
  } as const;
}

export function supplyMetricChanges(entry: SupplyHistoryEntry | null) {
  if (!entry) return [];
  return (Object.keys(entry.before) as SupplyMetric[])
    .map((metric) => {
      const delta = entry.after[metric] - entry.before[metric];
      const direction = supplyMetricDirections[metric];
      const improvement = direction === "higher" ? delta : direction === "lower" ? -delta : 0;
      return { metric, delta, improvement };
    })
    .filter((entry) => entry.delta !== 0);
}

export function supplyChainScore(metrics: SupplyMetrics) {
  const backlogControl = 100 - metrics.backlog;
  const excessInventoryPenalty = Math.max(0, metrics.inventory - 70) * 0.5;
  const raw = metrics.service * 0.35 + metrics.resilience * 0.25 + metrics.cash * 0.2 + backlogControl * 0.2;
  return Math.max(0, Math.round(raw - excessInventoryPenalty));
}

export function supplyChainStyle(metrics: SupplyMetrics): SupplyChainResult["style"] {
  if (metrics.resilience >= 70 && metrics.inventory <= 70) return "resilient";
  if (metrics.inventory >= 75) return "over-buffered";
  if (metrics.cash >= 75 && metrics.resilience < 45) return "lean";
  return "reactive";
}

export function supplyChainResult(state: SupplyChainState): SupplyChainResult | null {
  if (!state.complete) return null;
  const ranked = (Object.keys(initialSupplyMetrics) as SupplyMetric[])
    .filter((metric) => supplyMetricDirections[metric] !== "neutral")
    .map((metric) => {
      const delta = state.metrics[metric] - initialSupplyMetrics[metric];
      const direction = supplyMetricDirections[metric];
      const improvement = direction === "higher" ? delta : -delta;
      return { metric, delta, improvement };
    })
    .sort((a, b) => b.improvement - a.improvement);

  const strongest = ranked.find((entry) => entry.improvement > 0) ?? null;
  const pressure = [...ranked].reverse().find((entry) => entry.improvement < 0) ?? null;
  return {
    score: supplyChainScore(state.metrics),
    style: supplyChainStyle(state.metrics),
    strongestImprovement: strongest ? { metric: strongest.metric, delta: strongest.delta } : null,
    biggestPressure: pressure ? { metric: pressure.metric, delta: pressure.delta } : null,
  };
}
