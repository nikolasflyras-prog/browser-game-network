export type FabMetric = "cash" | "yield" | "throughput" | "cycleTime" | "defectRisk";
export type FabMetrics = Record<FabMetric, number>;

export type FabChoice = {
  id: string;
  label: string;
  detail: string;
  impacts: Partial<FabMetrics>;
  feedback: string;
};

export type FabScenario = {
  id: string;
  title: string;
  prompt: string;
  choices: readonly FabChoice[];
};

export type FabHistoryEntry = {
  scenarioId: string;
  choiceId: string;
  before: FabMetrics;
  after: FabMetrics;
  feedback: string;
};

export type ChipFabState = {
  scenarioIndex: number;
  metrics: FabMetrics;
  history: readonly FabHistoryEntry[];
  complete: boolean;
};

export type ChipFabResult = {
  score: number;
  style: "overdriven" | "process-first" | "capacity-first" | "balanced-ramp";
  strongestImprovement: { metric: FabMetric; delta: number } | null;
  biggestPressure: { metric: FabMetric; delta: number } | null;
};

export const initialFabMetrics: FabMetrics = {
  cash: 72,
  yield: 63,
  throughput: 48,
  cycleTime: 58,
  defectRisk: 42,
};

export const fabMetricDirections: Record<FabMetric, "higher" | "lower"> = {
  cash: "higher",
  yield: "higher",
  throughput: "higher",
  cycleTime: "lower",
  defectRisk: "lower",
};

export const fabScenarios: readonly FabScenario[] = [
  {
    id: "ramp-pressure",
    title: "Ramp pressure",
    prompt: "A launch customer asks you to pull in volume by one quarter even though the process is still learning.",
    choices: [
      {
        id: "push-starts",
        label: "Push wafer starts",
        detail: "Increase loading immediately.",
        impacts: { throughput: 16, yield: -9, cycleTime: 10, defectRisk: 8, cash: 5 },
        feedback: "More starts raised apparent output, but the young process absorbed congestion and defect risk.",
      },
      {
        id: "controlled-ramp",
        label: "Controlled ramp",
        detail: "Increase starts gradually while protecting learning cycles.",
        impacts: { throughput: 8, yield: 6, cycleTime: 2, defectRisk: -4, cash: 1 },
        feedback: "The slower ramp converted engineering learning into higher-quality output.",
      },
      {
        id: "hold-volume",
        label: "Hold volume",
        detail: "Keep starts flat until yield stabilizes.",
        impacts: { throughput: -2, yield: 10, cycleTime: -5, defectRisk: -8, cash: -3 },
        feedback: "You sacrificed near-term volume to improve process control and reduce rework.",
      },
    ],
  },
  {
    id: "metrology-drift",
    title: "Metrology drift",
    prompt: "Inline measurements show a slow shift in critical dimensions, but final electrical yield has not fallen yet.",
    choices: [
      {
        id: "stop-and-fix",
        label: "Stop and recalibrate",
        detail: "Take the tool group down now.",
        impacts: { throughput: -10, cycleTime: 5, yield: 11, defectRisk: -14, cash: -4 },
        feedback: "You accepted downtime to prevent latent process drift from becoming a larger yield excursion.",
      },
      {
        id: "monitor",
        label: "Increase sampling",
        detail: "Keep running while collecting more data.",
        impacts: { throughput: -2, yield: 3, defectRisk: -2, cash: -2 },
        feedback: "More sampling reduced uncertainty without a full stop, but some drift exposure remained.",
      },
      {
        id: "keep-running",
        label: "Keep running",
        detail: "Protect utilization until final test confirms a problem.",
        impacts: { throughput: 8, yield: -10, defectRisk: 15, cash: 5 },
        feedback: "Utilization stayed high, but waiting for final-test evidence let process risk compound.",
      },
    ],
  },
  {
    id: "bottleneck",
    title: "Lithography bottleneck",
    prompt: "A high-utilization lithography step is now setting fab cycle time. You have limited capital this quarter.",
    choices: [
      {
        id: "buy-tool",
        label: "Add capacity",
        detail: "Commit capital to an additional tool.",
        impacts: { cash: -18, throughput: 18, cycleTime: -10, defectRisk: 2 },
        feedback: "Capacity relieved the physical bottleneck, but the capital hit only pays off if demand persists.",
      },
      {
        id: "improve-scheduling",
        label: "Improve scheduling",
        detail: "Reduce idle gaps, changeovers, and queue disorder.",
        impacts: { cash: -4, throughput: 9, cycleTime: -8, yield: 2 },
        feedback: "Operational discipline created useful capacity without the full cost of another tool.",
      },
      {
        id: "maximize-utilization",
        label: "Run flat-out",
        detail: "Keep the bottleneck continuously loaded.",
        impacts: { throughput: 7, cycleTime: 12, yield: -4, defectRisk: 7, cash: 3 },
        feedback: "Very high utilization increased queueing and made the fab slower despite keeping the tool busy.",
      },
    ],
  },
  {
    id: "maintenance-window",
    title: "Maintenance decision",
    prompt: "A critical etch chamber is due for preventive maintenance during a strong demand month.",
    choices: [
      {
        id: "maintain-now",
        label: "Maintain now",
        detail: "Take planned downtime on schedule.",
        impacts: { throughput: -8, cycleTime: 4, defectRisk: -12, yield: 6, cash: -3 },
        feedback: "Planned downtime reduced short-term output but protected process stability and future uptime.",
      },
      {
        id: "short-maintenance",
        label: "Shorten maintenance",
        detail: "Perform only the highest-priority work.",
        impacts: { throughput: -3, defectRisk: -3, yield: 2, cash: -1 },
        feedback: "A partial intervention balanced output and risk, but deferred work remains.",
      },
      {
        id: "defer",
        label: "Defer maintenance",
        detail: "Keep shipping through the demand peak.",
        impacts: { throughput: 9, cash: 5, defectRisk: 13, yield: -6 },
        feedback: "You captured near-term shipments, but reliability and defect exposure increased.",
      },
    ],
  },
] as const;

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function createChipFabState(): ChipFabState {
  return { scenarioIndex: 0, metrics: { ...initialFabMetrics }, history: [], complete: false };
}

