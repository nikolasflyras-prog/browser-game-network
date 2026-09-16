"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import {
  advanceLiveChipFab,
  createLiveChipFabState,
  liveFabResult,
  liveFabSignals,
  scheduleFabMaintenance,
  updateLiveFabControls,
  type FabStartMode,
  type FabStationId,
} from "@/games/chip-fab/liveModel";
import { captureGameEvent } from "@/lib/analytics/client";
import styles from "./ChipFab.module.css";

const GAME_SLUG = "chip-fab";
const GAME_VERSION = "0.2.0";
const SAVE_VERSION = 1;
const TICK_MS = 600;
const stationOrder: readonly FabStationId[] = ["lithography", "etch", "metrology"];
const stationLabels: Record<FabStationId, string> = { lithography: "Lithography", etch: "Etch", metrology: "Metrology" };
const startLabels: Record<FabStartMode, string> = { hold: "Hold", steady: "Steady", push: "Push" };

function nowMs() { return Date.now(); }
function readBestScore() { return readLocalGameValue<number>(GAME_SLUG, "best-score", SAVE_VERSION); }

export function ChipFab() {
  const [state, setState] = useState(() => createLiveChipFabState());
  const [running, setRunning] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(() => readBestScore());
  const stateRef = useRef(state);
  const startedAt = useRef(0);
  const signals = liveFabSignals(state);
  const result = liveFabResult(state);
  const secondsRemaining = Math.max(0, ((state.maxTicks - state.tick) * TICK_MS) / 1000);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { captureGameEvent("game_viewed", { game_slug: GAME_SLUG, game_version: GAME_VERSION }); }, []);

  const finishIfNeeded = useCallback((next: ReturnType<typeof advanceLiveChipFab>) => {
    if (!next.complete) return;
    setRunning(false);
    const nextResult = liveFabResult(next);
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
      good_die: nextResult?.goodDie ?? next.goodDie,
      yield_rate: nextResult?.yieldRate ?? 0,
      ending_wip: nextResult?.endingWip ?? 0,
      scrap: nextResult?.scrap ?? next.scrap,
      duration_ms: Math.max(0, nowMs() - startedAt.current),
    });
  }, []);

  const advance = useCallback(() => {
    const current = stateRef.current;
    if (current.complete) return;
    const next = advanceLiveChipFab(current);
    stateRef.current = next;
    setState(next);
    const entry = next.history.at(-1);
    if (entry) {
      captureGameEvent("level_completed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        tick: entry.tick,
        event: entry.eventId,
        starts: entry.starts,
        completed: entry.completed,
        wip: entry.totalWip,
        yield_rate: entry.yieldRate,
        score: entry.score,
      });
    }
    finishIfNeeded(next);
  }, [finishIfNeeded]);

  useEffect(() => {
    if (!running || state.complete) return;
    const timer = window.setInterval(advance, TICK_MS);
    return () => window.clearInterval(timer);
  }, [advance, running, state.complete]);

  const changeStartMode = useCallback((startMode: FabStartMode) => {
    const current = stateRef.current;
    const next = updateLiveFabControls(current, { startMode });
    stateRef.current = next;
    setState(next);
    if (current.tick > 0 || running) captureGameEvent("game_action", { game_slug: GAME_SLUG, game_version: GAME_VERSION, action: "start_mode", start_mode: startMode, tick: current.tick });
  }, [running]);

  const changeFocus = useCallback((focus: FabStationId) => {
    const current = stateRef.current;
    const next = updateLiveFabControls(current, { focus });
    stateRef.current = next;
    setState(next);
    if (current.tick > 0 || running) captureGameEvent("game_action", { game_slug: GAME_SLUG, game_version: GAME_VERSION, action: "crew_focus", station: focus, tick: current.tick });
  }, [running]);

  function maintain(station: FabStationId) {
    const current = stateRef.current;
    const next = scheduleFabMaintenance(current, station);
    if (next === current) return;
    stateRef.current = next;
    setState(next);
    captureGameEvent("game_action", { game_slug: GAME_SLUG, game_version: GAME_VERSION, action: "preventive_maintenance", station, tick: current.tick });
  }

  function start() {
    const current = stateRef.current;
    if (current.complete || running) return;
    if (current.tick === 0 && startedAt.current === 0) {
      startedAt.current = nowMs();
      captureGameEvent("game_started", { game_slug: GAME_SLUG, game_version: GAME_VERSION, ticks: current.maxTicks, cadence_ms: TICK_MS, trigger: "start_fab" });
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
    const next = createLiveChipFabState();
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
      if (event.key === "1") changeStartMode("hold");
      else if (event.key === "2") changeStartMode("steady");
      else if (event.key === "3") changeStartMode("push");
      else if (event.key.toLowerCase() === "q") changeFocus("lithography");
      else if (event.key.toLowerCase() === "w") changeFocus("etch");
      else if (event.key.toLowerCase() === "e") changeFocus("metrology");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changeFocus, changeStartMode]);

  const resultCopy = result
    ? result.style === "bottlenecked"
      ? "WIP accumulated faster than the constrained process could clear it. High starts and high utilization looked productive, but queue time became the real limiter."
      : result.style === "overdriven"
        ? "You shipped meaningful volume, but process health and yield paid for the aggressive ramp. More starts do not automatically become more good die."
        : result.style === "process-first"
          ? "You protected process control and yield, but left some output on the table. The next step is adding starts only where the line has capacity."
          : result.style === "maintenance-heavy"
            ? "You protected tool health aggressively. Planned downtime is useful, but too much simultaneous maintenance can starve the line of output."
            : "You balanced starts, bottleneck capacity, engineering attention, maintenance, and process health to maximize useful output rather than raw utilization."
    : null;

  return (
    <section
      className={styles.shell}
      aria-label="Chip Fab simulation"
      data-fab-tick={state.tick}
      data-fab-complete={state.complete ? "true" : "false"}
      data-fab-running={running ? "true" : "false"}
      data-fab-start-mode={state.startMode}
      data-fab-focus={state.focus}
      data-fab-wip={signals.totalWip}
      data-fab-event={state.eventId}
      data-fab-litho-maint={state.stations.lithography.maintenanceTicks}
      data-fab-metro-maint={state.stations.metrology.maintenanceTicks}
    >
      <div className={styles.topline}>
        <div><p className={styles.kicker}>Live fab floor</p><p className={styles.mandate}>Feed wafers into a three-step process while queues, tool health, maintenance, and bottlenecks evolve continuously. Win on good die, not utilization.</p></div>
        <div className={styles.progress}><span>{state.complete ? "Run complete" : running ? "Line live" : state.tick === 0 ? "Ready" : "Paused"}</span><strong>{secondsRemaining.toFixed(1)}s</strong></div>
      </div>

      <div className={styles.metrics} aria-label="Fab metrics">
        <div><span>Good die</span><strong>{Math.round(state.goodDie)}</strong><small>cumulative useful output</small></div>
        <div><span>Yield</span><strong>{signals.yieldRate.toFixed(0)}%</strong><small>good / completed</small></div>
        <div data-state={signals.flowState}><span>WIP</span><strong>{signals.totalWip}</strong><small>queue and cycle-time pressure</small></div>
        <div data-state={signals.processState}><span>Tool health</span><strong>{signals.averageHealth.toFixed(0)}</strong><small>average process condition</small></div>
        <div><span>Score</span><strong>{state.score}</strong><small suppressHydrationWarning>best {bestScore ?? "—"}</small></div>
      </div>

      <div className={styles.fabPanel}>
        <div className={styles.eventHeader}><div><p className={styles.kicker}>{state.eventLabel}</p><strong>{state.eventDetail}</strong></div><span>{state.tick}/{state.maxTicks} ticks</span></div>
        <div className={styles.flow} aria-label="Live fab process flow">
          {stationOrder.map((station, index) => {
            const stationState = state.stations[station];
            const isFocused = state.focus === station;
            const alert = stationState.health < 65 || stationState.maintenanceTicks > 0;
            return (
              <span className={styles.flowGroup} key={station}>
                <div className={styles.station} data-focused={isFocused ? "true" : "false"} data-alert={alert ? "true" : "false"}>
                  <div className={styles.stationTop}><span>{stationLabels[station]}</span><strong>{stationState.maintenanceTicks > 0 ? `PM ${stationState.maintenanceTicks}` : `${Math.round(stationState.health)}%`}</strong></div>
                  <div className={styles.queue} aria-label={`${stationLabels[station]} queue ${stationState.queue}`}>
                    {Array.from({ length: Math.min(12, stationState.queue) }, (_, dot) => <i key={dot} />)}
                    {stationState.queue > 12 ? <b>+{stationState.queue - 12}</b> : null}
                  </div>
                  <div className={styles.stationStats}><span>Queue <strong>{stationState.queue}</strong></span><span>Health <strong>{Math.round(stationState.health)}</strong></span></div>
                  <div className={styles.stationActions}>
                    <button type="button" onClick={() => changeFocus(station)} aria-pressed={isFocused}>Focus {stationLabels[station]}</button>
                    <button type="button" onClick={() => maintain(station)} disabled={stationState.maintenanceTicks > 0 || state.cash < 5}>PM {stationLabels[station]}</button>
                  </div>
                </div>
                {index < stationOrder.length - 1 ? <span className={styles.connector} aria-hidden="true" /> : null}
              </span>
            );
          })}
        </div>

        <div className={styles.signals}>
          <div data-state={signals.flowState}><span>Flow pressure</span><strong>{signals.flowState.toUpperCase()}</strong><small>{signals.totalWip} wafers in process</small></div>
          <div data-state={signals.processState}><span>Process health</span><strong>{signals.processState.toUpperCase()}</strong><small>{signals.averageHealth.toFixed(0)} average health</small></div>
          <div><span>Current bottleneck</span><strong>{stationLabels[signals.bottleneck]}</strong><small>largest queue in the line</small></div>
        </div>
      </div>

      {!state.complete ? (
        <div className={styles.controlsPanel}>
          <div className={styles.startControl}>
            <div><p className={styles.kicker}>Wafer starts</p><strong>{startLabels[state.startMode]} feed</strong><small>Use 1 / 2 / 3</small></div>
            <div className={styles.segmented}>
              {(["hold", "steady", "push"] as const).map((mode) => <button type="button" key={mode} onClick={() => changeStartMode(mode)} aria-pressed={state.startMode === mode}>{startLabels[mode]}</button>)}
            </div>
          </div>
          <div className={styles.floorReadout}><span>Engineering crew</span><strong>{stationLabels[state.focus]}</strong><small>Q Lithography · W Etch · E Metrology</small></div>
          <div className={styles.floorReadout}><span>Fab cash</span><strong>{state.cash.toFixed(0)}</strong><small>PM costs 5; good output replenishes cash</small></div>
          <div className={styles.runControls}>
            {!running ? <button className={styles.startButton} type="button" onClick={start}>{state.tick === 0 ? "Start fab" : "Resume fab"}</button> : <button className={styles.pauseButton} type="button" onClick={pause}>Pause fab</button>}
            <p>{running ? "The line is moving. Change starts, move the crew, or schedule PM without stopping the clock." : "Set your opening start rate and crew focus, then release wafers into the line."}</p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={styles.result} aria-label="Chip Fab result">
          <div className={styles.resultScore}><span>Final score</span><strong>{result.score}</strong><small suppressHydrationWarning>Best {bestScore ?? result.score}</small></div>
          <div className={styles.resultBody}><p className={styles.kicker}>Ramp style</p><h2>{result.style.replaceAll("-", " ")}</h2><p>{resultCopy}</p><div className={styles.resultInsights}><span><strong>{result.goodDie}</strong> good die</span><span><strong>{result.yieldRate}%</strong> yield</span><span><strong>{result.endingWip}</strong> ending WIP</span><span><strong>{result.scrap}</strong> scrap</span><span><strong>{result.cash}</strong> cash</span></div></div>
          <button type="button" className={styles.reset} onClick={reset}>Run another fab</button>
        </div>
      ) : null}

      <p className={styles.disclaimer}>Educational simulation only. Fab values are synthetic and compressed to illustrate WIP, bottlenecks, process health, yield, maintenance, cycle time, and useful-output tradeoffs.</p>
    </section>
  );
}
