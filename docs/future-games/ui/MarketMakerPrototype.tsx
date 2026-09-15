"use client";

import { useState, type CSSProperties } from "react";
import {
  chooseMarketMakerPosture,
  createMarketMakerPrototype,
  marketMakerPrototypeResult,
  marketMakerPrototypeView,
} from "../market-maker/prototype";
import styles from "./PrototypeLab.module.css";

function money(value: number) {
  return value.toFixed(2);
}

export function MarketMakerPrototypePanel() {
  const [session, setSession] = useState(() => createMarketMakerPrototype());
  const view = marketMakerPrototypeView(session);
  const result = marketMakerPrototypeResult(session);
  const inventoryY = `${50 - Math.max(-8, Math.min(8, view.inventory)) * 5}%`;
  const style = { "--inventory-y": inventoryY } as CSSProperties;
  const balanced = view.quotes.find((quote) => quote.posture === "balanced") ?? view.quotes[0];

  function reset() {
    setSession(createMarketMakerPrototype());
  }

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
          <div className={styles.priceLadder}>
            <div className={styles.priceMark}><strong>Ask</strong><span className={styles.priceLine} /><span>${money(balanced.ask)}</span></div>
            <div className={styles.priceMark} data-kind="fair"><strong>Fair</strong><span className={styles.priceLine} /><span>${money(view.fairValue)}</span></div>
            <div className={styles.priceMark}><strong>Bid</strong><span className={styles.priceLine} /><span>${money(balanced.bid)}</span></div>
          </div>
        </div>
      </div>

      {!view.complete ? (
        <div className={styles.decisionDock}>
          <div className={styles.prompt}>
            <p className={styles.eyebrow}>Your quote</p>
            <h3>Choose how aggressively to make this market.</h3>
          </div>
          <div className={styles.quoteGrid}>
            {view.quotes.map((quote) => (
              <button
                className={styles.quoteButton}
                type="button"
                key={quote.posture}
                onClick={() => setSession((current) => chooseMarketMakerPosture(current, quote.posture))}
              >
                <strong>{quote.posture.replaceAll("-", " ")}</strong>
                <span>${money(quote.bid)} / ${money(quote.ask)}</span>
              </button>
            ))}
          </div>
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
        </div>
      ) : null}
    </section>
  );
}
