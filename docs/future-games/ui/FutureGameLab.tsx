"use client";

import { useCallback, useState } from "react";
import type { GameEventName, GameEventProperties } from "@/games/_shared/types/runtime";
import { MarketMakerPrototypePanel } from "./MarketMakerPrototype";
import { ChipFabPrototypePanel, PowerGridPrototypePanel, SupplyChainPrototypePanel } from "./ScenarioGamePrototypes";
import { PrototypeRuntimeHost } from "./PrototypeRuntimeHost";
import { SwitchyardDailyProgress } from "./SwitchyardDailyProgress";
import { compactPrototypeEvent } from "./prototype-events";
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
  const [latestEvent, setLatestEvent] = useState("No event yet");
  const [eventHistory, setEventHistory] = useState<GameEventName[]>([]);

  const onEvent = useCallback((event: GameEventName, properties: GameEventProperties = {}) => {
    setLatestEvent(compactPrototypeEvent(event, properties));
    setEventHistory((current) => [...current, event].slice(-32));
  }, []);

  const selectGame = useCallback((id: LabGame) => {
    setEventHistory([]);
    setLatestEvent("No event yet");
    setActive(id);
  }, []);

  const loadTraffic = useCallback(
    () => import("../traffic-control/runtime").then((module) => module.mountTrafficControlPrototype),
    [],
  );
  const loadSwitchyard = useCallback(
    () => import("../switchyard-daily/persistent-runtime").then((module) => module.mountPersistedSwitchyardPrototype),
    [],
  );
  const selected = games.find((game) => game.id === active) ?? games[0];

  return (
    <main className={styles.lab}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Internal staging surface µ noindex</p>
          <h1>Future Games Lab</h1>
          <p>One preview surface for mechanic, responsive-layout, restart, and instrumentation QA before any candidate enters public discovery.</p>
        </div>
        <div className={styles.batchBadge}>6 staged · 0 public</div>
      </header>

      <nav className={styles.gameTabs} aria-label="Staged game prototypes">
        {games.map((game) => (
          <button type="button" key={game.id} onClick={() => selectGame(game.id)} aria-pressed={active === game.id}>
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
        {active === "traffic-control" ? <PrototypeRuntimeHost slug="traffic-control" title="Traffic Control" loadRuntime={loadTraffic} onEvent={onEvent} /> : null}
        {active === "switchyard-daily" ? (
          <>
            <PrototypeRuntimeHost slug="switchyard-daily" title="Switchyard Daily" loadRuntime={loadSwitchyard} onEvent={onEvent} />
            <SwitchyardDailyProgress onEvent={onEvent} />
          </>
        ) : null}
        {active === "market-maker" ? <MarketMakerPrototypePanel onEvent={onEvent} /> : null}
        {active === "supply-chain-shock" ? <SupplyChainPrototypePanel onEvent={onEvent} /> : null}
        {active === "chip-fab" ? <ChipFabPrototypePanel onEvent={onEvent} /> : null}
        {active === "power-grid-dispatcher" ? <PowerGridPrototypePanel onEvent={onEvent} /> : null}
      </section>

      <p
        className={styles.eventReadout}
        data-lab-latest-event={latestEvent}
        data-lab-event-history={eventHistory.join(",")}
        aria-live="polite"
      >
        <strong>Lab event stream:</strong> {latestEvent}
      </p>

      <aside className={styles.qaCard}>
        <strong>Preview gate</strong>
        <span>First action obvious</span>
        <span>Mobile controls do not overlap</span>
        <span>Restart/reset works</span>
        <span>State changes are causally readable</span>
        <span>Analytics lifecycle is complete</span>
        <span>Reduced-motion pass before promotion</span>
      </aside>
    </main>
  );
}
