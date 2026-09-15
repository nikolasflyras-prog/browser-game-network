"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  chooseMarketMakerPosture,
  createMarketMakerPrototype,
  marketMakerPrototypeResult,
  marketMakerPrototypeView,
} from "../market-maker/prototype";
import type { QuotePosture } from "../market-maker/simulation";
import type { PrototypeEventSink } from "./prototype-events";
import marketStyles from "./MarketMakerPolish.module.css";
import styles from "./PrototypeLab.module.css";

function money(value: number) {
  return value.toFixed(2);
}

type Props = { onEvent?: PrototypeEventSink };

export function MarketMakerPrototypePanel({ onEvent }: Props) {
  const [session, setSession] = useState(() => createMarket-makerPrototype());
  const [selectedPosture, setSelectedPosture] = useState<QuotePosture>("balanced");
  const startedAt = useRef(Date.now());
  const startMetadata = useRef({ seed: session.state.seed, rounds: session.state.maxRounds });
  const view = marketMakerPrototypeView(session);
  const result = market-makerPrototypeResult(session);
  const inventoryY = `${50 - Math.max(-8, Math.min(8, view.inventory)) * 5}%`;
  const style = { "--inventory-y": inventoryY } as CSSProperties;
  const selectedQuote = view.quotes.find((quote) => quote.posture === selectedPosture) ?? view.quotes[0];

  useEffect(() => {
    startedAt.current = Date.now();
    onEvent?.("game_started", startMetadata.current);
  }, [onEvent]);

  function executeQuote() {
    if (view.complete) return;
    const next = chooseMarketMakerPosture(session, selectedPosture);
    const round = next.state.history.at(-1);
    setSession(next);

    if (round) {
      onEvent?.("level_completed", {
        round: round.round,
        posture: round.posture,
        bid: round.bid,
        ask: round.ask,
        inventory_before: round.inventoryBefore,
        inventory_after: round.inventoryAfter,
        round_score: round.scoreAfter,
      });
    }

    if (next.state.complete) {
      const finalRound = next.state.history.at(-1);
      onEvent?.("game_completed", {
        score: next.state.score,
        ending_inventory: next.state.inventory,
        raw_pnl: finalRound?.markedPnl ?? next.state.cash + next.state.inventory * next.state.fairValue,
        duration_ms: Math.max(0, Date.now() - startedAt.current),
      });
    }
  }

  function reset() {
    onEvent?.("game_restarted", { previous_score: result?.score ?? null });
    startedAt.current = Date.now();
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
          <div className={styles.inventoryMeter} aria-label=x`Inventory ${view.inventory}`}>
            <span className={styles.inventoryZero} />
            <span className={styles.inventoryDot} style={style} />
          </div>
          <div className={styles.priceLadder} aria-label=x`${selectedPosture} quote`}>
            <div className={styles.priceMark}><strong>Ask</strong><span className={styles.priceLine} /><span>${money(selectedQuote.ask)}</span></div>
            <div className={styles.priceMark} data-kind="fair"><strong>Fair</strong><span className={styles.priceLine} /><span>${money(view.fairValue)}</span></div>
            <div className={styles.priceMark}><strong>Bid</strong><span className={styles.priceLine} /><span>${money(selectedQuote.bid)}</span></div>
          </div>
        </div>
      </div>

      {!view.complete ? (\n        <div className={styles.decisionDock}>\n          <div className={styles.prompt}>\n            <p className={styles.eyebrow}>Your quote</p>\n            <h3>Select a posture, inspect the exact bid / ask, then make the market.</h3>\n          </div>\n          <div className={styles.quoteGrid}>\n            {view.quotes.map((quote) => (\n              <button\n                className=x`${styles.quoteButton} ${marketStyles.quoteButton}`}\n                type=\"button\"\n                key={quote.posture}\n                onClick={() => setSelectedPosture(quote.posture)}\n                aria-pressed={selectedPosture === quote.posture}\n              >\n                <strong>{quote.posture.replaceAll(\"-\", \" \")}</strong>\n                <span>${money(quote.bid)} / ${money(quote.ask)}</span>\n              </button>\n            ))}\n          </div>\n          <button className={styles.reset} type=\"button\" onClick={executeQuote}>\n            Make market · {selectedPosture.replaceAll(\"-\", \" \")}\n          </button>\n          <div className={styles.feedback} aria-live=\"polite\">\n            <strong>{view.lastRound ? \"Last round: \" : \"Tradeoff: \"}</strong>\n            {view.lastRound?.feedback ?? \"Tighter quotes attract more flow. Quote skew can help work down an inventory imbalance.\"}\n          </div>\n        </div>\n      ) : null}\n\n      {result ? (\n        <div className={styles.result}>\n          <div className={styles.score}><span>Score</span><strong>{money(result.score)}</strong></div>\n          <div><p className={styles.eyebrow}>Dealer style</p><h3 className={styles.title}>{result.style.replaceAll(\"-\", \" \")}</h3></div>\n          <button className={styles.reset} type=\"button\" onClick={reset}>Deal again</button>\n          <div className={marketStyles.resultDetails} aria-label=\"Run explanation\">\n            <div className={marketStyles.resultStat}><span>Customer fills</span><strong>{result.totalFills}</strong></div>\n            <div className={marketStyles.resultStat}><span>Peak inventory</span><strong>{result.peakInventory}</strong></div>\n            <div className={marketStyles.resultStat}><span>Risk penalty</span><strong>{money(result.totalRiskPenalty)}</strong></div>\n            <p className={marketStyles.resultExplanation}>{resultExplanation}</p>\n          </div>\n        </div>\n      ) : null}\n    </section>\n  );\n}\n 