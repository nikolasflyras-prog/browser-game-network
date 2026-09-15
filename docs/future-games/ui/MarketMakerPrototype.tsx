"use client";

import { useState, type CSSProperties } from "react";
import {
  chooseMarketMakerPosture,
  createMarketMakerPrototype,
  marketMakerPrototypeResult,
  marketMakerPrototypeView,
} from "../market-maker/prototype";
import type { QuotePosture } from "../market-maker/simulation";
import marketStyles from "./MarketMakerPolish.module.css";
import styles from "./PrototypeLab.module.css";

function money(value: number) {
  return value.toFixed(2);
}

export function MarketMakerPrototypePanel() {
  const [session, setSession] = useState(() => createMarketMakerPrototype());
  const [selectedPosture, setSelectedPosture] = useState<QuotePosture>("balanced");
  const view = marketMakerPrototypeView(session);
  const result = marketMakerPrototypeResult(session);
  const inventoryY = `${50 - Math.max(-8, Math.min(8, view.inventory)) * 5}%`;
  const style = { "--inventory-y": inventoryY } as CSSProperties;
  const selectedQuote = view.quotes.find((quote) => quote.posture === selectedPosture) ?? view.quotes[0];

  function executeQuote() {
    if (view.complete) return;
    setSession((current) => chooseMarketMakerPosture(current, selectedPosture));
  }

  function reset() {
    setSession(createMarketMakerPrototype());
    setSelectedPosture("balanced");
  }

  const resultExplanation = result
    ? result.totalRiskPenalty > 0
      ? `Inventory concentration created ${money(result.totalRiskPenalty)} points of cumulative risk penalty. Quote skew would have helped work that position down sooner.`
      : result.noFlowRounds >= Math.ceil(view.maxRounds / 3)
        ? `You protected inventory well, but ${result.noFlowRounds} rounds produced no customer flow. Wider quotes reduced risk at the cost of trading opportunity.`
        : `You kept inventory controlled while still attracting ${result.totalFills} customer fills. The run balanced spread capture with position risk.`
    : null;

  return (
    <section className={`${styles.shell} ${styles.marketShell}`} aria-label="Market Maker staged prototype">
      <header className={styles.topline}>
        <div>
          <p className={styles.eyebrow}>Lab prototype</p>
          <h2 className={styles.title}>Market Maker</h2>
        </div>
        <div className={styles.progress}><span>Round</span><strong>{view.round}/{view.maxRounds}</strong></div>
      </header>

      <div className={styles.metricRail}>
        <div className={styles.metric}><span>Fair value</span><strong>${money(view.fairValue)}</strong></div>
        <div className={styles.metric}><span>Inventory</span><strong>{view.inventory}</strong><small>{view.inventoryRisk} risk</small></div>
        <div className={styles.metric}><span>Dealer score</span><strong>{money(view.score)}</strong></div>
      </div>

      <div className={styles.playfield}>
        <div className={styles.marketStage}>
          <div className={styles.inventoryMeter} aria-label={`Inventory ${view.inventory}`}>
            <span className={styles.inventoryZero} />
            <span className={styles.inventoryDot} style={style} />
          </div>
          <div className={styles.priceLadder} aria-label={`${selectedPosture} quote`}>
            <div className={styles.priceMark}><strong>Ask</strong><span className={styles.priceLine} /><span>${money(selectedQuote.ask)}</span></div>
            <div className={styles.priceMark} data-kind="fair"><strong>Fair</strong><span className={styles.priceLine} /><span>${money(view.fairValue)}</span></div>
            <div className={styles.priceMark}><strong>Bid</strong><span className={styles.priceLine} /><span>${money(selectedQuote.bid)}</span></div>
          </div>
        </div>
      </div>

      {!view.complete ? (
        <div className={styles.decisionDock}>
          <div className={styles.prompt}>
            <p className={styles.eyebrow}>Your quote</p>
            <h3>Select a posture, inspect the exact bid / ask, then make the market.</h3>
          </div>
          <div className={styles.quoteGrid}>
            {view.quotes.map((quote) => (
              <button
                className={`${styles.quoteButton} ${marketStyles.quoteButton}`}
                type="button"
                key={quote.posture}
                onClick={() => setSelectedPosture(quote.posture)}
                aria-pressed={selectedPosture === quote.posture}
              >
                <strong>{quote.posture.replaceAll("-", " ")}</strong>
                <span>${money(quote.bid)} / ${money(quote.ask)}</span>
              </button>
            ))}
          </div>
          <button className={styles.reset} type="button" onClick={executeQuote}>
            Make market · {selectedPosture.replaceAll("-", " ")}
          </button>
          <div className={styles.feedback} aria-live="polite">
            <strong>{view.lastRound ? "Last round: " : "Tradeoff: "}</strong>
            {view.lastRound?.feedback ?? "Tighter quotes attract more flow. Quote skew can help work down an inventory imbalance."}
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={styles.result}>
          <div className={styles.score}><span>Score</span><strong>{money(result.score)}</strong></div>
          <div><p className={styles.eyebrow}>Dealer style</p><h3 className={styles.title}>{result.style.replaceAll("-", " ")}</h3></div>
          <button className={styles.reset} type="button" onClick={reset}>Deal again</button>
          <div className={marketStyles.resultDetails} aria-label="Run explanation">
            <div className={marketStyles.resultStat}><span>Customer fills</span><strong>{result.totalFills}</strong></div>
            <div className={marketStyles.resultStat}><span>Peak inventory</span><strong>{result.peakInventory}</strong></div>
            <div className={marketStyles.resultStat}><span>Risk penalty</span><strong>{money(result.totalRiskPenalty)}</strong></div>
            <p className={marketStyles.resultExplanation}>{resultExplanation}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
