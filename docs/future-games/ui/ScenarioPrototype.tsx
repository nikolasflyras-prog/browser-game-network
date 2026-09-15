"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  chooseScenarioSession,
  createScenarioSession,
  resetScenarioSession,
  scenarioSessionView,
  type ScenarioGameDefinition,
  type ScenarioSessionView,
} from "../scenario-session";
import styles from "./PrototypeLab.module.css";

type Props<K extends string, Style extends string> = {
  definition: ScenarioGameDefinition<K, Style>;
  metricOrder: readonly K[];
  metricLabels: Record<K, string>;
  metricFormatters?: Partial<Record<K, (value: number) => string>>;
  accent: string;
  renderScene: (view: ScenarioSessionView<K>) => ReactNode;
};

export function ScenarioPrototype<K extends string, Style extends string>({
  definition,
  metricOrder,
  metricLabels,
  metricFormatters = {},
  accent,
  renderScene,
}: Props<K, Style>) {
  const [session, setSession] = useState(() => createScenarioSession(definition));
  const [notice, setNotice] = useState<string | null>(null);
  const view = scenarioSessionView(definition, session);

  function choose(choiceId: string) {
    const choice = view.choices.find((candidate) => candidate.id === choiceId);
    if (!choice?.available) {
      setNotice(choice?.unavailableFeedback ?? "That response is not available from the current state.");
      return;
    }

    setSession((current) => chooseScenarioSession(definition, current, choiceId));
    setNotice(null);
  }

  function reset() {
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
        </div>
      ) : null}
    </section>
  );
}
