import type { ScenarioGameDefinition } from "../scenario-session";
import {
  gridFinalScore,
  gridRules,
  gridScenarios,
  gridStyle,
  initialGridMetrics,
  type GridMetric,
} from "./scenarios";

export const powerGridPrototype = {
  slug: "power-grid-dispatcher",
  title: "Power Grid Dispatcher",
  version: "0.0.1-lab",
  steps: gridScenarios,
  initialMetrics: initialGridMetrics,
  rules: gridRules,
  finalScore: (state) => gridFinalScore(state.metrics, state.score),
  classify: gridStyle,
} satisfies ScenarioGameDefinition<GridMetric, ReturnType<typeof gridStyle>>;
