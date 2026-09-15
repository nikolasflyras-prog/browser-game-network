export type MetricMap<K extends string> = Record<K, number>;

export type ScenarioMetricRequirement = {
  min?: number;
  max?: number;
};

export type ScenarioChoice<K extends string> = {
  id: string;
  label: string;
  detail: string;
  impacts: Partial<Record<K, number>>;
  resolveImpacts?: (metrics: MetricMap<K>) => Partial<Record<K, number>>;
  requirements?: Partial<Record<K, ScenarioMetricRequirement>>;
  unavailableFeedback?: string;
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

export function isScenarioChoiceAvailable<K extends string>(
  metrics: MetricMap<K>,
  choice: ScenarioChoice<K>,
) {
  const requirements: Partial<Record<K, ScenarioMetricRequirement>> = choice.requirements ?? {};
  return (Object.keys(requirements) as K[]).every((metric) => {
    const requirement = requirements[metric];
    if (!requirement) return true;
    const value = metrics[metric];
    if (requirement.min !== undefined && value < requirement.min) return false;
    if (requirement.max !== undefined && value > requirement.max) return false;
    return true;
  });
}

export function availableScenarioChoices<K extends string>(state: ScenarioState<K>, step: ScenarioStep<K>) {
  return step.choices.filter((choice) => isScenarioChoiceAvailable(state.metrics, choice));
}

function resolvedImpacts<K extends string>(choice: ScenarioChoice<K>, metrics: MetricMap<K>) {
  const impacts: Partial<Record<K, number>> = { ...choice.impacts };
  const dynamic: Partial<Record<K, number>> = choice.resolveImpacts?.(metrics) ?? {};

  for (const metric of Object.keys(dynamic) as K[]) {
    impacts[metric] = (impacts[metric] ?? 0) + (dynamic[metric] ?? 0);
  }

  return impacts;
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
  if (!isScenarioChoiceAvailable(state.metrics, choice)) {
    throw new Error(choice.unavailableFeedback ?? `Choice ${choiceId} is unavailable for step ${step.id}`);
  }

  const before = { ...state.metrics };
  const after = { ...state.metrics };
  const impacts = resolvedImpacts(choice, before);

  for (const metric of Object.keys(impacts) as K[]) {
    const delta = impacts[metric] ?? 0;
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
