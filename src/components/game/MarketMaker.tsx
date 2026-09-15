"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
const GAME_VERSION = "0.1.0";
const SAVE_VERSION = 1;

const postureCopy: Record<QuotePosture, { label: string; note: string }> = {
  tight: { label: "Tight", note: "More flow, more exposure" },
  balanced: { label: "Balanced", note: "Middle-of-book quote" },
  wide: { label: "Wide", note: "Less flow, more protection" },
  "lean-long": { label: "Lean long", note: "Favor buying inventory" },
  "lean-short": { label: "Lean short", note: "Favor selling inventory" },
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
  const startedAt = useRef(0);
  const result = marketMakerResult(state);
  const selectedQuote = quoteFor(state, selectedPosture);
  const lastRound = state.history.at(-1) ?? null;
  const inventoryY = `${50 - Math.max(-8, Math.min(8, state.inventory)) * 5}%`;
  const inventoryStyle = { "--inventory-y": inventoryY } as CSSProperties;

  useEffect(() => {
    captureGameEvent("game_viewed", { game_slug: GAME_SLUG, game_version: GAME_VERSION });
  }, []);

  function executeQuote() {
    if (state.complete) return;

    if (state.round === 0) {
      startedAt.current = nowMs();
      captureGameEvent("game_started", {
        game_slug: GAME_SLUG,
        game_version: GAME_VERSION,
        seed: state.seed,
        rounds: state.maxRounds,
        trigger: "first_quote",
      });
    }

    const next = playMarketRound(state, selectedPosture);
    const round = next.history.at(-1);
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
      const nextResult = marketMakerResult(next);
      const nextBest = Math.max(bestScore ?? Number.NEGATIVE_INFINITY, next.score);
      writeLocalGameValue(GAME_SLUG, "best-score", SAVE_VERSION, nextBest);
      setBestScore(nextBest);
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
  }

  function reset() {
    captureGameEvent("game_restarted", {
      game_slug: GAME_SLUG,
      game_version: GAME_VERSION,
      previous_score: result?.score ?? null,
    });
    const nextSeed = (state.seed ^ 0x9e3779b9) >>> 0;
    startedAt.current = 0;
    setState(createMarketMakerState(nextSeed));
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

  return (
    <section
      className={styles.shell}
      aria-label="Market Maker simulation"
      data-market-round={state.round}
      data-market-complete={state.complete ? "true" : "false"}
      data-market-last-round={lastRound?.round ?? 0}
    >
      <div className={styles.topline}>
        <div>
          <p className={styles.kicker}>Dealer desk</p>
          <p className={styles.mandate}>Provide liquidity for 16 rounds without letting inventory risk erase your spread capture.</p>
        </div>
        <div className={styles.roundBox}>
          <span>Round</span>
          <strong>{state.round}/{state.maxRounds}</strong>
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
            <span>Selected market</span>
            <strong>{postureCopy[selectedPosture].label}</strong>
          </div>
          <div className={styles.quoteLadder} aria-label={`${postureCopy[selectedPosture].label} quote`}>
            <div><span>Ask</span><strong>${money(selectedQuote.ask)}</strong></div>
            <div className={styles.fair}><span>Fair</span><strong>${money(state.fairValue)}</strong></div>
            <div><span>Bid</span><strong>${money(selectedQuote.bid)}</strong></div>
          </div>
          <p className={styles.spreadReadout}>Quoted spread: ${(selectedQuote.ask - selectedQuote.bid).toFixed(2)}</p>
        </div>

        <div className={styles.tapePanel} aria-live="polite">
          <div className={styles.panelHeading}>
            <span>Last round</span>
            <strong>{lastRound ? `#${lastRound.round}` : "Waiting"}</strong>
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
            <p>Choose a quote posture. The market will decide whether customer buy and sell flow reaches your prices, then fair value moves.</p>
          )}
        </div>
      </div>

      {!state.complete ? (
        <div className={styles.decisionPanel}>
          <div className={styles.decisionHeading}>
            <div>
              <p className={styles.kicker}>Your decision</p>
              <h2>Set the next two-sided quote</h2>
            </div>
            <p>Changing the spread changes flow. Skewing the quote changes which side is more attractive.</p>
          </div>

          <div className={styles.postureGrid}>
            {marketMakerPostures.map((posture) => (
              <button
                className={styles.postureButton}
                type="button"
                key={posture}
                onClick={() => setSelectedPosture(posture)}
                aria-pressed={selectedPosture === posture}
              >
                <span>{postureCopy[posture].label}</span>
                <strong>${money(quoteFor(state, posture).bid)} / ${money(quoteFor(state, posture).ask)}</strong>
                <small>{postureCopy[posture].note}</small>
              </button>
            ))}
          </div>

          <button className={styles.makeMarket} type="button" onClick={executeQuote}>
            Make market at ${money(selectedQuote.bid)} / ${money(selectedQuote.ask)}
          </button>
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
