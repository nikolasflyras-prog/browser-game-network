import type { ScenarioGameDefinition } from "../scenario-session";
import {
  fabFinalScore,
  fabRampStyle,
  fabRules,
  fabScenarios,
  initialFabMetrics,
  type FabMetric,
} from "./scenarios";

export const chipFabPrototype = {
  slug: "chip-fab",
  title: "Chip Fab",
  version: "0.0.1-lab",
  steps: fabScenarios,
  initialMetrics: initialFabMetrics,
  rules: fabRules,
  finalScore: (state) => fabFinalScore(state.metrics) + state.score,
  classify: fabRampStyle,
} satisfies ScenarioGameDefinition<FabMetric, ReturnType<typeof fabRampStyle>>;
