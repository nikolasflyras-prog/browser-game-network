"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import {
  advanceLiveSupplyChain,
  createLiveSupplyChainState,
  liveSupplyResult,
  liveSupplySignals,
  updateLiveSupplyControls,
  type SupplyFreightMode,
  type SupplyOrderMode,
  type SupplySourceMode,
} from "@/games/supply-chain-shock/liveModel";
import { captureGameEvent } from "@/lib/analytics/client";
import styles from "./SupplyChainShock.module.css";

const GAME_SLUG = "supply-chain-shock";
const GAME_VERSION = "0.2.0";
const SAVE_VERSION = 1;
const TICK_MS = 650;

const orderLabels: Record<SupplyOrderMode, string> = { lean: "Lean", steady: "Steady", buffer: "Buffer" };
const sourceLabels: Record<SupplySourceMode, string> = { primary: "Primary", split: "Split", backup: "Backup" };
const freightLabels: Record<SupplyFreightMode, string> = { ocean: "Ocean", mixed: "Mixed", air: "Air" };

function nowMs() { return Date.now(); }
function readBestScore() { return readLocalGameValue<number>(GAME_SLUG, "best-score", SAVE_VERSION); }

export function SupplyChainShock() {
  const [state, setState] = useState(() => createLiveSupplyChainState());
  const [running, setRunning] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(() => readBestScore());
  const stateRef = useRef(state);
  const startedAt = useRef(0);
  const signals = liveSupplySignals(state);
  const result = liveSupplyResult(state);
  const secondsRemaining = Math.max(0, ((state.maxTicks - state.tick) * TICK_MS) / 1000);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { captureGameEvent("game_viewed", { game_slug: GAME_SLUG, game_version: GAME_VERSION }); }, []);

  const finishIfNeeded = useCallback((next: ReturnType<typeof advanceLiveSupplyChain>) => {
    if (!next.complete) return;
    setRunning(false);
    const nextResult = liveSupplyResult(next);
    const score = nextResult?.score ?? next.score;
    setBestScore((currentBest) => {
      const nextBest = Math.max(currentBest ?? Number.NEGATIVE_INFINITY, score);
      writeLocalGameValue(GAME_SLUG, "best-score", SAVE_VERSION, nextBest);
      return nextBest;
    });
    captureGameEvent("game_completed", {
      game_slug: GAME_SLUG,
      game_version: GAME_VERSION,
      score,
      style: nextResult?.style ?? "unknown",
      service: next.service,
      backlog: next.backlog,
      inventory: next.inventory,
      cash: next.cash,
      expedite_spend: next.expediteSpend,
      duration_ms: Math.max(0, nowMs() - startedAt.current),
    });
  }, []);

  const advance = useCallback(() => {
    const current = stateRef.current;
    if (current.complete) return;
    const next = advanceLiveSupplyChain(current);
    stateRef.current = next;
    setState(next);
    const entry = next.history.at(-1);
    if (entry) captureGameEvent("level_completed", { game_slug: GAME_SLUG, game_version: GAME_VERSION, tick: entry.tick, event: entry.eventId, demand: entry.demand, fulfilled: entry.fulfilled, backlog: entry.backlogAfter, service: entry.serviceAfter, lead_time: entry.leadTime, score: entry.scoreAfter });
    finishIfNeeded(next);
  }, [finishIfNeeded]);

  useEffect(() => {
    if (!running || state.complete) return;
    const timer = window.setInterval(advance, TICK_MS);
    return () => window.clearInterval(timer);
  }, [advance, running, state.complete]);

  const patchControls = useCallback((patch: Parameters<typeof updateLiveSupplyControls>[1], action: string) => {
    const current = stateRef.current;
    const next = updateLiveSupplyControls(current, patch);
    stateRef.current = next;
    setState(next);
    if (current.tick > 0 || running) captureGameEvent("game_action", { game_slug: GAME_SLUG, game_version: GAME_VERSION, action, order_mode: next.controls.orderMode, source_mode: next.controls.sourceMode, freight_mode: next.controls.freightMode, tick: next.tick });
  }, [running]);

  function setOrderMode(orderMode: SupplyOrderMode) { patchControls({ orderMode }, "order_mode"); }
  function setSourceMode(sourceMode: SupplySourceMode) { patchControls({ sourceMode }, "source_mode"); }
  function setFreightMode(freightMode: SupplyFreightMode) { patchControls({ freightMode }, "freight_mode"); }

  function start() {
    const current = stateRef.current;
    if (current.complete || running) return;
    if (current.tick === 0 && startedAt.current === 0) {
      startedAt.current = nowMs();
      captureGameEvent("game_started", { game_slug: GAME_SLUG, game_version: GAME_VERSION, ticks: current.maxTicks, cadence_ms: TICK_MS, trigger: "start_network" });
    } else captureGameEvent("game_resumed", { game_slug: GAME_SLUG, game_version: GAME_VERSION, tick: current.tick });
    setRunning(true);
  }

  function pause() {
    if (!running || state.complete) return;
    setRunning(false);
    captureGameEvent("game_paused", { game_slug: GAME_SLUG, game_version: GAME_VERSION, tick: state.tick });
  }

  function reset() {
    captureGameEvent("game_restarted", { game_slug: GAME_SLUG, game_version: GAME_VERSION, previous_score: result?.score ?? null });
    const next = createLiveSupplyChainState();
    stateRef.current = next;
    startedAt.current = 0;
    setRunning(false);
    setState(next);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT") return;
      const key = event.key.toLowerCase();
      if (key === "1") setOrderMode("lean"); else if (key === "2") setOrderMode("steady"); else if (key === "3") setOrderMode("buffer");
      else if (key === "q") setSourceMode("primary"); else if (key === "w") setSourceMode("split"); else if (key === "e") setSourceMode("backup");
      else if (key === "a") setFreightMode("ocean"); else if (key === "s") setFreightMode("mixed"); else if (key === "d") setFreightMode("air");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const resultCopy = result
    ? result.style === "resilient-network"
      ? "You carried enough alternate sourcing and pipeline inventory to keep service high through the shutdown without relying on permanent emergency freight."
      : result.style === "airfreight-dependent"
        ? "Service was protected with speed, but repeated expediting became the operating model. Air freight is a bridge, not a substitute for network resilience."
        : result.style === "lean-exposed"
          ? "The network stayed lean until variability arrived. Low inventory can be efficient, but only when lead times and alternate supply can absorb disruption."
          : result.style === "over-buffered"
            ? "You protected service by holding a large buffer. The tradeoff is working capital trapped in stock after the shock has passed."
            : "You balanced order rate, source diversification, freight speed, working capital, service, and backlog across changing lead-time shocks."
    : null;

  return (
    <section
      className={styles.shell}
      aria-label="Supply Chain Shock simulation"
      data-supply-tick={state.tick}
      data-supply-complete={state.complete ? "true" : "false"}
      data-supply-running={running ? "true" : "false"}
      data-supply-order={state.controls.orderMode}
      data-supply-source={state.controls.sourceMode}
      data-supply-freight={state.controls.freightMode}
      data-supply-event={state.eventId}
      data-supply-transit={state.inTransit.length}
    >
      <div className={styles.topline}>
        <div><p className={styles.kicker}>Live operations network</p><p className={styles.mandate}>Keep customers supplied while every order travels through a real lead-time pipeline. Change order rate, sourcing, and freight before the disruption reaches the warehouse.</p></div>
        <div className={styles.progress}><span>{state.complete ? "Run complete" : running ? "Network live" : state.tick === 0 ? "Ready" : "Paused"}</span><strong>{secondsRemaining.toFixed(1)}s</strong></div>
      </div>

      <div className={styles.metrics} aria-label="Supply-chain metrics">
        <div data-state={signals.serviceState}><span>Service</span><strong>{state.service.toFixed(0)}%</strong><small>fulfilled / cumulative demand</small></div>
        <div><span>Inventory</span><strong>{state.inventory.toFixed(0)}</strong><small>on hand now</small></div>
        <div data-state={signals.backlogState}><span>Backlog</span><strong>{state.backlog.toFixed(0)}</strong><small>unfilled customer demand</small></div>
        <div><span>Cash</span><strong>{state.cash.toFixed(0)}</strong><small>working-capital flexibility</small></div>
        <div><span>Score</span><strong>{state.score}</strong><small suppressHydrationWarning>best {bestScore ?? "—"}</small></div>
      </div>

      <div className={styles.networkPanel}>
        <div className={styles.eventHeader}><div><p className={styles.kicker}>{state.eventLabel}</p><strong>{state.eventDetail}</strong></div><span>{state.tick}/{state.maxTicks} ticks</span></div>
        <div className={styles.network} aria-label="Live supply pipeline">
          <div className={styles.node} data-active="true"><span>Source</span><strong>{sourceLabels[state.controls.sourceMode]}</strong><small>{orderLabels[state.controls.orderMode]} order rate</small></div>
          <span className={styles.connector} aria-hidden="true" />
          <div className={styles.transitNode}><span>In transit</span><strong>{signals.inTransitUnits.toFixed(0)} units</strong><div className={styles.shipments}>{state.inTransit.slice(0,8).map((shipment) => <i key={`${shipment.id}-${shipment.eta}`} title={`${shipment.quantity} units, ${shipment.eta} ticks away`} data-fast={shipment.freight === "air" ? "true" : "false"}>{shipment.quantity.toFixed(0)}<b>{shipment.eta}t</b></i>)}{state.inTransit.length > 8 ? <em>+{state.inTransit.length - 8}</em> : null}</div><small>{signals.nextArrival === null ? "no arrivals scheduled" : `next arrival in ${signals.nextArrival} tick${signals.nextArrival === 1 ? "" : "s"}`}</small></div>
          <span className={styles.connector} aria-hidden="true" />
          <div className={styles.node}><span>Warehouse</span><strong>{state.inventory.toFixed(0)} on hand</strong><small>{signals.inventoryPosition.toFixed(0)} inventory position</small></div>
          <span className={styles.connector} aria-hidden="true" />
          <div className={styles.node} data-alert={state.backlog > 6 ? "true" : "false"}><span>Customers</span><strong>{state.demand} demand</strong><small>{state.backlog.toFixed(0)} backlog</small></div>
        </div>
      </div>

      {!state.complete ? (
        <div className={styles.controlsPanel}>
          <div className={styles.controlBlock}><div className={styles.controlHeading}><div><p className={styles.kicker}>Order rate</p><strong>{orderLabels[state.controls.orderMode]}</strong></div><kbd>1 2 3</kbd></div><div className={styles.segmented}>{(["lean","steady","buffer"] as const).map((mode) => <button type="button" key={mode} onClick={() => setOrderMode(mode)} aria-pressed={state.controls.orderMode === mode}>{orderLabels[mode]}</button>)}</div><small>Lean saves working capital; buffer feed builds pipeline inventory before demand arrives.</small></div>
          <div className={styles.controlBlock}><div className={styles.controlHeading}><div><p className={styles.kicker}>Sourcing</p><strong>{sourceLabels[state.controls.sourceMode]}</strong></div><kbd>Q W E</kbd></div><div className={styles.segmented}>{(["primary","split","backup"] as const).map((mode) => <button type="button" key={mode} onClick={() => setSourceMode(mode)} aria-pressed={state.controls.sourceMode === mode}>{sourceLabels[mode]}</button>)}</div><small>Primary is cheapest. Split and backup cost more but preserve flow when the original supplier fails.</small></div>
          <div className={styles.controlBlock}><div className={styles.controlHeading}><div><p className={styles.kicker}>Freight</p><strong>{freightLabels[state.controls.freightMode]}</strong></div><kbd>A S D</kbd></div><div className={styles.segmented}>{(["ocean","mixed","air"] as const).map((mode) => <button type="button" key={mode} onClick={() => setFreightMode(mode)} aria-pressed={state.controls.freightMode === mode}>{freightLabels[mode]}</button>)}</div><small>Faster freight shortens lead time but spends cash. Port delays hit ocean shipments hardest.</small></div>
          <div className={styles.runControls}>{!running ? <button className={styles.startButton} type="button" onClick={start}>{state.tick === 0 ? "Start network" : "Resume network"}</button> : <button className={styles.pauseButton} type="button" onClick={pause}>Pause network</button>}<p>{running ? "Orders and customer demand continue every tick. Changes affect newly launched shipments, not inventory already in transit." : "Set your opening network policy, then start the clock."}</p></div>
        </div>
      ) : null}

      {result ? (
        <div className={styles.result} aria-label="Supply Chain Shock result"><div className={styles.resultScore}><span>Final score</span><strong>{result.score}</strong><small suppressHydrationWarning>Best {bestScore ?? result.score}</small></div><div className={styles.resultBody}><p className={styles.kicker}>Network style</p><h2>{result.style.replaceAll("-", " ")}</h2><p>{resultCopy}</p><div className={styles.resultInsights}><span><strong>{result.service}%</strong> service</span><span><strong>{result.endingInventory}</strong> ending inventory</span><span><strong>{result.backlog}</strong> backlog</span><span><strong>{result.cash}</strong> cash</span><span><strong>{result.expediteSpend}</strong> expedite spend</span></div></div><button type="button" className={styles.reset} onClick={reset}>Run another network</button></div>
      ) : null}

      <p className={styles.disclaimer}>Educational simulation only. Quantities and lead times are synthetic and compressed to illustrate pipeline inventory, sourcing concentration, freight speed, service, backlog, and working-capital tradeoffs.</p>
    </section>
  );
}
