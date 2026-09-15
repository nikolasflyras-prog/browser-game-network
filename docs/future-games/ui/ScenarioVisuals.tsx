import type { CSSProperties } from "react";
import type { ScenarioSessionView } from "../scenario-session";
import { fabOperatingSignals, type FabMetric } from "../chip-fab/scenarios";
import { gridOperatingSignals, type GridMetric } from "../power-grid-dispatcher/scenarios";
import { supplyChainCapabilities, type SupplyMetric } from "../supply-chain-shock/scenarios";
import styles from "./PrototypeLab.module.css";
import supplyStyles from "./SupplyChainScene.module.css";
import signalStyles from "./SystemSignals.module.css";

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
  const signals = fabOperatingSignals(view.metrics);
  const context = active === "bottleneck"
    ? "Bottleneck utilization is not the same as fab output: queueing can raise cycle time even while the tool stays busy."
    : "Good output combines throughput and yield, so more wafer starts only help when the process can convert them into good die.";

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

      <div className={signalStyles.row} aria-label="Fab operating signals">
        <div className={signalStyles.signal} data-fab-signal="good-output" data-state="controlled">
          <span>Good output</span>
          <strong>{signals.goodOutput}</strong>
          <small>Throughput × yield</small>
        </div>
        <div className={signalStyles.signal} data-fab-signal="congestion" data-state={signals.congestion}>
          <span>Cycle-time pressure</span>
          <strong>{signals.congestion.toUpperCase()}</strong>
          <small>Queueing and flow delay</small>
        </div>
        <div className={signalStyles.signal} data-fab-signal="process-risk" data-state={signals.processRisk}>
          <span>Process risk</span>
          <strong>{signals.processRisk.toUpperCase()}</strong>
          <small>Defect exposure</small>
        </div>
      </div>

      <p className={styles.sceneLabel} data-fab-context>{context}</p>
    </div>
  );
}

export function PowerGridScene({ view }: { view: ScenarioSessionView<GridMetric> }) {
  const reserve = Math.max(0, Math.min(100, view.metrics.reserve));
  const active = view.step?.id ?? "";
  const balanceStyle = { "--balance-width": `${reserve}%` } as CSSProperties;
  const signals = gridOperatingSignals(view.metrics);
  const reliabilityVisual = signals.reliabilityState === "secure" ? "controlled" : signals.reliabilityState === "watch" ? "watch" : "high";
  const reserveVisual = signals.reserveState === "adequate" ? "controlled" : signals.reserveState === "tight" ? "watch" : "high";
  const storageVisual = signals.storageState === "flexible" ? "controlled" : signals.storageState === "limited" ? "watch" : "high";
  const context = active === "heatwave"
    ? signals.heatwaveStorageReady
      ? "Stored flexibility remains available for a mixed storag + demand-response heatwave response."
      : "Earlier battery dispatch depleted the flexibility needed for the mixed heatwave response."
    : active === "wind-drop"
      ? signals.windStorageReady
        ? "Storage can still cover the wind shortfall, but using it now may remove the later heatwave option."
        : "Earlier dispatch already left too little storage to cover the wind forecast miss."
      : "Reserve protects the next contingency; storage is finite optionality that can be spent only once.";

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

      <div className={signalStyles.row} aria-label="Grid operating signals">
        <div className={signalStyles.signal} data-grid-signal="reliability" data-state={reliabilityVisual}>
          <span>Reliability</span>
          <strong>{signals.reliabilityState.toUpperCase()}</strong>
          <small>{Math.round(view.metrics.reliability)} / 100</small>
        </div>
        <div className={signalStyles.signal} data-grid-signal="reserve" data-state={reserveVisual}>
          <span>Reserve margin</span>
          <strong>{signals.reserveState.toUpperCase()}</strong>
          <small>{Math.round(view.metrics.reserve)} / 100</small>
        </div>
        <div className={signalStyles.signal} data-grid-signal="storage" data-state={storageVisual}>
          <span>Stored flexibility</span>
          <strong>{signals.storageState.toUpperCase()}</strong>
          <small>Wind {signals.windStorageReady ? "✓" : "×"} · Heatwave {signals.heatwaveStorageReady ? "✓" : "×"}</small>
        </div>
      </div>

      <p className={styles.sceneLabel} data-grid-context>{context}</p>
    </div>
  );
}
