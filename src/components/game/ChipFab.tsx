"use client";

import { useEffect, useRef, useState } from "react";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import {
  chipFabResult,
  createChipFabState,
  currentFabScenario,
  fabMetricChanges,
  fabOperatingSignals,
  playFabChoice,
  type FabMetric,
} from "@/games/chip-fab/model";
import { captureGameEvent } from "@/lib/analytics/client";
import styles from "./ChipFab.module.css";

const GAME_SLUG = "chip-fab";
const GAME_VERSION = "0.1.0";
const SAVE_VERSION = 1;

const metricLabels: Record<FabMetric, string> = {
  yield: "Yield",
  throughput: "Throughput",
  cycleTime: "Cycle time",
  defectRisk: "Defect risk",
  cash: "Cash",
};

const metricOrder: readonly FabMetric[] = ["yield", "throughput", "cycleTime", "defectRisk", "cash"];
const stations = ["Ramp", "Lithography", "Etch", "Deposition", "Metrology", "Test"] as const;

function nowMs() { return Date.now(); }
function signed(value: number) { const rounded = Math.round(value); return rounded > 0 ? `+${rounded}` : String(rounded); }
function readBestScore() { return readLocalGameValue<number>(GAME_SLUG, "best-score", SAVE_VERSION); }

export function ChipFab() {
  const [state, setState] = useState(() => createChipFabState());
  const [bestScore, setBestScore] = useState<number | null>(() => readBestScore());
  const startedAt = useRef(0);
  const scenario = currentFabScenario(state);
  const result = chipFabResult(state);
  const signals = fabOperatingSignals(state.metrics);
  const lastEntry = state.history.at(-1) ?? null;
  const lastChanges = fabMetricChanges(lastEntry);
  const activeStation = scenario?.id === "metrology-drift" ? "Metrology" : scenario?.id === "bottleneck" ? "Lithography" : scenario?.id === "maintenance-window" ? "Etch" : "Ramp";

  useEffect(() => {
    captureGameEvent("game_viewed", { game_slug: GAME_SLUG, game_version: GAME_VERSION });
  }, []);

  function choose(choiceId: string) {
    if (!scenario || state.complete) return;
    if (state.history.length === 0) {
      startedAt.current = nowMs();
      captureGameEvent("game_started", { game_slug: GAME_SLUG, game_version: GAME_VERSION, pack: GAME_SLUG, version: GAME_VERSION, trigger: "first_decision" });
    }

    const next = playFabChoice(state, choiceId);
    const entry = next.history.at(-1);
    setState(next);
    if (entry) {
      captureGameEvent("level_completed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        step: entry.scenarioId,
        choice: entry.choiceId,
        yield: next.metrics.yield,
        throughput: next.metrics.throughput,
        cycle_time: next.metrics.cycleTime,
        defect_risk: next.metrics.defectRisk,
        cash: next.metrics.cash,
      });
    }
    if (next.complete) {
      const nextResult = chipFabResult(next);
      const score = nextResult?.score ?? 0;
      const nextBest = Math.max(bestScore ?? Number.NEGATIVE_INFINITY, score);
      writeLocalGameValue(GAME_SLUG, "best-score", SAVE_VERSION, nextBest);
      setBestScore(nextBest);
      captureGameEvent("game_completed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        score,
        style: nextResult?.style ?? "unknown",
        duration_ms: Math.max(0, nowMs() - startedAt.current),
        good_output: fabOperatingSignals(next.metrics).goodOutput,
        yield: next.metrics.yield,
        throughput: next.metrics.throughput,
        cycle_time: next.metrics.cycleTime,
        defect_risk: next.metrics.defectRisk,
      });
    }
  }

  function reset() {
    captureGameEvent("game_restarted", { game_slug: GAME_SLUG, game_version: GAME_VERSION, previous_score: result?.score ?? null });
    startedAt.current = 0;
    setState(createChipFabState());
  }

  const context = scenario?.id === "bottleneck"
    ? "Bottleneck utilization is not the same as fab output. Pushing a tool toward 100% utilization can increase queues and cycle time faster than it increases good die."
    : scenario?.id === "metrology-drift"
      ? "Inline process signals arrive before final electrical yield. Waiting for final-test proof can let a small drift compound into a larger excursion."
      : scenario?.id === "maintenance-window"
        ? "Planned downtime looks expensive in the current month, but deferred maintenance can return as lower yield and higher defect exposure."
        : "Good output combines throughput and yield. More wafer starts help only when the process can convert them into good die without congestion and rework.";

  return (
    <section className={styles.shell} aria-label="Chip Fab simulation" data-fab-step={state.scenarioIndex} data-fab-complete={state.complete ? "true" : "false"}>
      <div className={styles.topline}>
        <div>
          <p className={styles.kicker}>Fab control room</p>
          <p className={styles.mandate}>Ramp output through four operating decisions without confusing tool utilization with useful production.</p>
        </div>
        <div className={styles.progress}><span>{state.complete ? "Complete" : "Decision"}</span><strong>{state.complete ? "4/4" : `${state.scenarioIndex + 1}/4`}</strong></div>
      </div>

      <div className={styles.metrics} aria-label="Fab metrics">
        {metricOrder.map((metric) => (
          <div key={metric}>
            <span>{metricLabels[metric]}</span>
            <strong>{Math.round(state.metrics[metric])}</strong>
            <small>{metric === "cycleTime" || metric === "defectRisk" ? "lower is better" : "higher is better"}</small>
          </div>
        ))}
      </div>

      <div className={styles.fabPanel}>
        <div className={styles.flow} aria-label="Fab process flow">
          {stations.map((station, index) => (
            <span className={styles.flowGroup} key={station}>
              <span className={styles.station} data-active={station === activeStation ? "true" : "false"}>{station}</span>
              {index < stations.length - 1 ? <span className={styles.connector} aria-hidden="true" /> : null}
            </span>
          ))}
        </div>
        <div className={styles.signals} aria-label="Fab operating signals">
          <div data-state="controlled" data-fab-signal="good-output"><span>Good output</span><strong>{signals.goodOutput}</strong><small>Throughput × yield</small></div>
          <div data-state={signals.congestion} data-fab-signal="congestion"><span>Cycle-time pressure</span><strong>{signals.congestion.toUpperCase()}</strong><small>Queueing and flow delay</small></div>
          <div data-state={signals.processRisk} data-fab-signal="process-risk"><span>Process risk</span><strong>{signals.processRisk.toUpperCase()}</strong><small>Defect exposure</small></div>
        </div>
        <p className={styles.context} data-fab-context>{context}</p>
      </div>

      {lastEntry && lastChanges.length ? (
        <div className={styles.impactPanel} aria-live="polite">
          <div><p className={styles.kicker}>What your last decision changed</p><strong>{lastEntry.feedback}</strong></div>
          <div className={styles.deltaGrid}>
            {lastChanges.map((change) => (
              <div key={change.metric} data-impact={change.improvement > 0 ? "positive" : "pressure"}><span>{metricLabels[change.metric]}</span><strong>{signed(change.delta)}</strong></div>
            ))}
          </div>
        </div>
      ) : null}

      {!state.complete && scenario ? (
        <div className={styles.decisionPanel}>
          <div className={styles.prompt}><p className={styles.kicker}>{scenario.title}</p><h2>{scenario.prompt}</h2></div>
          <div className={styles.choiceGrid}>
            {scenario.choices.map((choice) => (
              <button type="button" key={choice.id} className={styles.choice} onClick={() => choose(choice.id)}>
                <strong>{choice.label}</strong><span>{choice.detail}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={styles.result} aria-label="Chip Fab result">
          <div className={styles.resultScore}><span>Final score</span><strong>{result.score}</strong><small suppressHydrationWarning>Best {bestScore ?? result.score}</small></div>
          <div className={styles.resultBody}>
            <p className={styles.kicker}>Ramp style</p><h2>{result.style.replaceAll("-", " ")}</h2>
            <p>{result.style === "overdriven" ? "The fab stayed busy, but yield and cycle-time economics show that loading tools harder did not translate cleanly into good output." : result.style === "process-first" ? "You protected process learning and yield, accepting slower volume growth to build a more stable manufacturing baseline." : result.style === "capacity-first" ? "You bought throughput aggressively, but the capital burden became a major part of the operating tradeoff." : "You balanced process learning, useful throughput, cycle time, risk, and cash rather than maximizing any single utilization metric."}</p>
            <div className={styles.resultInsights}>
              {result.strongestImprovement ? <span><strong>{metricLabels[result.strongestImprovement.metric]}</strong> {signed(result.strongestImprovement.delta)} from start</span> : null}
              {result.biggestPressure ? <span><strong>{metricLabels[result.biggestPressure.metric]}</strong> {signed(result.biggestPressure.delta)} from start</span> : null}
              <span><strong>Good output</strong> {signals.goodOutput}</span>
            </div>
          </div>
          <button type="button" className={styles.reset} onClick={reset}>Run another fab</button>
        </div>
      ) : null}

      <p className={styles.disclaimer}>Educational simulation only. The fab metrics are synthetic and simplified to illustrate yield, throughput, cycle time, defect risk, bottlenecks, and maintenance tradeoffs.</p>
    </section>
  );
}
