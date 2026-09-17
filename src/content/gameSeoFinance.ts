import type { GameSeoContent } from "./gameSeo";

export const financeGameSeoContent: Record<string, GameSeoContent> = {
  "hedge-fund-floor": {
    summary: "Hedge Fund HQ is a walkable long/short equity management simulation. The market keeps moving while you build research dossiers, form theses, construct a portfolio, manage gross and net exposure, hedge market beta, allocate operating budget, hire staff, communicate with LPs, and protect the fund from drawdown.",
    howTo: [
      "Move with WASD or the arrow keys. Walk into the research area and press E or Space to start a company dossier. Research takes time and produces an imperfect directional signal rather than a guaranteed answer.",
      "Take a completed thesis into portfolio construction and decide whether to build a long position, short position, or pass. Positions change real cash, transaction costs, gross exposure, net exposure, beta exposure, and marked NAV.",
      "Use the risk function to set or rebalance an index hedge when the portfolio's market beta becomes too large. The hedge reduces systematic exposure but still costs money to trade and can reduce upside if the book was intentionally directional.",
      "Build the firm as well as the book. Analysts shorten research time and improve signal confidence, traders reduce implementation costs, and risk staff reduce the reputation damage from running outside the fund's risk envelope.",
      "Watch live news, portfolio P&L, gross/net exposure, beta, drawdown, operating budget, and reputation. Visit the LP room to communicate performance and risk. A 12% drawdown or a collapse in reputation ends the run.",
    ],
    concepts: [
      "Long and short equity positions",
      "Marked-to-market NAV and portfolio P&L",
      "Gross versus net exposure",
      "Market beta and index hedging",
      "Idiosyncratic versus systematic risk",
      "Research signal confidence",
      "Transaction costs and implementation quality",
      "Drawdown, high-water marks, and risk limits",
      "Staffing and operating-budget tradeoffs",
      "LP communication and reputation",
    ],
    strategy: [
      "Do not treat a positive research signal as certainty. The signal contains noise, and the underlying market can still move against a correct long-term thesis during the session.",
      "Gross exposure measures how much total risk the book is carrying; net exposure measures directional long-versus-short bias. A book can be close to market-neutral on net exposure while still carrying substantial gross risk.",
      "Beta hedging is most useful when you want to preserve stock-specific ideas while reducing broad market direction. Rebalance after the portfolio changes materially because a hedge that was correct for the old book can become stale.",
      "Hiring an analyst early improves the rate at which you can generate researched ideas, but every hire consumes the finite operating budget. A trader becomes more valuable as turnover rises because lower implementation costs compound across repeated trades.",
      "Large profits do not excuse uncontrolled risk. The fund can still fail if drawdown or reputation breaches the hard limits, so protect the ability to stay in the game rather than maximizing one trade's upside.",
    ],
    faqs: [
      { question: "Are the companies or prices real?", answer: "No. The securities, company names, prices, research signals, and news are synthetic. The accounting and risk relationships are designed to teach portfolio mechanics rather than reproduce or predict a real security." },
      { question: "How is this different from Market Maker?", answer: "Market Maker is an execution game about urgent client flow, venue choice, dealer inventory, and fill quality. Hedge Fund HQ is an investment-management game about research, thesis direction, portfolio construction, staffing, drawdown, beta, and LP confidence." },
      { question: "What is gross exposure?", answer: "Gross exposure is the absolute value of long positions plus the absolute value of short positions, divided by fund NAV. It measures how much total market exposure the portfolio carries regardless of direction." },
      { question: "What is net exposure?", answer: "Net exposure is long exposure minus short exposure relative to NAV. A positive net book is directionally long; a negative net book is directionally short. Net exposure can be small even when gross exposure is large." },
      { question: "What does the beta hedge do?", answer: "The risk function sizes an index position against the current beta-dollar exposure of the stock book. That reduces broad market sensitivity while leaving more of the company-specific long and short theses in place." },
    ],
  },
};

export function getFinanceGameSeoContent(slug: string): GameSeoContent | undefined {
  return financeGameSeoContent[slug];
}
