"use client";

import { useEffect, useRef, useState } from "react";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import {
  createPowerGridState,
  currentGridScenario,
  gridChoiceAvailability,
  gridMetricChanges,
  gridOperatingSignals,
  playGridChoice,
  powerGridResult,
  type GridMetric,
} from "@/games/power-grid-dispatcher/model";
import { captureGameEvent } from "@/lib/analytics/client";
import styles from "./PowerGridDispatcher.module.css";

const GAME_SLUG = "power-grid-dispatcher";
const GAME_VERSION = "0.1.0";
const SAVE_VERSION = 1;

const metricLabels: Record<GridMetric, string> = {
  reliability: "Reliability",
  cost: "System cost",
  emissions: "Emissions",
  reserve: "Reserve",
  storage: "Storage",
};

const metricOrder: readonly GridMetric[] = ["reliability", "reserve", "storage", "cost", "emissions"];

function nowMs() {
  return Date.now();
}

function signed(value: number) {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

function readBestScore() {
  return readLocalGameValue<number>(GAME_SLUG, "best-score", SAVE_VERSION);
}

function signalState(state: "secure" | "watch" | "critical" | "adequate" | "tight" | "flexible" | "limited" | "depleted") {
  if (state === "secure" || state === "adequate" || state === "flexible") return "controlled";
  if (state === "watch" || state === "tight" || state === "limited") return "watch";
  return "high";
}

export function PowerGridDispatcher() {
  const [state, setState] = useState(() => createPowerGridState());
  const [notice, setNotice] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(() => readBestScore());
  const startedAt = useRef(0);
  const scenario = currentGridScenario(state);
  const result = powerGridResult(state);
  const signals = gridOperatingSignals(state.metrics);
  const lastEntry = state.history.at(-1) ?? null;
  const lastChanges = gridMetricChanges(lastEntry);

  useEffect(() => {
    captureGameEvent("game_viewed", { game_slug: GAME_SLUG, game_version: GAME_VERSION });
  }, []);

  function choose(choiceId: string) {
    if (!scenario || state.complete) return;
    const choice = scenario.choices.find((candidate) => candidate.id === choiceId);
    if (!choice) return;
    const availability = gridChoiceAvailability(state, choice);
    if (!availability.available) {
      const reason = availability.reason ?? "That dispatch response is unavailable with the remaining system resources.";
      setNotice(reason);
      captureGameEvent("game_action", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        action: "unavailable_choice",
        step: scenario.id,
        choice: choice.id,
        reason,
      });
      return;
    }

    if (state.history.length === 0) {
      startedAt.current = nowMs();
      captureGameEvent("game_started", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        pack: GAME_SLUG,
        version: GAME_VERSION,
        trigger: "first_decision",
      });
    }

    const next = playGridChoice(state, choiceId);
    const entry = next.history.at(-1);
    setState(next);
    setNotice(null);

    if (entry) {
      captureGameEvent("level_completed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        step: entry.scenarioId,
        choice: entry.choiceId,
        reliability: next.metrics.reliability,
        reserve: next.metrics.reserve,
        storage: next.metrics.storage,
        cost: next.metrics.cost,
        emissions: next.metrics.emissions,
        operating_penalty: next.operatingPenalty,
      });
    }

    if (next.complete) {
      const nextResult = powerGridResult(next);
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
        reliability: next.metrics.reliability,
        reserve: next.metrics.reserve,
        storage: next.metrics.storage,
        cost: next.metrics.cost,
        emissions: next.metrics.emissions,
        operating_penalty: next.operatingPenalty,
      });
    }
  }

  function reset() {
    captureGameEvent("game_restarted", {
      game_slug: GAME_SLUG,
      game_version: GAME_VERSION,
      previous_score: result?.score ?? null,
    });
    startedAt.current = 0;
    setState(createPowerGridState());
    setNotice(null);
  }

  const context = scenario?.id === "heatwave"
    ? signals.heatwaveStorageReady
      ? "Stored flexibility remains available for a mixed storage + demand-response heatwave response."
      : "Earlier battery dispatch depleted the flexibility needed for the mixed heatwave response."
    : scenario?.id === "wind-drop"
      ? signals.windStorageReady
        ? "Storage can cover the wind shortfall, but using it now may remove the later heatwave option."
        : "Earlier dispatch already left too little storage to cover the wind forecast miss."
      : scenario?.id === "transmission-outage"
        ? "A transmission constraint is local: cheap generation elsewhere cannot help unless the network can physically deliver it."
        : "Reserve protects the next contingency; storage is finite optionality that can be spent only once.";

  return (
    <section
      className={styles.shell}
      aria-label="Power Grid Dispatcher simulation"
      data-grid-step={state.scenarioIndex}
      data-grid-complete={state.complete ? "true" : "false"}
    >
      <div className={styles.topline}>
        <div>
          <p className={styles.kicker}>Grid control room</p>
          <p className={styles.mandate}>Keep the system reliable through four stress events without treating storage, reserve, cost, or emissions as unlimited resources.</p>
        </div>
        <div className={styles.progress}>
          <span>{state.complete ? "Complete" : "Dispatch"}</span>
          <strong>{state.complete ? "4/4" : `${state.scenarioIndex + 1}/4`}</strong>
        </div>
      </div>

      <div className={styles.metrics} aria-label="Power-grid metrics">
        {metricOrder.map((metric) => (
          <div key={metric}>
            <span>{metricLabels[metric]}</span>
            <strong>{Math.round(state.metrics[metric])}</strong>
            <small>{metric === "cost" || metric === "emissions" ? "lower is better" : metric === "storage" ? "finite flexibility" : "higher is better"}</small>
          </div>
        ))}
      </div>

      <div className={styles.gridPanel}>
        <div className={styles.reserveBar} aria-label={`Reserve margin ${Math.round(state.metrics.reserve)}`}>
          <span style={{ width: `${Math.max(0, Math.min(100, state.metrics.reserve))}%` }} />
        </div>

        <div className={styles.network} aria-label="Power system">
          {[
            ["Generation", scenario?.id === "wind-drop" || scenario?.id === "morning-ramp"],
            ["Transmission", scenario?.id === "transmission-outage"],
            ["Load", scenario?.id === "heatwave" || scenario?.id === "morning-ramp"],
          ].map(([label, active], index) => (
            <span className={styles.networkGroup} key={String(label)}>
              <span className={styles.node} data-active={active ? "true" : "false"}>{label}</span>
              {index < 2 ? <span className={styles.connector} aria-hidden="true" /> : null}
            </span>
          ))}
        </div>

        <div className={styles.signals} aria-label="Grid operating signals">
          <div data-grid-signal="reliability" data-state={signalState(signals.reliabilityState)}>
            <span>Reliability</span>
            <strong>{signals.reliabilityState.toUpperCase()}</strong>
            <small>Ability to serve load through disturbance</small>
          </div>
          <div data-grid-signal="reserve" data-state={signalState(signals.reserveState)}>
            <span>Reserve margin</span>
            <strong>{signals.reserveState.toUpperCase()}</strong>
            <small>Buffer for the next contingency</small>
          </div>
          <div data-grid-signal="storage" data-state={signalState(signals.storageState)}>
            <span>Storage flexibility</span>
            <strong>{signals.storageState.toUpperCase()}</strong>
            <small>Wind {signals.windStorageReady ? "✓" : "×"} · Heatwave {signals.heatwaveStorageReady ? "✓" : "×"}</small>
          </div>
        </div>

        <p className={styles.context} data-grid-context>{context}</p>
      </div>

      {lastEntry && lastChanges.length ? (
        <div className={styles.impactPanel} aria-live="polite">
          <div>
            <p className={styles.kicker}>What your last dispatch changed</p>
            <strong>{lastEntry.feedback}</strong>
          </div>
          <div className={styles.deltaGrid}>
            {lastChanges.map((change) => (
              <div key={change.metric} data-impact={change.improvement > 0 ? "positive" : change.improvement < 0 ? "pressure" : "neutral"}>
                <span>{metricLabels[change.metric]}</span>
                <strong>{signed(change.delta)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!state.complete && scenario ? (
        <div className={styles.decisionPanel}>
          <div className={styles.prompt}>
            <p className={styles.kicker}>{scenario.title}</p>
            <h2>{scenario.prompt}</h2>
          </div>
          <div className={styles.choiceGrid}>
            {scenario.choices.map((choice) => {
              const availability = gridChoiceAvailability(state, choice);
              return (
                <button
                  type="button"
                  key={choice.id}
                  className={styles.choice}
                  onClick={() => choose(choice.id)}
                  aria-disabled={!availability.available}
                >
                  <strong>{choice.label}</strong>
                  <span>{choice.detail}</span>
                  {!availability.available ? <small>{availability.reason}</small> : null}
                </button>
              );
            })}
          </div>
          <p className={styles.notice} data-kind={notice ? "warning" : "normal"} aria-live="polite">
            {notice ?? "Choose the dispatch response you would make with the flexibility still available."}
          </p>
        </div>
      ) : null}

      {result ? (
        <div className={styles.result} aria-label="Power Grid Dispatcher result">
          <div className={styles.resultScore}>
            <span>Final score</span>
            <strong>{result.score}</strong>
            <small suppressHydrationWarning>Best {bestScore ?? result.score}</small>
          </div>
          <div className={styles.resultBody}>
            <p className={styles.kicker}>Dispatch style</p>
            <h2>{result.style.replaceAll("-", " ")}</h2>
            <p>
              {result.style === "reliability-first"
                ? "You protected service aggressively, accepting high system cost to preserve a wide operating buffer."
                : result.style === "low-carbon"
                  ? "You held reliability while leaning on demand flexibility and cleaner resources instead of high-emissions emergency generation."
                  : result.style === "cost-minimizer"
                    ? "You controlled near-term cost, but the reserve margin shows how quickly a cheap dispatch can become fragile."
                    : "You balanced reliability, reserve, finite storage, cost, and emissions rather than maximizing a single system metric."}
            </p>
            <div className={styles.resultInsights}>
              {result.strongestImprovement ? <span><strong>{metricLabels[result.strongestImprovement.metric]}</strong> {signed(result.strongestImprovement.delta)} from start</span> : null}
              {result.biggestPressure ? <span><strong>{metricLabels[result.biggestPressure.metric]}</strong> {signed(result.biggestPressure.delta)} from start</span> : null}
              <span><strong>Reliability penalty</strong> -{state.operatingPenalty}</span>
            </div>
          </div>
          <button type="button" className={styles.reset} onClick={reset}>Run another grid</button>
        </div>
      ) : null}

      <p className={styles.disclaimer}>Educational simulation only. The grid metrics are synthetic and simplified to illustrate reliability, reserve, storage, congestion, cost, and emissions tradeoffs.</p>
    </section>
  );
}
