"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  chooseScenarioSession,
  createScenarioSession,
  resetScenarioSession,
  scenarioSessionView,
  type ScenarioGameDefinition,
  type ScenarioSessionView,
} from "../scenario-session";
import {
  formatMetricDelta,
  summarizeScenarioOutcome,
  type MetricDirection,
} from "../scenario-insights";
import { prototypeMetricProperties, prototypeNowMs, type PrototypeEventSink } from "./prototype-events";
import insightStyles from "./ResultInsights.module.css";
import styles from "./PrototypeLab.module.css";

type Props<K extends string, Style extends string> = {
  definition: ScenarioGameDefinition<K, Style>;
  metricOrder: readonly K[];
  metricLabels: Record<K, string>;
  metricDirections: Record<K, MetricDirection>;
  metricFormatters?: Partial<Record<K, (value: number) => string>>;
  accent: string;
  renderScene: (view: ScenarioSessionView<K>) => ReactNode;
  onEvent?: PrototypeEventSink;
};

export function ScenarioPrototype<K extends string, Style extends string>({
  definition,
  metricOrder,
  metricLabels,
  metricDirections,
  metricFormatters = {},
  accent,
  renderScene,
  onEvent,
}: Props<K, Style>) {
  const [session, setSession] = useState(() => createScenarioSession(definition));
  const [notice, setNotice] = useState<string | null>(null);
  const startedAt = useRef(0);
  const view = scenarioSessionView(definition, session);
  const outcomeSummary = session.result
    ? summarizeScenarioOutcome(definition.initialMetrics, session.state.metrics, metricDirections)
    : null;

  useEffect(() => {
    startedAt.current = prototypeNowMs();
    onEvent?.("game_started", { pack: definition.slug, version: definition.version });
  }, [definition.slug, definition.version, onEvent]);

  function choose(choiceId: string) {
    const step = view.step;
    const choice = view.choices.find((candidate) => candidate.id === choiceId);
    if (!choice?.available) {
      const reason = choice?.unavailableFeedback ?? "That response is not available from the current state.";
      setNotice(reason);
      onEvent?.("game_action", {
        action: "unavailable_choice",
        step: step?.id ?? "complete",
        choice: choiceId,
        reason,
      });
      return;
    }

    const beforeScore = definition.finalScore(session.state);
    const next = chooseScenarioSession(definition, session, choiceId);
    const afterScore = definition.finalScore(next.state);
    const scoreDelta = Math.round((afterScore - beforeScore) * 100) / 100;
    setSession(next);
    setNotice(null);

    onEvent?.("level_completed", {
      step: step?.id ?? String(view.stepNumber),
      choice: choiceId,
      score_delta: scoreDelta,
      ...prototypeMetricProperties(next.state.metrics as Record<string, number>),
    });

    if (next.result) {
      onEvent?.("game_completed", {
        score: next.result.score,
        style: next.result.style,
        duration_ms: Math.max(0, prototypeNowMs() - startedAt.current),
      });
    }
  }

  function reset() {
    onEvent?.("game_restarted", { previous_score: session.result?.score ?? null });
    startedAt.current = prototypeNowMs();
    setSession(resetScenarioSession(definition));
    setNotice(null);
  }

  const style = { "--prototype-accent": accent } as CSSProperties;

  return (
    <section className={styles.shell} style={style} aria-label={`${definition.title} staged prototype`}>
      <header className={styles.topline}>
        <div>
          <p className={styles.eyebrow}>Lab prototype</p>
          <h2 className={styles.title}>{definition.title}</h2>
        </div>
        <div className={styles.progress}>
          <span>{view.complete ? "Complete" : "Decision"}</span>
          <strong>{view.complete ? view.totalSteps : `${view.stepNumber}/${view.totalSteps}`}</strong>
        </div>
      </header>

      <div className={styles.metricRail} aria-label="Current metrics">
        {metricOrder.map((metric) => (
          <div className={styles.metric} key={metric}>
            <span>{metricLabels[metric]}</span>
            <strong>{metricFormatters[metric]?.(view.metrics[metric]) ?? Math.round(view.metrics[metric])}</strong>
          </div>
        ))}
      </div>

      <div className={styles.playfield}>{renderScene(view)}</div>

      {!view.complete && view.step ? (
        <div className={styles.decisionDock}>
          <div className={styles.prompt}>
            <p className={styles.eyebrow}>{view.step.title}</p>
            <h3>{view.step.prompt}</h3>
          </div>
          <div className={styles.choiceGrid}>
            {view.choices.map((choice) => (
              <button
                className={styles.choice}
                type="button"
                key={choice.id}
                onClick={() => choose(choice.id)}
                aria-disabled={!choice.available}
              >
                <strong>{choice.label}</strong>
                <span>{choice.detail}</span>
                {!choice.available ? <small>{choice.unavailableFeedback ?? "Unavailable from the current state"}</small> : null}
              </button>
            ))}
          </div>
          <div className={styles.feedback} aria-live="polite">
            <strong>{notice ? "Unavailable: " : view.lastFeedback ? "What changed: " : "Your move: "}</strong>
            {notice ?? view.lastFeedback ?? "Choose the response that best fits the operating state."}
          </div>
        </div>
      ) : null}

      {session.result ? (
        <div className={styles.result}>
          <div className={styles.score}><span>Score</span><strong>{session.result.score}</strong></div>
          <div>
            <p className={styles.eyebrow}>Operating style</p>
            <h3 className={styles.title}>{session.result.style.replaceAll("-", " ")}</h3>
          </div>
          <button className={styles.reset} type="button" onClick={reset}>Run again</button>

          {outcomeSummary && (outcomeSummary.strongestImprovement || outcomeSummary.biggestPressure) ? (
            <div className={insightStyles.resultInsights} aria-label="Why this run ended here">
              {outcomeSummary.strongestImprovement ? (
                <div className={insightStyles.resultInsight} data-kind="positive">
                  <span>Strongest improvement</span>
                  <strong>{metricLabels[outcomeSummary.strongestImprovement.metric]}</strong>
                  <small>{formatMetricDelta(outcomeSummary.strongestImprovement.delta)} from start</small>
                </div>
              ) : null}
              {outcomeSummary.biggestPressure ? (
                <div className={insightStyles.resultInsight} data-kind="pressure">
                  <span>Main tradeoff</span>
                  <strong>{metricLabels[outcomeSummary.biggestPressure.metric]}</strong>
                  <small>{formatMetricDelta(outcomeSummary.biggestPressure.delta)} from start</small>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
