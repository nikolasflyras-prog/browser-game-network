import type { ScenarioGameDefinition } from "../scenario-session";
import {
  initialSupplyMetrics,
  operatingStyle,
  supplyChainFinalScore,
  supplyChainRules,
  supplyChainScenarios,
  type SupplyMetric,
} from "./scenarios";

export const supplyChainPrototype = {
  slug: "supply-chain-shock",
  title: "Supply Chain Shock",
  version: "0.0.1-lab",
  steps: supplyChainScenarios,
  initialMetrics: initialSupplyMetrics,
  rules: supplyChainRules,
  finalScore: (state) => supplyChainFinalScore(state.metrics) + state.score,
  classify: operatingStyle,
} satisfies ScenarioGameDefinition<SupplyMetric, ReturnType<typeof operatingStyle>>;
