import type { CSSProperties } from "react";
import type { ScenarioSessionView } from "../scenario-session";
import type { FabMetric } from "../chip-fab/scenarios";
import type { GridMetric } from "../power-grid-dispatcher/scenarios";
import { supplyChainCapabilities, type SupplyMetric } from "../supply-chain-shock/scenarios";
import styles from "./PrototypeLab.module.css";
import supplyStyles from "./SupplyChainScene.module.css";

export function SupplyChainScene({ view }: { view: ScenarioSessionView<SupplyMetric> }) {
  const active = view.step?.id ?? "";
  const capabilities = supplyChainCapabilities(view.metrics);
  const context = active === "supplier-failure"
    ? capabilities.alternateCapacityReady
      ? "Qualified backup capacity is available because earlier resilience crossed the activation threshold."
      : "No qualified backup capacity is available; earlier preparation never crossed the activation threshold."
    : active === "port-delay"
      ? capabilities.safetyStockReady
        ? "Safety stock is available to absorb part of the logistics delay before customers feel it."
        : "No meaningful safety-stock buffer remains, so the delay will propagate more directly to service and backlog."
      : "Inventory and resilience are capabilities: paying for them early changes which later responses are available.";

  return (
    <div className={styles.network}>
      <div className={styles.networkRow}>
        <div className={styles.node} data-active={active === "supplier-warning" || active === "supplier-failure"}>Supplier</div>
        <span className={styles.connector} />
        <div className={styles.node} data-active={active === "demand-spike"}>Plant</div>
        <span className={styles.connector} />
        <div className={styles.node} data-active={active === "port-delay"}>Distribution</div>
        <span className={styles.connector} />
        <div className={styles.node} data-active={active === "demand-spike"}>Customers</div>
      </div>

      <div className={supplyStyles.capabilityRow} aria-label="Preparedness capabilities">
        <div
          className={supplyStyles.capability}
          data-status={capabilities.alternateCapacityReady ? "ready" : "pending"}
          data-supply-capability="alternate-capacity"
        >
          <span>Alternate capacity</span>
          <strong>{capabilities.alternateCapacityReady ? "READY" : "NOT READY"}</strong>
          <small>Resilience 50+ unlocks the backup-supplier response.</small>
        </div>
        <div
          className={supplyStyles.capability}
          data-status={capabilities.safetyStockReady ? "ready" : "pending"}
          data-supply-capability="safety-stock"
        >
          <span>Safety stock</span>
          <strong>{capabilities.safetyStockReady ? "READY" : "NOT READY"}</strong>
          <small>Inventory 60+ can absorb part of a logistics disruption.</small>
        </div>
      </div>

      <p className={styles.sceneLabel} data-supply-context>{context}</p>
    </div>
  );
}

export function ChipFabScene({ view }: { view: ScenarioSessionView<FabMetric> }) {
  const active = view.step?.id ?? "";
  const activeStation = active === "metrology-drift" ? "Metrology" : active === "bottleneck" ? "Lithography" : active === "maintenance-window" ? "Etch" : "Ramp";
  const stations = ["Ramp", "Lithography", "Etch", "Deposition", "Metrology", "Test"] as const;
  return (
    <div className={styles.fabFlow}>
      <div className={styles.fabRow}>
        {stations.map((station, index) => (
          <span key={station} style={{ display: "contents" }}>
            <div className={styles.station} data-active={station === activeStation}>{station}</div>
            {index < stations.length - 1 ? <span className={styles.connector} /> : null}
          </span>
        ))}
      </div>
      <p className={styles.sceneLabel}>The highlighted station is where the current decision is concentrated; output quality depends on the whole flow.</p>
    </div>
  );
}

export function PowerGridScene({ view }: { view: ScenarioSessionView<GridMetric> }) {
  const reserve = Math.max(0, Math.min(100, view.metrics.reserve));
  const active = view.step?.id ?? "";
  const balanceStyle = { "--balance-width": `${reserve}%` } as CSSProperties;
  return (
    <div className={styles.gridScene}>
      <div className={styles.balanceBar} aria-label={`Reserve margin ${Math.round(reserve)}`}>
        <div className={styles.balanceFill} style={balanceStyle} />
      </div>
      <div className={styles.gridRow}>
        <div className={styles.gridNode} data-active={active === "wind-drop"}>Generation</div>
        <span className={styles.connector} />
        <div className={styles.gridNode} data-active={active === "transmission-outage"}>Transmission</div>
        <span className={styles.connector} />
        <div className={styles.gridNode} data-active={active === "morning-ramp" || active === "heatwave"}>Load</div>
      </div>
      <p className={styles.sceneLabel}>Reserve is flexibility above current demand; spending storage now can remove options later.</p>
    </div>
  );
}
