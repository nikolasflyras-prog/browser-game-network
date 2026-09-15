"use client";

import { useEffect, useRef, useState } from "react";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import {
  createSupplyChainState,
  currentSupplyScenario,
  playSupplyChoice,
  supplyChainCapabilities,
  supplyChainResult,
  supplyChoiceAvailability,
  supplyMetricChanges,
  type SupplyMetric,
} from "@/games/supply-chain-shock/model";
import { captureGameEvent } from "@/lib/analytics/client";
import styles from "./SupplyChainShock.module.css";

const GAME_SLUG = "supply-chain-shock";
const GAME_VERSION = "0.1.0";
const SAVE_VERSION = 1;

const metricLabels: Record<SupplyMetric, string> = {
  cash: "Cash",
  service: "Service",
  inventory: "Inventory",
  resilience: "Resilience",
  backlog: "Backlog",
};

const metricOrder: readonly SupplyMetric[] = ["service", "resilience", "cash", "inventory", "backlog"];

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

export function SupplyChainShock() {
  const [state, setState] = useState(() => createSupplyChainState());
  const [notice, setNotice] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(() => readBestScore());
  const startedAt = useRef(0);
  const scenario = currentSupplyScenario(state);
  const result = supplyChainResult(state);
  const capabilities = supplyChainCapabilities(state.metrics);
  const lastEntry = state.history.at(-1) ?? null;
  const lastChanges = supplyMetricChanges(lastEntry);

  useEffect(() => {
    captureGameEvent("game_viewed", { game_slug: GAME_SLUG, game_version: GAME_VERSION });
  }, []);

  function choose(choiceId: string) {
    if (!scenario || state.complete) return;
    const choice = scenario.choices.find((candidate) => candidate.id === choiceId);
    if (!choice) return;
    const availability = supplyChoiceAvailability(state, choice);
    if (!availability.available) {
      const reason = availability.reason ?? "That response is unavailable from the current operating state.";
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

    const next = playSupplyChoice(state, choiceId);
    const entry = next.history.at(-1);
    setState(next);
    setNotice(null);

    if (entry) {
      captureGameEvent("level_completed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        step: entry.scenarioId,
        choice: entry.choiceId,
        cash: next.metrics.cash,
        service: next.metrics.service,
        inventory: next.metrics.inventory,
        resilience: next.metrics.resilience,
        backlog: next.metrics.backlog,
      });
    }

    if (next.complete) {
      const nextResult = supplyChainResult(next);
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
        cash: next.metrics.cash,
        service: next.metrics.service,
        inventory: next.metrics.inventory,
        resilience: next.metrics.resilience,
        backlog: next.metrics.backlog,
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
    setState(createSupplyChainState());
    setNotice(null);
  }

  const sceneContext = scenario?.id === "supplier-failure"
    ? capabilities.alternateCapacityReady
      ? "Qualified alternate capacity is ready because earlier resilience investment crossed the activation threshold."
      : "No qualified backup is available. Earlier preparation never created enough resilience to activate another supplier."
    : scenario?.id === "port-delay"
      ? capabilities.safetyStockReady
        ? "Safety stock is available to absorb part of the delay before it reaches customers."
        : "No meaningful safety-stock buffer remains, so the logistics delay will pass more directly into service and backlog."
      : "Preparedness is an operating asset: cash spent before a disruption can change which responses exist later.";

  return (
    <section
      className={styles.shell}
      aria-label="Supply Chain Shock simulation"
      data-supply-step={state.scenarioIndex}
      data-supply-complete={state.complete ? "true" : "false"}
    >
      <div className={styles.topline}>
        <div>
          <p className={styles.kicker}>Operations desk</p>
          <p className={styles.mandate}>Protect customer service through four disruptions without exhausting cash or building resilience too late.</p>
        </div>
        <div className={styles.progress}>
          <span>{state.complete ? "Complete" : "Decision"}</span>
          <strong>{state.complete ? "4/4" : `${state.scenarioIndex + 1}/4`}</strong>
        </div>
      </div>

      <div className={styles.metrics} aria-label="Supply-chain metrics">
        {metricOrder.map((metric) => (
          <div key={metric}>
            <span>{metricLabels[metric]}</span>
            <strong>{Math.round(state.metrics[metric])}</strong>
            <small>{metric === "backlog" ? "lower is better" : metric === "inventory" ? "buffer, not a score target" : "higher is better"}</small>
          </div>
        ))}
      </div>

      <div className={styles.networkPanel}>
        <div className={styles.network} aria-label="Supply network">
          {[
            ["Supplier", scenario?.id === "supplier-warning" || scenario?.id === "supplier-failure"],
            ["Plant", scenario?.id === "demand-spike"],
            ["Distribution", scenario?.id === "port-delay"],
            ["Customers", scenario?.id === "demand-spike"],
          ].map(([label, active], index) => (
            <span key={String(label)} className={styles.networkGroup}>
              <span className={styles.node} data-active={active ? "true" : "false"}>{label}</span>
              {index < 3 ? <span className={styles.connector} aria-hidden="true" /> : null}
            </span>
          ))}
        </div>

        <div className={styles.capabilities} aria-label="Preparedness capabilities">
          <div data-status={capabilities.alternateCapacityReady ? "ready" : "pending"} data-supply-capability="alternate-capacity">
            <span>Alternate capacity</span>
            <strong>{capabilities.alternateCapacityReady ? "READY" : "NOT READY"}</strong>
            <small>Resilience 50+ unlocks backup supply.</small>
          </div>
          <div data-status={capabilities.safetyStockReady ? "ready" : "pending"} data-supply-capability="safety-stock">
            <span>Safety stock</span>
            <strong>{capabilities.safetyStockReady ? "READY" : "NOT READY"}</strong>
            <small>Inventory 60+ can absorb logistics disruption.</small>
          </div>
        </div>

        <p className={styles.context} data-supply-context>{sceneContext}</p>
      </div>

      {lastEntry && lastChanges.length ? (
        <div className={styles.impactPanel} aria-live="polite">
          <div>
            <p className={styles.kicker}>What your last decision changed</p>
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
              const availability = supplyChoiceAvailability(state, choice);
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
            {notice ?? "Choose the operating response you would make with the resources currently available."}
          </p>
        </div>
      ) : null}

      {result ? (
        <div className={styles.result} aria-label="Supply Chain Shock result">
          <div className={styles.resultScore}>
            <span>Final score</span>
            <strong>{result.score}</strong>
            <small suppressHydrationWarning>Best {bestScore ?? result.score}</small>
          </div>
          <div className={styles.resultBody}>
            <p className={styles.kicker}>Operating style</p>
            <h2>{result.style.replaceAll("-", " ")}</h2>
            <p>
              {result.style === "resilient"
                ? "You paid for optionality before the disruption and converted that preparation into service protection when the supplier failed."
                : result.style === "over-buffered"
                  ? "You protected the network with inventory, but too much working capital stayed trapped in stock rather than flexible response capacity."
                  : result.style === "lean"
                    ? "You preserved cash, but the network stayed exposed to disruptions that required capabilities you had not built in advance."
                    : "You managed each shock as it arrived, but the network never built enough durable preparedness to make later decisions easier."}
            </p>
            <div className={styles.resultInsights}>
              {result.strongestImprovement ? <span><strong>{metricLabels[result.strongestImprovement.metric]}</strong> {signed(result.strongestImprovement.delta)} from start</span> : null}
              {result.biggestPressure ? <span><strong>{metricLabels[result.biggestPressure.metric]}</strong> {signed(result.biggestPressure.delta)} from start</span> : null}
            </div>
          </div>
          <button type="button" className={styles.reset} onClick={reset}>Run another network</button>
        </div>
      ) : null}

      <p className={styles.disclaimer}>Educational simulation only. The scenarios simplify real supply-chain planning so the tradeoffs between cash, inventory, service, backlog, and resilience are easier to see.</p>
    </section>
  );
}
