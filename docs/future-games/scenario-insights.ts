import type { MetricMap } from "./scenario-engine";

export type MetricDirection = "higher" | "lower" | "neutral";

export type ScenarioMetricOutcome<K extends string> = {
  metric: K;
  delta: number;
  improvement: number;
};

export type ScenarioOutcomeSummary<K extends string> = {
  strongestImprovement: ScenarioMetricOutcome<K> | null;
  biggestPressure: ScenarioMetricOutcome<K> | null;
};

export function rankScenarioMetricOutcomes<K extends string>(
  initial: MetricMap<K>,
  final: MetricMap<K>,
  directions: Record<K, MetricDirection>,
): ScenarioMetricOutcome<K>[] {
  return (Object.keys(initial) as K[])
    .filter((metric) => directions[metric] !== "neutral")
    .map((metric) => {
      const delta = final[metric] - initial[metric];
      const improvement = directions[metric] === "higher" ? delta : -delta;
      return { metric, delta, improvement };
    })
    .sort((left, right) => right.improvement - left.improvement);
}

export function summarizeScenarioOutcome<K extends string>(
  initial: MetricMap<K>,
  final: MetricMap<K>,
  directions: Record<K, MetricDirection>,
): ScenarioOutcomeSummary<K> {
  const ranked = rankScenarioMetricOutcomes(initial, final, directions);
  const strongestImprovement = ranked.find((entry) => entry.improvement > 0) ?? null;
  const biggestPressure = [...ranked].reverse().find((entry) => entry.improvement < 0) ?? null;
  return { strongestImprovement, biggestPressure };
}

export function formatMetricDelta(delta: number) {
  const rounded = Math.round(delta);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}
