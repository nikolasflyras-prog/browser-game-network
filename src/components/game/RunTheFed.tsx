"use client";

import { useEffect, useMemo, useState } from "react";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import {
  advanceQuarter,
  fedScenarios,
  getFedScenario,
  initialFedState,
  normalizePolicyRate,
  scoreFedRun,
  type MacroSnapshot,
  type ScenarioId,
} from "@/games/run-the-fed/model";
import { captureGameEvent } from "@/lib/analytics/client";

const GAME_SLUG = "run-the-fed";
const GAME_VERSION = "0.1.0";
const SAVE_VERSION = 1;

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function readBestScore(scenarioId: ScenarioId) {
  return readLocalGameValue<number>(GAME_SLUG, `best-${scenarioId}`, SAVE_VERSION);
}

export function RunTheFed() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("soft-landing");
  const scenario = useMemo(() => getFedScenario(scenarioId), [scenarioId]);
  const [current, setCurrent] = useState<MacroSnapshot>(() => initialFedState(getFedScenario("soft-landing")));
  const [selectedRate, setSelectedRate] = useState(current.policyRate);
  const [history, setHistory] = useState<MacroSnapshot[]>([]);
  const [explanation, setExplanation] = useState("Review the dashboard, set the policy rate, then advance one quarter.");
  const [shockTitle, setShockTitle] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(() => readBestScore("soft-landing"));

  const complete = current.quarter >= 8;
  const score = history.length ? scoreFedRun(history) : null;

  useEffect(() => {
    captureGameEvent("game_viewed", { game_slug: GAME_SLUG, game_version: GAME_VERSION });
  }, []);

  function startScenario(nextId: ScenarioId) {
    const nextScenario = getFedScenario(nextId);
    const start = initialFedState(nextScenario);
    setScenarioId(nextId);
    setCurrent(start);
    setSelectedRate(start.policyRate);
    setHistory([]);
    setShockTitle(null);
    setBestScore(readBestScore(nextId));
    setExplanation(nextScenario.brief);
    captureGameEvent("game_started", {
      game_slug: GAME_SLUG,
      game_version: GAME_VERSION,
      mode: nextId,
      trigger: "scenario_selected",
    });
  }

  function adjustRate(change: number) {
    if (complete) return;
    setSelectedRate((rate) => normalizePolicyRate(rate + change));
  }

  function advance() {
    if (complete) return;

    if (history.length === 0) {
      captureGameEvent("game_started", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        mode: scenario.id,
        trigger: "first_decision",
      });
    }

    const result = advanceQuarter(current, selectedRate, scenario);
    const nextHistory = [...history, result.next];
    setCurrent(result.next);
    setSelectedRate(result.next.policyRate);
    setHistory(nextHistory);
    setExplanation(result.explanation);
    setShockTitle(result.shock?.title ?? null);

    captureGameEvent("level_completed", {
      game_slug: GAME_SLUG,
      game_version: GAME_VERSION,
      scenario: scenario.id,
      quarter: result.next.quarter,
      policy_rate: result.next.policyRate,
      inflation: result.next.inflation,
      unemployment: result.next.unemployment,
      growth: result.next.growth,
      shock: result.shock?.title ?? null,
    });

    if (result.next.quarter === 8) {
      const finalScore = scoreFedRun(nextHistory);
      const nextBest = Math.max(bestScore ?? 0, finalScore.score);
      writeLocalGameValue(GAME_SLUG, `best-${scenario.id}`, SAVE_VERSION, nextBest);
      setBestScore(nextBest);
      captureGameEvent("game_completed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        mode: scenario.id,
        score: finalScore.score,
        grade: finalScore.grade,
      });
    }
  }

  function reset() {
    startScenario(scenario.id);
    captureGameEvent("game_restarted", {
      game_slug: GAME_SLUG,
      game_version: GAME_VERSION,
      mode: scenario.id,
    });
  }

  const metrics = [
    ["Inflation", formatPercent(current.inflation), "Target ≈ 2%"],
    ["Unemployment", formatPercent(current.unemployment), "Labor-market slack"],
    ["Real growth", formatPercent(current.growth), "Annualized teaching index"],
    ["Financial stability", `${Math.round(current.financialStability)}/100`, "Higher is safer"],
  ] as const;

  const secondary = [
    ["Consumer spending", current.consumerSpending.toFixed(1)],
    ["Business investment", current.businessInvestment.toFixed(1)],
    ["Asset prices", current.assetPrices.toFixed(1)],
    ["Neutral rate", formatPercent(scenario.neutralRate)],
  ] as const;

  return (
    <section className="fed-shell" aria-label="Run the Fed simulation">
      <div className="fed-topline">
        <label className="fed-scenario-control">
          <span>Scenario</span>
          <select value={scenarioId} onChange={(event) => startScenario(event.target.value as ScenarioId)}>
            {fedScenarios.map((option) => (
              <option value={option.id} key={option.id}>{option.name}</option>
            ))}
          </select>
        </label>
        <div className="fed-quarter">
          <span>Quarter</span>
          <strong>{current.quarter}/8</strong>
        </div>
        <div className="fed-best">
          <span>Best</span>
          <strong suppressHydrationWarning>{bestScore ?? "—"}</strong>
        </div>
      </div>

      <div className="fed-brief">
        <p className="eyebrow">Mandate</p>
        <h2>{scenario.name}</h2>
        <p>{scenario.brief}</p>
      </div>

      <div className="fed-metrics" aria-label="Current economic indicators">
        {metrics.map(([label, value, note]) => (
          <div className="fed-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>

      <div className="fed-secondary">
        {secondary.map(([label, value]) => (
          <div key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>

      <div className="fed-policy-panel">
        <div>
          <p className="eyebrow">Your decision</p>
          <h2>Set the policy rate</h2>
          <p>Move in 25 bp increments. The economy responds with lags, and large jumps can strain financial stability.</p>
        </div>
        <div className="fed-rate-control" aria-label="Policy rate control">
          <button type="button" onClick={() => adjustRate(-0.25)} disabled={complete || selectedRate <= 0} aria-label="Lower policy rate by 0.25 percentage points">−</button>
          <div><strong>{selectedRate.toFixed(2)}%</strong><span>policy rate</span></div>
          <button type="button" onClick={() => adjustRate(0.25)} disabled={complete || selectedRate >= 10} aria-label="Raise policy rate by 0.25 percentage points">+</button>
        </div>
        <button className="button primary fed-advance" type="button" onClick={advance} disabled={complete}>
          {complete ? "Simulation complete" : "Advance quarter"}
        </button>
      </div>

      <div className={`fed-explanation${shockTitle ? " shock" : ""}`} aria-live="polite">
        <span>{shockTitle ? "New shock" : "What changed"}</span>
        {shockTitle ? <strong>{shockTitle}</strong> : null}
        <p>{explanation}</p>
      </div>

      {complete && score ? (
        <div className="fed-result">
          <div className="fed-grade"><span>Grade</span><strong>{score.grade}</strong></div>
          <div>
            <p className="eyebrow">Eight-quarter result</p>
            <h2>{score.score}/100</h2>
            <p>{score.diagnosis}</p>
          </div>
          <button className="button" type="button" onClick={reset}>Run scenario again</button>
        </div>
      ) : null}

      {history.length ? (
        <div className="fed-history-wrap">
          <h2>Quarter history</h2>
          <div className="fed-history-scroll">
            <table className="fed-history">
              <thead><tr><th>Q</th><th>Rate</th><th>Inflation</th><th>Unemployment</th><th>Growth</th><th>Stability</th></tr></thead>
              <tbody>
                {history.map((state) => (
                  <tr key={state.quarter}>
                    <td>{state.quarter}</td>
                    <td>{state.policyRate.toFixed(2)}%</td>
                    <td>{state.inflation.toFixed(1)}%</td>
                    <td>{state.unemployment.toFixed(1)}%</td>
                    <td>{state.growth.toFixed(1)}%</td>
                    <td>{Math.round(state.financialStability)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <p className="fed-disclaimer">Educational simulation only. It is designed to illustrate monetary-policy tradeoffs, not forecast the economy or judge real Federal Reserve decisions.</p>
    </section>
  );
}
