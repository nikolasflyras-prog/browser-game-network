"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { readLocalGameValue, writeLocalGameValue } from "@/games/_shared/storage/localGameStorage";
import {
  createMarketMakerState,
  inventoryRiskLabel,
  marketMakerPostures,
  marketMakerResult,
  playMarketRound,
  quoteFor,
  type QuotePosture,
} from "@/games/market-maker/model";
import { captureGameEvent } from "@/lib/analytics/client";
import styles from "./MarketMaker.module.css";

const GAME_SLUG = "market-maker";
const GAME_VERSION = "0.2.0";
const SAVE_VERSION = 1;
const ROUND_MS = 1050;

const postureCopy: Record<QuotePosture, { label: string; note: string; hotkey: string }> = {
  tight: { label: "Tight", note: "More flow, more exposure", hotkey: "1" },
  balanced: { label: "Balanced", note: "Middle-of-book quote", hotkey: "2" },
  wide: { label: "Wide", note: "Less flow, more protection", hotkey: "3" },
  "lean-long": { label: "Lean long", note: "Favor buying inventory", hotkey: "4" },
  "lean-short": { label: "Lean short", note: "Favor selling inventory", hotkey: "5" },
};

function money(value: number) {
  return value.toFixed(2);
}

function nowMs() {
  return Date.now();
}

function readBestScore() {
  return readLocalGameValue<number>(GAME_SLUG, "best-score", SAVE_VERSION);
}

