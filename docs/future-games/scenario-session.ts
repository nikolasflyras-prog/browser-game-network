import {
  applyScenarioChoice,
  availableScenarioChoices,
  createScenarioState,
  finishScenario,
  isScenarioChoiceAvailable,
  type MetricMap,
  type ScenarioRules,
  type ScenarioState,
  type ScenarioStep,
} from "./scenario-engine";

export type ScenarioGameDefinition<K extends string, Style extends string> = {
  slug: string;
  title: string;
  version: string;
  steps: readonly ScenarioStep<K>[];
  initialMetrics: MetricMap<K>;
  rules: ScenarioRules<K>;
  finalScore: (state: ScenarioState<K>) => number;
  classify: (metrics: MetricMap<K>) => Style;
};

export type ScenarioGameResult<Style extends string> = {
  score: number;
  style: Style;
};

export type ScenarioGameSession<K extends string, Style extends string> = {
  state: ScenarioState<K>;
  result: ScenarioGameResult<Style> | null;
};

export type ScenarioChoiceView = {
  id: string;
  label: string;
  detail: string;
  available: boolean;
  unavailableFeedback?: string;
};

export type ScenarioSessionView<K extends string> = {
  stepNumber: number;
  totalSteps: number;
  complete: boolean;
  step: ScenarioStep<K> | null;
  choices: readonly ScenarioChoiceView[];
  metrics: MetricMap<K>;
  lastFeedback: string | null;
};

function resultFor<K extends string, Style extends string>(
  definition: ScenarioGameDefinition<K, Style>,
  state: ScenarioState<K>,
): ScenarioGameResult<Style> | null {
  if (!state.complete) return null;
  return {
    score: definition.finalScore(state),
    style: definition.classify(state.metrics),
  };
}

export function createScenarioSession<K extends string, Style extends string>(
  definition: ScenarioGameDefinition<K, Style>,
): ScenarioGameSession<K, Style> {
  return {
    state: createScenarioState(definition.initialMetrics),
    result: null,
  };
}

export function scenarioSessionView<K extends string, Style extends string>(
  definition: ScenarioGameDefinition<K, Style>,
  session: ScenarioGameSession<K, Style>,
): ScenarioSessionView<K> {
  const step = definition.steps[session.state.stepIndex] ?? null;
  return {
    stepNumber: Math.min(session.state.stepIndex + 1, definition.steps.length),
    totalSteps: definition.steps.length,
    complete: session.state.complete,
    step,
    choices:
      step?.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        detail: choice.detail,
        available: isScenarioChoiceAvailable(session.state.metrics, choice),
        unavailableFeedback: choice.unavailableFeedback,
      })) ?? [],
    metrics: { ...session.state.metrics },
    lastFeedback: session.state.history.at(-1)?.feedback ?? null,
  };
}

export function chooseScenarioSession<K extends string, Style extends string>(
  definition: ScenarioGameDefinition<K, Style>,
  session: ScenarioGameSession<K, Style>,
  choiceId: string,
): ScenarioGameSession<K, Style> {
  if (session.state.complete) return session;
  const step = definition.steps[session.state.stepIndex];
  if (!step) {
    const state = finishScenario(session.state);
    return { state, result: resultFor(definition, state) };
  }

  const availableIds = new Set(availableScenarioChoices(session.state, step).map((choice) => choice.id));
  if (!availableIds.has(choiceId)) {
    const choice = step.choices.find((candidate) => candidate.id === choiceId);
    throw new Error(choice?.unavailableFeedback ?? `Choice ${choiceId} is unavailable for ${step.id}`);
  }

  let state = applyScenarioChoice(session.state, step, choiceId, definition.rules);
  if (state.stepIndex >= definition.steps.length) state = finishScenario(state);
  return { state, result: resultFor(definition, state) };
}

export function resetScenarioSession<K extends string, Style extends string>(
  definition: ScenarioGameDefinition<K, Style>,
): ScenarioGameSession<K, Style> {
  return createScenarioSession(definition);
}
