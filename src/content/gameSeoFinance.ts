import type { GameSeoContent } from "./gameSeo";

export const financeGameSeoContent: Record<string, GameSeoContent> = {
  "hedge-fund-floor": {
    summary: "Hedge Fund Floor is a walkable long/short equity simulation. The market keeps moving while you physically route research ideas to the trading desk, build long and short positions, control gross and net exposure, hedge market beta, hire staff, respond to news, and keep drawdown and LP confidence inside the fund's risk limits.",
    howTo: [
      "Move with WASD or the arrow keys. Walk to the research desk and press E or Space to start a company dossier. Research takes time and produces an imperfect directional signal rather than a guaranteed answer.",
      "Carry the active idea to the trading floor. Choose the spatial LONG $5M, SHORT $5M, or PASS zone. Trades change real cash, position value, transaction costs, gross exposure, net exposure, beta exposure, and marked NAV.",
      "Use the risk desk to set or rebalance an index hedge when the portfolio's market beta becomes too large. The hedge reduces systematic exposure but still costs money to trade and can reduce upside if the book was intentionally directional.",
      "Hire analysts, traders, and risk staff from the lower office. Analysts shorten research time and improve signal confidence, traders reduce execution costs, and risk staff reduce the reputation damage from running outside the fund's risk envelope.",
      "Watch live news, portfolio P&L, gross/net exposure, beta, drawdown, and reputation. Visit the LP room to communicate performance and risk. A 12% drawdown or a collapse in reputation ends the run before the closing bell.",
    ],
    concepts: [
      "Long and short equity positions",
      "Marked-to-market NAV and portfolio P&L",
      "Gross versus net exposure",
      "Market beta and index hedging",
      "Idiosyncratic versus systematic risk",
      "Research signal confidence",
      "Transaction costs and execution quality",
      "Drawdown, high-water marks, and risk limits",
      "Staffing and operating-budget tradeoffs",
      "LP communication and reputation",
    ],
    strategy: [
      "Do not treat a positive research signal as certainty. The signal contains noise, and the underlying market can still move against a correct long-term thesis during the session.",
      "Gross exposure measures how much total risk the book is carrying; net exposure measures directional long-versus-short bias. A book can be close to market-neutral on net exposure while still carrying substantial gross risk.",
      "Beta hedging is most useful when you want to preserve stock-specific ideas while reducing broad market direction. Rebalance after the portfolio changes materially because a hedge that was correct for the old book can become stale.",
      "Hiring an analyst early improves the rate at which you can generate researched ideas, but every hire consumes the finite operating budget. A trader becomes more valuable as turnover rises because lower transaction costs compound across repeated trades.",
      "Large profits do not excuse uncontrolled risk. The fund can still fail if drawdown or reputation breaches the hard limits, so protect the ability to stay in the game rather than maximizing one trade's upside.",
    ],
    faqs: [
      {
        question: "Are the companies or prices real?",
        answer: "No. The securities, company names, prices, research signals, and news are synthetic. The accounting and risk relationships are designed to teach portfolio mechanics rather than reproduce or predict a real security.",
      },
      {
        question: "What is gross exposure?",
        answer: "Gross exposure is the absolute value of long positions plus the absolute value of short positions, divided by fund NAV. It measures how much total market exposure the portfolio carries regardless of direction.",
      },
      {
        question: "What is net exposure?",
        answer: "Net exposure is long exposure minus short exposure relative to NAV. A positive net book is directionally long; a negative net book is directionally short. Net exposure can be small even when gross exposure is large.",
      },
      {
        question: "What does the beta hedge do?",
        answer: "The risk desk sizes an index position against the current beta-dollar exposure of the stock book. That reduces broad market sensitivity while leaving more of the company-specific long and short theses in place.",
      },
      {
        question: "Why can NAV change immediately after a trade?",
        answer: "Entering a position is approximately NAV-neutral before costs because cash is exchanged for an asset or short-sale proceeds. Transaction costs reduce NAV immediately, while later price changes create marked-to-market gains or losses.",
      },
    ],
  },
};

export function getFinanceGameSeoContent(slug: string): GameSeoContent | undefined {
  return financeGameSeoContent[slug];
}
