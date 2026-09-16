"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import {
  advanceLivePowerGrid,
  createLivePowerGridState,
  liveGridBalanceState,
  liveGridResult,
  updateLiveGridControls,
  type BatteryMode,
  type LiveGridControls,
} from "@/games/power-grid-dispatcher/liveModel";
import { captureGameEvent } from "@/lib/analytics/client";
import styles from "./PowerGridDispatcher.module.css";

const GAME_SLUG = "power-grid-dispatcher";
const GAME_VERSION = "0.2.0";
const SAVE_VERSION = 1;
const TICK_MS = 650;
const THERMAL_STEP = 5;

function nowMs() { return Date.now(); }
function readBestScore() { return readLocalGameValue<number>(GAME_SLUG, "best-score", SAVE_VERSION); }
function signed(value: number) { return value > 0 ? `+${Math.round(value)}` : String(Math.round(value)); }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }

export function PowerGridDispatcher() {
  const [state, setState] = useState(() => createLivePowerGridState());
  const [running, setRunning] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(() => readBestScore());
  const stateRef = useRef(state);
  const startedAt = useRef(0);
  const result = liveGridResult(state);
  const lastEntry = state.history.at(-1) ?? null;
  const balanceState = liveGridBalanceState(state.balance);
  const secondsRemaining = Math.max(0, ((state.maxTicks - state.tick) * TICK_MS) / 1000);
  const frequencyX = `${clamp(((state.frequency - 59.2) / 1.6) * 100, 0, 100)}%`;
  const frequencyStyle = { "--frequency-x": frequencyX } as CSSProperties;

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    captureGameEvent("game_viewed", { game_slug: GAME_SLUG, game_version: GAME_VERSION });
  }, []);

  const finishIfNeeded = useCallback((next: ReturnType<typeof advanceLivePowerGrid>) => {
    if (!next.complete) return;
    setRunning(false);
    const nextResult = liveGridResult(next);
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
      reliability: next.reliability,
      energy_not_served: next.energyNotServed,
      storage_remaining: next.storage,
      average_cost: nextResult?.averageCost ?? 0,
      average_emissions: nextResult?.averageEmissions ?? 0,
      duration_ms: Math.max(0, nowMs() - startedAt.current),
    });
  }, []);

  const advance = useCallback(() => {
    const current = stateRef.current;
    if (current.complete) return;
    const next = advanceLivePowerGrid(current);
    stateRef.current = next;
    setState(next);

    const entry = next.history.at(-1);
    if (entry) {
      captureGameEvent("level_completed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        tick: entry.tick,
        event: entry.eventId,
        balance: entry.balance,
        frequency: entry.frequency,
        reliability: entry.reliabilityAfter,
        score: entry.scoreAfter,
      });
    }
    finishIfNeeded(next);
  }, [finishIfNeeded]);

  useEffect(() => {
    if (!running || state.complete) return;
    const timer = window.setInterval(advance, TICK_MS);
    return () => window.clearInterval(timer);
  }, [advance, running, state.complete]);

  const changeControls = useCallback((patch: Partial<LiveGridControls>, action: string) => {
    const current = stateRef.current;
    if (current.complete) return;
    const next = updateLiveGridControls(current, patch);
    stateRef.current = next;
    setState(next);
    if (current.tick > 0 || running) {
      captureGameEvent("game_action", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        action,
        thermal: next.controls.thermal,
        battery: next.controls.battery,
        demand_response: next.controls.demandResponse,
        tick: next.tick,
      });
    }
  }, [running]);

  function changeThermal(delta: number) {
    changeControls({ thermal: stateRef.current.controls.thermal + delta }, delta > 0 ? "thermal_up" : "thermal_down");
  }

  function setBattery(battery: BatteryMode) {
    changeControls({ battery }, `battery_${battery}`);
  }

  function toggleDemandResponse() {
    const current = stateRef.current;
    if (current.demandResponseBudget <= 0) return;
    changeControls({ demandResponse: !current.controls.demandResponse }, "demand_response_toggle");
  }

  function start() {
    const current = stateRef.current;
    if (current.complete || running) return;
    if (current.tick === 0 && startedAt.current === 0) {
      startedAt.current = nowMs();
      captureGameEvent("game_started", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        ticks: current.maxTicks,
        cadence_ms: TICK_MS,
        trigger: "start_dispatch",
      });
    } else {
      captureGameEvent("game_resumed", { game_slug: GAME_SLUG, game_version: GAME_VERSION, tick: current.tick });
    }
    setRunning(true);
  }

  function pause() {
    if (!running || state.complete) return;
    setRunning(false);
    captureGameEvent("game_paused", { game_slug: GAME_SLUG, game_version: GAME_VERSION, tick: state.tick });
  }

  function reset() {
    captureGameEvent("game_restarted", {
      game_slug: GAME_SLUG,
      game_version: GAME_VERSION,
      previous_score: result?.score ?? null,
    });
    const next = createLivePowerGridState();
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
      if (event.key === "ArrowUp") { event.preventDefault(); changeThermal(THERMAL_STEP); }
      else if (event.key === "ArrowDown") { event.preventDefault(); changeThermal(-THERMAL_STEP); }
      else if (event.key === "1") { event.preventDefault(); setBattery("charge"); }
      else if (event.key === "2") { event.preventDefault(); setBattery("idle"); }
      else if (event.key === "3") { event.preventDefault(); setBattery("discharge"); }
      else if (event.code === "Space") { event.preventDefault(); toggleDemandResponse(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const styleExplanation = result
    ? result.style === "under-supplied"
      ? "The system spent too much time short of load. In a real grid, reliability dominates: cheap or clean dispatch is not useful if demand cannot be served."
      : result.style === "flexibility-spent"
        ? "You kept the grid moving, but arrived late in the session with both battery energy and demand response exhausted. Flexibility has option value when the next shock is uncertain."
        : result.style === "reliability-first"
          ? "Reliability stayed exceptionally high, but you leaned heavily on expensive firm generation. The next improvement is preserving the same stability with cheaper flexibility."
          : result.style === "low-carbon"
            ? "You kept unserved energy low while limiting thermal generation. That required timing storage and demand response around the highest-value periods."
            : "You balanced frequency, reliability, operating cost, emissions, and finite flexibility instead of maximizing one resource." 
    : null;

  return (
    <section
      className={styles.shell}
      aria-label="Power Grid Dispatcher simulation"
      data-grid-tick={state.tick}
      data-grid-complete={state.complete ? "true" : "false"}
      data-grid-running={running ? "true" : "false"}
      data-grid-thermal={state.controls.thermal}
      data-grid-battery={state.controls.battery}
      data-grid-dr={state.controls.demandResponse ? "true" : "false"}
      data-grid-storage={state.storage}
      data-grid-event={state.eventId}
    >
      <div className={styles.topline}>
        <div>
          <p className={styles.kicker}>Real-time system operator</p>
          <p className={styles.mandate}>Match supply to changing load for one compressed operating day. Frequency moves every tick; battery energy and demand response are finite.</p>
        </div>
        <div className={styles.progress}>
          <span>{state.complete ? "Day complete" : running ? "Live" : state.tick === 0 ? "Ready" : "Paused"}</span>
          <strong>{secondsRemaining.toFixed(1)}s</strong>
        </div>
      </div>

      <div className={styles.metrics} aria-label="Live grid metrics">
        <div data-state={balanceState}><span>Frequency</span><strong>{state.frequency.toFixed(1)} Hz</strong><small>{balanceState} balance</small></div>
        <div><span>Demand</span><strong>{Math.round(state.demand)} GW</strong><small>changes automatically</small></div>
        <div><span>Supply</span><strong>{Math.round(state.supply)} GW</strong><small>{signed(state.balance)} GW balance</small></div>
        <div><span>Reliability</span><strong>{Math.round(state.reliability)}</strong><small>cumulative operating health</small></div>
        <div><span>Score</span><strong>{state.score}</strong><small suppressHydrationWarning>best {bestScore ?? "—"}</small></div>
      </div>

      <div className={styles.gridPanel}>
        <div className={styles.eventHeader}>
          <div><p className={styles.kicker}>{state.eventLabel}</p><strong>{state.eventDetail}</strong></div>
          <span>{state.tick}/{state.maxTicks} ticks</span>
        </div>

        <div className={styles.frequencyMeter} style={frequencyStyle} data-state={balanceState} aria-label={`Grid frequency ${state.frequency.toFixed(1)} hertz`}>
          <span className={styles.dangerLeft}>59.2</span>
          <span className={styles.safeBand} aria-hidden="true" />
          <span className={styles.frequencyNeedle} aria-hidden="true" />
          <span className={styles.targetMark}>60.0</span>
          <span className={styles.dangerRight}>60.8</span>
        </div>

        <div className={styles.network} aria-label="Current supply stack">
          <div><span>Firm</span><strong>{Math.min(state.controls.thermal, state.firmCapacity)} GW</strong><small>cap {state.firmCapacity}</small></div>
          <span className={styles.connector} aria-hidden="true" />
          <div><span>Renewable</span><strong>{state.renewables} GW</strong><small>weather-driven</small></div>
          <span className={styles.connector} aria-hidden="true" />
          <div data-active={state.controls.battery !== "idle" ? "true" : "false"}><span>Battery</span><strong>{state.controls.battery}</strong><small>{Math.round(state.storage)}% stored</small></div>
          <span className={styles.connector} aria-hidden="true" />
          <div data-active={state.controls.demandResponse ? "true" : "false"}><span>Load</span><strong>{state.demand} GW</strong><small>DR {state.demandResponseBudget} ticks left</small></div>
        </div>

        <div className={styles.timeline} aria-label="Demand and supply history">
          {state.history.map((entry) => (
            <span className={styles.timelineTick} key={entry.tick} title={`Tick ${entry.tick}: demand ${entry.demand}, supply ${Math.round(entry.supply)}`}>
              <span className={styles.demandBar} style={{ height: `${clamp(entry.demand, 0, 100)}%` }} />
              <span className={styles.supplyBar} style={{ height: `${clamp(entry.supply, 0, 100)}%` }} data-state={liveGridBalanceState(entry.balance)} />
            </span>
          ))}
          {Array.from({ length: Math.max(0, state.maxTicks - state.history.length) }, (_, index) => <span className={styles.timelineFuture} key={`future-${index}`} />)}
        </div>
        <div className={styles.timelineLegend}><span><i className={styles.demandKey} />Demand</span><span><i className={styles.supplyKey} />Supply</span></div>
      </div>

      {!state.complete ? (
        <div className={styles.controlsPanel}>
          <div className={styles.controlBlock}>
            <div className={styles.controlHeading}><div><p className={styles.kicker}>Firm generation</p><strong>{state.controls.thermal} GW setpoint</strong></div><kbd>↑ ↓</kbd></div>
            <div className={styles.stepper}>
              <button type="button" onClick={() => changeThermal(-THERMAL_STEP)} aria-label="Thermal down">−</button>
              <div><span style={{ width: `${((state.controls.thermal - 25) / 67) * 100}%` }} /></div>
              <button type="button" onClick={() => changeThermal(THERMAL_STEP)} aria-label="Thermal up">+</button>
            </div>
            {state.controls.thermal > state.firmCapacity ? <small className={styles.constraint}>Transmission constraint: only {state.firmCapacity} GW can reach load.</small> : <small>Fast to adjust, but marginal output raises cost and emissions.</small>}
          </div>

          <div className={styles.controlBlock}>
            <div className={styles.controlHeading}><div><p className={styles.kicker}>Battery</p><strong>{Math.round(state.storage)}% energy</strong></div><kbd>1 2 3</kbd></div>
            <div className={styles.segmented}>
              <button type="button" onClick={() => setBattery("charge")} aria-pressed={state.controls.battery === "charge"}>Charge</button>
              <button type="button" onClick={() => setBattery("idle")} aria-pressed={state.controls.battery === "idle"}>Idle</button>
              <button type="button" onClick={() => setBattery("discharge")} aria-pressed={state.controls.battery === "discharge"}>Discharge</button>
            </div>
            <small>Stored energy is finite. Saving it preserves an option for later peaks and outages.</small>
          </div>

          <div className={styles.controlBlock}>
            <div className={styles.controlHeading}><div><p className={styles.kicker}>Demand response</p><strong>{state.demandResponseBudget} ticks available</strong></div><kbd>Space</kbd></div>
            <button className={styles.drButton} type="button" onClick={toggleDemandResponse} aria-pressed={state.controls.demandResponse} disabled={state.demandResponseBudget <= 0}>
              {state.demandResponseBudget <= 0 ? "Demand response exhausted" : state.controls.demandResponse ? "Demand response active" : "Enable demand response"}
            </button>
            <small>Reduces effective load by 9 GW, but only for a limited number of ticks.</small>
          </div>

          <div className={styles.runControls}>
            {!running ? <button className={styles.startButton} type="button" onClick={start}>{state.tick === 0 ? "Start dispatch" : "Resume dispatch"}</button> : <button className={styles.pauseButton} type="button" onClick={pause}>Pause dispatch</button>}
            <p>{running ? "The system is moving. Adjust controls without stopping the clock." : "Set your opening dispatch, then start the system clock."}</p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={styles.result} aria-label="Power Grid Dispatcher result">
          <div className={styles.resultScore}><span>Final score</span><strong>{result.score}</strong><small suppressHydrationWarning>Best {bestScore ?? result.score}</small></div>
          <div className={styles.resultBody}>
            <p className={styles.kicker}>Operator style</p><h2>{result.style.replaceAll("-", " ")}</h2><p>{styleExplanation}</p>
            <div className={styles.resultInsights}>
              <span><strong>{result.energyNotServed}</strong> GW-ticks energy not served</span>
              <span><strong>{result.reliability}</strong> ending reliability</span>
              <span><strong>{result.storageRemaining}%</strong> storage left</span>
              <span><strong>{result.averageCost}</strong> avg cost index</span>
              <span><strong>{result.averageEmissions}</strong> avg emissions index</span>
            </div>
          </div>
          <button type="button" className={styles.reset} onClick={reset}>Run another grid</button>
        </div>
      ) : null}

      <p className={styles.disclaimer}>Educational simulation only. Grid values are synthetic and compressed to illustrate balancing, frequency, finite flexibility, transmission limits, cost, emissions, and reliability tradeoffs.</p>
    </section>
  );
}