export function MarketMaker() {
  const [state, setState] = useState(() => createMarketMakerState());
  const [selectedPosture, setSelectedPosture] = useState<QuotePosture>("balanced");
  const [bestScore, setBestScore] = useState<number | null>(() => readBestScore());
  const [running, setRunning] = useState(false);
  const startedAt = useRef(0);
  const stateRef = useRef(state);
  const selectedPostureRef = useRef<QuotePosture>(selectedPosture);
  const result = marketMakerResult(state);
  const selectedQuote = quoteFor(state, selectedPosture);
  const lastRound = state.history.at(-1) ?? null;
  const inventoryY = `${50 - Math.max(-8, Math.min(8, state.inventory)) * 5}%`;
  const inventoryStyle = { "--inventory-y": inventoryY } as CSSProperties;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    selectedPostureRef.current = selectedPosture;
  }, [selectedPosture]);

  useEffect(() => {
    captureGameEvent("game_viewed", { game_slug: GAME_SLUG, game_version: GAME_VERSION });
  }, []);

  const choosePosture = useCallback((posture: QuotePosture, trigger: "button" | "hotkey" = "button") => {
    selectedPostureRef.current = posture;
    setSelectedPosture(posture);

    const current = stateRef.current;
    if (current.round > 0 && !current.complete) {
      captureGameEvent("game_action", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        action: "quote_posture_changed",
        posture,
        round: current.round,
        trigger,
      });
    }
  }, []);

  const settleRound = useCallback(() => {
    const current = stateRef.current;
    if (current.complete) return;

    const posture = selectedPostureRef.current;
    const next = playMarketRound(current, posture);
    const round = next.history.at(-1);

    stateRef.current = next;
    setState(next);

    if (round) {
      captureGameEvent("level_completed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        round: round.round,
        posture: round.posture,
        bid: round.bid,
        ask: round.ask,
        inventory_before: round.inventoryBefore,
        inventory_after: round.inventoryAfter,
        round_score: round.scoreAfter,
      });
    }

    if (next.complete) {
      setRunning(false);
      const nextResult = marketMakerResult(next);

      setBestScore((currentBest) => {
        const nextBest = Math.max(currentBest ?? Number.NEGATIVE_INFINITY, next.score);
        writeLocalGameValue(GAME_SLUG, "best-score", SAVE_VERSION, nextBest);
        return nextBest;
      });

      captureGameEvent("game_completed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        score: next.score,
        ending_inventory: next.inventory,
        raw_pnl: next.cash + next.inventory * next.fairValue,
        total_fills: nextResult?.totalFills ?? 0,
        duration_ms: Math.max(0, nowMs() - startedAt.current),
      });
    }
  }, []);

  useEffect(() => {
    if (!running || state.complete) return;

    const timer = window.setInterval(settleRound, ROUND_MS);
    return () => window.clearInterval(timer);
  }, [running, state.complete, settleRound]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;

      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT") {
        return;
      }

      const index = Number(event.key) - 1;
      const posture = marketMakerPostures[index];
      if (posture) {
        event.preventDefault();
        choosePosture(posture, "hotkey");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choosePosture]);

  function startMarket() {
    const current = stateRef.current;
    if (current.complete || running) return;

    if (current.round === 0 && startedAt.current === 0) {
      startedAt.current = nowMs();
      captureGameEvent("game_started", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        seed: current.seed,
        rounds: current.maxRounds,
        cadence_ms: ROUND_MS,
        trigger: "open_live_market",
      });
    } else if (current.round > 0) {
      captureGameEvent("game_resumed", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        round: current.round,
      });
    }

    setRunning(true);
  }

  function pauseMarket() {
    if (!running || state.complete) return;
    setRunning(false);
    captureGameEvent("game_paused", {
      game_slug: GAME_SLUG,
      game_version: GAME_VERSION,
      round: state.round,
      posture: selectedPosture,
    });
  }

  function reset() {
    captureGameEvent("game_restarted", {
      game_slug: GAME_SLUG,
      game_version: GAME_VERSION,
      previous_score: result?.score ?? null,
    });

    const nextSeed = (state.seed ^ 0x9e3779b9) >>> 0;
    const next = createMarketMakerState(nextSeed);
    stateRef.current = next;
    selectedPostureRef.current = "balanced";
    startedAt.current = 0;
    setRunning(false);
    setState(next);
    setSelectedPosture("balanced");
  }

  const resultExplanation = result
    ? result.totalRiskPenalty > 0
      ? `Inventory concentration cost ${money(result.totalRiskPenalty)} score points. Once the position grew, quote skew should have been used more aggressively to attract offsetting flow.`
      : result.noFlowRounds >= Math.ceil(state.maxRounds / 3)
        ? `You controlled inventory, but ${result.noFlowRounds} rounds produced no customer flow. Protection became expensive because a market maker also needs trades to earn the spread.`
        : `You attracted ${result.totalFills} customer fills while keeping peak inventory at ${result.peakInventory}. That is the core market-making tradeoff: earn spread without letting position risk dominate.`
    : null;

  const fairMove = lastRound ? lastRound.fairAfter - lastRound.fairBefore : 0;
  const marketStatus = state.complete ? "Closed" : running ? "Live" : state.round === 0 ? "Ready" : "Paused";

  return (
    <section
      className={styles.shell}
      aria-label="Market Maker simulation"
      data-market-round={state.round}
      data-market-complete={state.complete ? "true" : "false"}
      data-market-last-round={lastRound?.round ?? 0}
      data-market-running={running ? "true" : "false"}
      data-market-posture={selectedPosture}
    >
      <div className={styles.topline}>
        <div>
          <p className={styles.kicker}>Live dealer desk</p>
          <p className={styles.mandate}>Steer your two-sided quote while customer flow and fair value keep moving. Survive 16 market ticks without letting inventory risk erase your spread capture.</p>
        </div>
        <div className={styles.roundBox}>
          <span>Tick</span>
          <strong>{state.round}/{state.maxRounds}</strong>
        </div>
      </div>

      <div className={styles.liveStrip} data-running={running ? "true" : "false"}>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot} aria-hidden="true" />
          <strong>{marketStatus}</strong>
        </div>
        <div className={styles.clockTrack} aria-label={running ? "Live market clock running" : "Live market clock stopped"}>
          <span className={styles.clockFill} />
        </div>
        <div className={styles.clockCopy}>
          <span>Flow cadence</span>
          <strong>{(ROUND_MS / 1000).toFixed(2)}s</strong>
        </div>
      </div>

      <div className={styles.metrics} aria-label="Dealer metrics">
        <div><span>Fair value</span><strong>${money(state.fairValue)}</strong><small>Current reference price</small></div>
        <div><span>Inventory</span><strong>{state.inventory > 0 ? `+${state.inventory}` : state.inventory}</strong><small>{inventoryRiskLabel(state.inventory)} risk</small></div>
        <div><span>Dealer score</span><strong>{money(state.score)}</strong><small>Marked P&amp;L less risk penalty</small></div>
        <div><span>Best</span><strong suppressHydrationWarning>{bestScore === null ? "—" : money(bestScore)}</strong><small>Saved in this browser</small></div>
      </div>

      <div className={styles.marketPanel}>
        <div className={styles.inventoryPanel}>
          <div className={styles.panelHeading}>
            <span>Position</span>
            <strong>{state.inventory === 0 ? "Flat" : state.inventory > 0 ? "Long" : "Short"}</strong>
          </div>
          <div className={styles.inventoryMeter} style={inventoryStyle} aria-label={`Inventory ${state.inventory}`}>
            <span className={styles.inventoryTop}>Short</span>
            <span className={styles.inventoryZero} />
            <span className={styles.inventoryDot} />
            <span className={styles.inventoryBottom}>Long</span>
          </div>
        </div>

        <div className={styles.quotePanel}>
          <div className={styles.panelHeading}>
            <span>Live quote</span>
            <strong>{postureCopy[selectedPosture].label}</strong>
          </div>
          <div className={styles.quoteLadder} aria-label={`${postureCopy[selectedPosture].label} quote`}>
            <div><span>Ask</span><strong>${money(selectedQuote.ask)}</strong></div>
            <div className={styles.fair}><span>Fair</span><strong>${money(state.fairValue)}</strong></div>
            <div><span>Bid</span><strong>${money(selectedQuote.bid)}</strong></div>
          </div>
          <p className={styles.spreadReadout}>Quoted spread: ${(selectedQuote.ask - selectedQuote.bid).toFixed(2)} · updates immediately when you change posture</p>
        </div>

        <div className={styles.tapePanel} aria-live="polite">
          <div className={styles.panelHeading}>
            <span>Tape</span>
            <strong>{lastRound ? `Tick #${lastRound.round}` : "Waiting"}</strong>
          </div>
          {lastRound ? (
            <>
              <div className={styles.tapeGrid}>
                <div><span>Customer bought</span><strong>{lastRound.buyFill ? "Filled" : "No fill"}</strong></div>
                <div><span>Customer sold</span><strong>{lastRound.sellFill ? "Filled" : "No fill"}</strong></div>
                <div><span>Fair move</span><strong>{fairMove >= 0 ? "+" : ""}{money(fairMove)}</strong></div>
                <div><span>Inventory after</span><strong>{lastRound.inventoryAfter}</strong></div>
              </div>
              <p>{lastRound.feedback}</p>
            </>
          ) : (
            <p>Open the desk, then keep changing your quote as the tape moves. Customer flow resolves automatically every market tick.</p>
          )}
        </div>
      </div>

      {!state.complete ? (
        <div className={styles.decisionPanel}>
          <div className={styles.decisionHeading}>
            <div>
              <p className={styles.kicker}>Continuous control</p>
              <h2>Steer the quote while the market is live</h2>
            </div>
            <p>Use 1–5 to switch postures instantly. Tight earns more chances to trade; wide protects you; quote skew helps unwind inventory.</p>
          </div>

          <div className={styles.postureGrid}>
            {marketMakerPostures.map((posture) => (
              <button
                className={styles.postureButton}
                type="button"
                key={posture}
                onClick={() => choosePosture(posture)}
                aria-pressed={selectedPosture === posture}
              >
                <span className={styles.postureTopline}>
                  <span>{postureCopy[posture].label}</span>
                  <kbd>{postureCopy[posture].hotkey}</kbd>
                </span>
                <strong>${money(quoteFor(state, posture).bid)} / ${money(quoteFor(state, posture).ask)}</strong>
                <small>{postureCopy[posture].note}</small>
              </button>
            ))}
          </div>

          <div className={styles.liveControls}>
            {!running ? (
              <button className={styles.makeMarket} type="button" onClick={startMarket}>
                {state.round === 0 ? "Open live market" : "Resume live market"}
              </button>
            ) : (
              <button className={styles.pauseButton} type="button" onClick={pauseMarket}>
                Pause flow
              </button>
            )}
            <p>{running ? "Quotes stay editable while the tape advances automatically." : "The market clock is stopped. Set your posture, then resume when ready."}</p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={styles.result} aria-label="Market Maker result">
          <div className={styles.resultScore}><span>Final score</span><strong>{money(result.score)}</strong></div>
          <div className={styles.resultBody}>
            <p className={styles.kicker}>Dealer style</p>
            <h2>{result.style.replaceAll("-", " ")}</h2>
            <p>{resultExplanation}</p>
            <div className={styles.resultStats}>
              <span><strong>{result.totalFills}</strong> customer fills</span>
              <span><strong>{result.peakInventory}</strong> peak inventory</span>
              <span><strong>{money(result.totalRiskPenalty)}</strong> risk penalty</span>
            </div>
          </div>
          <button className={styles.resetButton} type="button" onClick={reset}>Deal another market</button>
        </div>
      ) : null}

      <p className={styles.disclaimer}>Educational simulation only. Prices and order flow are synthetic and designed to illustrate market-making mechanics, not reproduce a real security or trading venue.</p>
    </section>
  );
}
