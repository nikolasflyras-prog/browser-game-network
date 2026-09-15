"use client";

import { useCallback, useState } from "react";
import { MarketMakerPrototypePanel } from "./MarketMakerPrototype";
import { ChipFabPrototypePanel, PowerGridPrototypePanel, SupplyChainPrototypePanel } from "./ScenarioGamePrototypes";
import { PrototypeRuntimeHost } from "./PrototypeRuntimeHost";
import styles from "./FutureGameLab.module.css";

type LabGame = "traffic-control" | "switchyard-daily" | "market-maker" | "supply-chain-shock" | "chip-fab" | "power-grid-dispatcher";

const games: readonly { id: LabGame; title: string; lane: "PLAY" | "LEARN"; note: string }[] = [
  { id: "traffic-control", title: "Traffic Control", lane: "PLAY", note: "Reactive queue management; kill fixed-timing strategies." },
  { id: "switchyard-daily", title: "Switchyard Daily", lane: "PLAY", note: "Visible switch-state reasoning in a deterministic daily format." },
  { id: "market-maker", title: "Market Maker", lane: "LEARN", note: "Quote spread, flow, and inventory risk in short rounds." },
  { id: "supply-chain-shock", title: "Supply Chain Shock", lane: "LEARN", note: "Path-dependent resilience, service, inventory, and cash decisions." },
  { id: "chip-fab", title: "Chip Fab", lane: "LEARN", note: "Yield, throughput, cycle-time, and process-risk tradeoffs." },
  { id: "power-grid-dispatcher", title: "Power Grid Dispatcher", lane: "LEARN", note: "Reliability-first dispatch with storage, reserve, cost, and emissions." },
];

export function FutureGameLab() {
  const [active, setActive] = useState<LabGame>("traffic-control");
  const loadTraffic = useCallback(
    () => import("../traffic-control/runtime").then((module) => module.mountTrafficControlPrototype),
    [],
  );
  const loadSwitchyard = useCallback(
    () => import("../switchyard-daily/runtime").then((module) => module.mountSwitchyardPrototype),
    [],
  );
  const selected = games.find((game) => game.id === active) ?? games[0];

  return (
    <main className={styles.lab}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Internal staging surface · noindex</p>
          <h1>Future Games Lab</h1>
          <p>One preview surface for mechanic, responsive-layout, restart, and instrumentation QA before any candidate enters public discovery.</p>
        </div>
        <div className={styles.batchBadge}>6 staged · 0 public</div>
      </header>

      <nav className={styles.gameTabs} aria-label="Staged game prototypes">
        {games.map((game) => (
          <button
            type="button"
            key={game.id}
            onClick={() => setActive(game.id)}
            aria-pressed={active === game.id}
          >
            <span>{game.lane}</span>
            <strong>{game.title}</strong>
          </button>
        ))}
      </nav>

      <section className={styles.contextStrip}>
        <strong>{selected.title}</strong>
        <span>{selected.note}</span>
      </section>

      <section className={styles.stage} key={active}>
        {active === "traffic-control" ? (
          <PrototypeRuntimeHost slug="traffic-control" title="Traffic Control" loadRuntime={loadTraffic} />
        ) : null}
        {active === "switchyard-daily" ? (
          <PrototypeRuntimeHost slug="switchyard-daily" title="Switchyard Daily" loadRuntime={loadSwitchyard} />
        ) : null}
        {active === "market-maker" ? <MarketMakerPrototypePanel /> : null}
        {active === "supply-chain-shock" ? <SupplyChainPrototypePanel /> : null}
        {active === "chip-fab" ? <ChipFabPrototypePanel /> : null}
        {active === "power-grid-dispatcher" ? <PowerGridPrototypePanel /> : null}
      </section>

      <aside className={styles.qaCard}>
        <strong>Preview gate</strong>
        <span>First action obvious</span>
        <span>Mobile controls do not overlap</span>
        <span>Restart/reset works</span>
        <span>State changes are causally readable</span>
        <span>No console/runtime errors</span>
        <span>Reduced-motion pass before promotion</span>
      </aside>
    </main>
  );
}