export function currentFabScenario(state: ChipFabState) {
  return fabScenarios[state.scenarioIndex] ?? null;
}

export function playFabChoice(state: ChipFabState, choiceId: string): ChipFabState {
  if (state.complete) return state;
  const scenario = currentFabScenario(state);
  if (!scenario) return { ...state, complete: true };
  const choice = scenario.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} for ${scenario.id}`);

  const before = { ...state.metrics };
  const after = { ...state.metrics };
  for (const metric of Object.keys(choice.impacts) as FabMetric[]) {
    after[metric] = clamp(after[metric] + (choice.impacts[metric] ?? 0));
  }
  const nextIndex = state.scenarioIndex + 1;
  return {
    scenarioIndex: nextIndex,
    metrics: after,
    history: [...state.history, { scenarioId: scenario.id, choiceId: choice.id, before, after: { ...after }, feedback: choice.feedback }],
    complete: nextIndex >= fabScenarios.length,
  };
}

export function fabOperatingSignals(metrics: FabMetrics) {
  const goodOutput = Math.round((metrics.throughput * metrics.yield) / 100);
  const congestion = metrics.cycleTime >= 70 ? "high" : metrics.cycleTime >= 55 ? "watch" : "controlled";
  const processRisk = metrics.defectRisk >= 55 ? "high" : metrics.defectRisk >= 35 ? "watch" : "controlled";
  return { goodOutput, congestion, processRisk } as const;
}

export function fabMetricChanges(entry: FabHistoryEntry | null) {
  if (!entry) return [];
  return (Object.keys(entry.before) as FabMetric[])
    .map((metric) => {
      const delta = entry.after[metric] - entry.before[metric];
      const improvement = fabMetricDirections[metric] === "higher" ? delta : -delta;
      return { metric, delta, improvement };
    })
    .filter((entry) => entry.delta !== 0);
}

export function fabFinalScore(metrics: FabMetrics) {
  const cycleControl = 100 - metrics.cycleTime;
  const defectControl = 100 - metrics.defectRisk;
  const raw = metrics.yield * 0.35 + metrics.throughput * 0.3 + cycleControl * 0.15 + metrics.cash * 0.1 + defectControl * 0.1;
  return Math.max(0, Math.round(raw));
}

export function fabRampStyle(metrics: FabMetrics): ChipFabResult["style"] {
  if (metrics.throughput >= 75 && metrics.yield < 60) return "overdriven";
  if (metrics.yield >= 78 && metrics.throughput < 62) return "process-first";
  if (metrics.throughput >= 72 && metrics.cash < 45) return "capacity-first";
  return "balanced-ramp";
}

export function chipFabResult(state: ChipFabState): ChipFabResult | null {
  if (!state.complete) return null;
  const ranked = (Object.keys(initialFabMetrics) as FabMetric[])
    .map((metric) => {
      const delta = state.metrics[metric] - initialFabMetrics[metric];
      const improvement = fabMetricDirections[metric] === "higher" ? delta : -delta;
      return { metric, delta, improvement };
    })
    .sort((a, b) => b.improvement - a.improvement);

  const strongest = ranked.find((entry) => entry.improvement > 0) ?? null;
  const pressure = [...ranked].reverse().find((entry) => entry.improvement < 0) ?? null;
  return {
    score: fabFinalScore(state.metrics),
    style: fabRampStyle(state.metrics),
    strongestImprovement: strongest ? { metric: strongest.metric, delta: strongest.delta } : null,
    biggestPressure: pressure ? { metric: pressure.metric, delta: pressure.delta } : null,
  };
}
