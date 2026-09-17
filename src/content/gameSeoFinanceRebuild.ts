import type { GameSeoContent } from "./gameSeo";

const financeRebuildSeoContent: Record<string, GameSeoContent> = {
  "market-maker": {
    summary: "Market Maker is now a trading-floor arcade game rather than a quote-selection dashboard. You physically move a dealer around the floor, collect expiring client orders, route them to liquidity venues with different execution tradeoffs, and run to a hedge station when inventory risk becomes dangerous while fair value and volatility keep moving.",
    howTo: [
      "Move with WASD or the arrow keys and hold Shift to dash while stamina remains. Touch and pointer players can hold toward a destination on the floor.",
      "Reach a glowing client ticket and press E or Space to pick it up. Each ticket has a side, size, and countdown, so ignored flow eventually damages desk reputation.",
      "Carry the order to Alpha, Beta, or Gamma and press E or Space to execute. Alpha is reliable with a tight bid-ask spread; wider venues offer more spread capture but can reject flow.",
      "Filled client orders change dealer inventory. Run to the hedge station when the position becomes uncomfortable; hedging removes exposure but pays slippage. Survive until the closing bell without losing reputation.",
    ],
    concepts: ["Bid-ask spread", "Dealer inventory risk", "Liquidity and fill probability", "Hedging and slippage", "Mark-to-market P&L", "Client service under time pressure"],
    strategy: [
      "Do not route every ticket to the widest venue. Higher theoretical spread is useless if repeated rejections cause an urgent client order to expire.",
      "Treat inventory as a position you physically have to manage. A profitable fill can become costly if fair value moves against a large unhedged book during a shock.",
      "Plan routes through the floor. Combining a client pickup, a venue execution, and a hedge pass into one movement path saves more time than sprinting reactively between stations.",
    ],
    faqs: [
      { question: "Is Market Maker still a button-selection simulation?", answer: "No. Version 0.3 replaces the posture-button interface with a continuous spatial trading-floor game. The primary actions are movement, pickup, routing, execution, and hedging." },
      { question: "Why are the three venues different?", answer: "They represent a simplified liquidity tradeoff. Alpha fills reliably at a tighter spread, while wider venues can earn more per successful fill but have a greater chance of rejection." },
      { question: "Why can P&L change after a client order is already filled?", answer: "The dealer keeps the resulting inventory until it is offset or hedged. Fair value continues to move, so the remaining position is marked to market continuously." },
    ],
  },
};

export function getFinanceRebuildSeoContent(slug: string): GameSeoContent | undefined { return financeRebuildSeoContent[slug]; }
