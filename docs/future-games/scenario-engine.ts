export type MetricMap<K extends string> = Record<K, number>;

export type ScenarioChoice<K extends string> = {
  id: string;
  label: string;
  detail: string;
  impacts: Partial<Record<K, number>>;
  scoreDelta?: number;
  feedback: string;
};

export type ScenarioStep<K extends string> = {
  id: string;
  title: string;
  prompt: string;
  choices: readonly ScenarioChoice<K>[];
};

export type ScenarioHistoryEntry<K extends string> = {
  stepId: string;
  choiceId: string;
  before: MetricMap<K>;
  after: MetricMap<K>;
  scoreDelta: number;
  feedback: string;
};

export type ScenarioState<K extends string> = {
  stepIndex: number;
  score: number;
  metrics: MetricMap<K>;
  history: readonly ScenarioHistoryEntry<K>[];
  complete: boolean;
};

export type ScenarioRules<K extends string> = {
  min?: Partial<Record<K, number>>;
  max?: Partial<Record<K, number>>;
  scoreMetric?: (before: MetricMap<K>, after: MetricMap<K>, choice: ScenarioChoice<K>) => number;
};

function clamp(value: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  return Math.min(max, Math.max(min, value));
}

export function createScenarioState<K extends string>(metrics: MetricMap<K>): ScenarioState<K> {
  return {
    stepIndex: 0,
    score: 0,
    metrics: { ...metrics },
    history: [],
    complete: false,
  };
}

export function applyScenarioChoice<K extends string>(
  state: ScenarioState<K>,
  step: ScenarioStep<K>,
  choiceId: string,
  rules: ScenarioRules<K> = {},
): ScenarioState<K> {
  if (state.complete) return state;

  const choice = step.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} for step ${step.id}`);

  const before = { ...state.metrics };
  const after = { ...state.metrics };

  for (const metric of Object.keys(choice.impacts) as K[]) {
    const delta = choice.impacts[metric] ?? 0;
    const minimum = rules.min?.[metric];
    const maximum = rules.max?.[metric];
    after[metric] = clamp(after[metric] + delta, minimum, maximum);
  }

  const derivedScore = rules.scoreMetric?.(before, after, choice) ?? 0;
  const scoreDelta = (choice.scoreDelta ?? 0) + derivedScore;

  return {
    stepIndex: state.stepIndex + 1,
    score: state.score + scoreDelta,
    metrics: after,
    history: [
      ...state.history,
      {
        stepId: step.id,
        choiceId: choice.id,
        before,
        after: { ...after },
        scoreDelta,
        feedback: choice.feedback,
      },
    ],
    complete: false,
  };
}

export function finishScenario<K extends string>(state: ScenarioState<K>): ScenarioState<K> {
  return state.complete ? state : { ...state, complete: true };
}

export function summarizeMetricChange<K extends string>(
  before: MetricMap<K>,
  after: MetricMap<K>,
): Array<{ metric: K; delta: number }> {
  return (Object.keys(before) as K[])
    .map((metric) => ({ metric, delta: after[metric] - before[metric] }))
    .filter((entry) => entry.delta !== 0);
}
