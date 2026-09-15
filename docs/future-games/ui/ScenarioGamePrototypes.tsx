"use client";

import { chipFabPrototype } from "../chip-fab/prototype";
import type { FabMetric } from "../chip-fab/scenarios";
import { powerGridPrototype } from "../power-grid-dispatcher/prototype";
import type { GridMetric } from "../power-grid-dispatcher/scenarios";
import { supplyChainPrototype } from "../supply-chain-shock/prototype";
import type { SupplyMetric } from "../supply-chain-shock/scenarios";
import { ScenarioPrototype } from "./ScenarioPrototype";
import { ChipFabScene, PowerGridScene, SupplyChainScene } from "./ScenarioVisuals";

const supplyLabels: Record<SupplyMetric, string> = {
  cash: "Cash",
  service: "Service",
  inventory: "Inventory",
  resilience: "Resilience",
  backlog: "Backlog",
};

const fabLabels: Record<FabMetric, string> = {
  cash: "Cash",
  yield: "Yield",
  throughput: "Throughput",
  cycleTime: "Cycle time",
  defectRisk: "Defect risk",
};

const gridLabels: Record<GridMetric, string> = {
  reliability: "Reliability",
  cost: "Cost",
  emissions: "Emissions",
  reserve: "Reserve",
  storage: "Storage",
};

export function SupplyChainPrototypePanel() {
  return (
    <ScenarioPrototype
      definition={supplyChainPrototype}
      metricOrder={["cash", "service", "inventory", "resilience", "backlog"]}
      metricLabels={supplyLabels}
      accent="#f6c969"
      renderScene={(view) => <SupplyChainScene view={view} />}
    />
  );
}

export function ChipFabPrototypePanel() {
  return (
    <ScenarioPrototype
      definition={chipFabPrototype}
      metricOrder={["yield", "throughput", "cycleTime", "defectRisk", "cash"]}
      metricLabels={fabLabels}
      accent="#8ed6ff"
      renderScene={(view) => <ChipFabScene view={view} />}
    />
  );
}

export function PowerGridPrototypePanel() {
  return (
    <ScenarioPrototype
      definition={powerGridPrototype}
      metricOrder={["reliability", "reserve", "storage", "cost", "emissions"]}
      metricLabels={gridLabels}
      accent="#9ce88a"
      renderScene={(view) => <PowerGridScene view={view} />}
    />
  );
}
