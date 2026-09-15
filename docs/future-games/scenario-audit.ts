import {
  applyScenarioChoice,
  availableScenarioChoices,
  createScenarioState,
  finishScenario,
  type MetricMap,
  type ScenarioRules,
  type ScenarioState,
  type ScenarioStep,
} from "./scenario-engine";

export type ScenarioAuditPath<K extends string> = {
  choiceIds: readonly string[];
  state: ScenarioState<K>;
  finalScore: number;
};

export function enumerateScenarioPaths<K extends string>(
  steps: readonly ScenarioStep<K>[],
  initialMetrics: MetricMap<K>,
  rules: ScenarioRules<K>,
  finalScore: (state: ScenarioState<K>) => number,
): ScenarioAuditPath<K>[] {
  const paths: ScenarioAuditPath<K>[] = [];

  const visit = (state: ScenarioState<K>, choiceIds: readonly string[]) => {
    const step = steps[state.stepIndex];
    if (!step) {
      const finished = finishScenario(state);
      paths.push({ choiceIds, state: finished, finalScore: finalScore(finished) });
      return;
    }

    for (const choice of availableScenarioChoices(state, step)) {
      visit(applyScenarioChoice(state, step, choice.id, rules), [...choiceIds, choice.id]);
    }
  };

  visit(createScenarioState(initialMetrics), []);
  return paths.sort((a, b) => b.finalScore - a.finalScore);
}

export function averageFinalScoreByChoice<K extends string>(
  paths: readonly ScenarioAuditPath<K>[],
  stepIndex: number,
): Record<string, number> {
  const totals = new Map<string, { score: number; count: number }>();

  for (const path of paths) {
    const choiceId = path.choiceIds[stepIndex];
    if (!choiceId) continue;
    const current = totals.get(choiceId) ?? { score: 0, count: 0 };
    current.score += path.finalScore;
    current.count += 1;
    totals.set(choiceId, current);
  }

  return Object.fromEntries(
    [...totals.entries()].map(([choiceId, aggregate]) => [choiceId, aggregate.score / aggregate.count]),
  );
}

export function scenarioScoreRange<K extends string>(paths: readonly ScenarioAuditPath<K>[]) {
  if (paths.length === 0) return { min: 0, max: 0, spread: 0 };
  const scores = paths.map((path) => path.finalScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return { min, max, spread: max - min };
}
