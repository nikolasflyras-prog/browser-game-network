"use client";

import { chipFabPrototype } from "../chip-fab/prototype";
import type { FabMetric } from "../chip-fab/scenarios";
import { powerGridPrototype } from "../power-grid-dispatcher/prototype";
import type { GridMetric } from "../power-grid-dispatcher/scenarios";
import type { MetricDirection } from "../scenario-insights";
import { supplyChainPrototype } from "../supply-chain-shock/prototype";
import type { SupplyMetric } from "../supply-chain-shock/scenarios";
import type { PrototypeEventSink } from "./prototype-events";
import { ScenarioPrototype } from "./ScenarioPrototype";
import { ChipFabScene, PowerGridScene, SupplyChainScene } from "./ScenarioVisuals";

const supplyLabels: Record<SupplyMetric, string> = {
  cash: "Cash",
  service: "Service",
  inventory: "Inventory",
  resilience: "Resilience",
  backlog: "Backlog",
};

const supplyDirections: Record<SupplyMetric, MetricDirection> = {
  cash: "higher",
  service: "higher",
  inventory: "neutral",
  resilience: "higher",
  backlog: "lower",
};

const fabLabels: Record<FabMetric, string> = {
  cash: "Cash",
  yield: "Yield",
  throughput: "Throughput",
  cycleTime: "Cycle time",
  defectRisk: "Defect risk",
};

const fabDirections: Record<FabMetric, MetricDirection> = {
  cash: "higher",
  yield: "higher",
  throughput: "higher",
  cycleTime: "lower",
  defectRisk: "lower",
};

const gridLabels: Record<GridMetric, string> = {
  reliability: "Reliability",
  cost: "Cost",
  emissions: "Emissions",
  reserve: "Reserve",
  storage: "Storage",
};

const gridDirections: Record<GridMetric, MetricDirection> = {
  reliability: "higher",
  cost: "lower",
  emissions: "lower",
  reserve: "higher",
  storage: "higher",
};

type PanelProps = { onEvent?: PrototypeEventSink };

export function SupplyChainPrototypePanel({ onEvent }: PanelProps) {
  return (
    <ScenarioPrototype
      definition={supplyChainPrototype}
      metricOrder={["cash", "service", "inventory", "resilience", "backlog"]}
      metricLabels={supplyLabels}
      metricDirections={supplyDirections}
      accent="#f6c969"
      renderScene={(view) => <SupplyChainScene view={view} />}
      onEvent={onEvent}
    />
  );
}

export function ChipFabPrototypePanel({ onEvent }: PanelProps) {
  return (
    <ScenarioPrototype
      definition={chipFabPrototype}
      metricOrder={["yield", "throughput", "cycleTime", "defectRisk", "cash"]}
      metricLabels={fabLabels}
      metricDirections={fabDirections}
      accent="#8ed6ff"
      renderScene={(view) => <ChipFabScene view={view} />}
      onEvent={onEvent}
    />
  );
}

export function PowerGridPrototypePanel({ onEvent }: PanelProps) {
  return (
    <ScenarioPrototype
      definition={powerGridPrototype}
      metricOrder={["reliability", "reserve", "storage", "cost", "emissions"]}
      metricLabels={gridLabels}
      metricDirections={gridDirections}
      accent="#9ce88a"
      renderScene={(view) => <PowerGridScene view={view} />}
      onEvent={onEvent}
    />
  );
}
