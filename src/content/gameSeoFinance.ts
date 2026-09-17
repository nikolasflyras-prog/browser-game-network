import type { GameSeoContent } from "./gameSeo";

export const financeGameSeoContent: Record<string, GameSeoContent> = {
  "hedge-fund-floor": {
    summary: "Hedge Fund HQ is a walkable long/short equity management simulation with replayable fund mandates. The market keeps moving while you build research dossiers, construct a portfolio, manage gross/net exposure and beta, hire staff, communicate with LPs, and adapt to materially different risk regimes.",
    howTo: [
      "Move with WASD or the arrow keys. Walk into the research area and press E or Space to start a company dossier. Research takes time and produces an imperfect directional signal rather than a guaranteed answer.",
      "Take a completed thesis into portfolio construction and decide whether to build a long position, short position, or pass. Positions change real cash, transaction costs, gross exposure, net exposure, beta exposure, and marked NAV.",
      "Each run operates under a fund mandate. Risk-On Momentum tolerates more directional beta, Market Neutral demands tight beta and net exposure, Capital Preservation imposes much stricter drawdown and gross limits, and Macro Whipsaw repeatedly reverses broad-market pressure.",
      "Use the risk room to set or rebalance an index hedge. The same stock book can be acceptable in one mandate and unacceptable in another, so risk management should respond to the current mandate instead of following one fixed recipe.",
      "Build the firm as well as the book. Analysts shorten research time and improve signal confidence, traders reduce implementation costs, and risk staff reduce the reputation damage from mandate breaches.",
      "Watch live news, portfolio P&L, gross/net exposure, beta, drawdown, operating budget, reputation, and the mandate banner. Use Next mandate on desktop or mobile—or press M on a keyboard—to rotate into a different fund mandate and fresh run.",
    ],
    concepts: [
      "Long and short equity positions",
      "Marked-to-market NAV and portfolio P&L",
      "Gross versus net exposure",
      "Market beta and index hedging",
      "Fund mandates and risk budgets",
      "Market-neutral versus directional investing",
      "Volatility regimes and macro whipsaw",
      "Idiosyncratic versus systematic risk",
      "Research signal confidence",
      "Transaction costs and implementation quality",
      "Drawdown, high-water marks, and risk limits",
      "Staffing and operating-budget tradeoffs",
      "LP communication and reputation",
    ],
    strategy: [
      "Read the mandate before you build the book. A portfolio that is sensible in Risk-On Momentum can be an immediate problem in Market Neutral or Capital Preservation because the acceptable beta, gross exposure, and drawdown thresholds are different.",
      "Do not treat a positive research signal as certainty. The signal contains noise, and the market regime can still move against a correct company-specific thesis during the session.",
      "Market Neutral is not the same as low gross exposure. You can carry meaningful long and short positions while keeping beta and net direction small; the challenge is extracting stock-specific alpha without drifting into an index bet.",
      "Capital Preservation changes the objective function. Smaller books, earlier hedging, and a stronger risk team can be rational even if they reduce upside because avoiding drawdown is part of the mandate itself.",
      "Macro Whipsaw punishes stale hedges. Rebalance after the stock book changes or the tape reverses, because a hedge sized for the previous exposure can quickly become the wrong position.",
      "Hiring an analyst improves the rate at which you can generate researched ideas, but every hire consumes operating budget. Trader and risk hires become more valuable in mandates where turnover or risk discipline matters more.",
    ],
    faqs: [
      { question: "Are the companies or prices real?", answer: "No. The securities, company names, prices, research signals, and news are synthetic. The accounting and risk relationships are designed to teach portfolio mechanics rather than reproduce or predict a real security." },
      { question: "How is this different from Market Maker?", answer: "Market Maker is an execution game about urgent client flow, venue choice, dealer inventory, and fill quality. Hedge Fund HQ is an investment-management game about research, portfolio construction, fund mandates, staffing, drawdown, beta, and LP confidence." },
      { question: "Why do the risk limits change between runs?", answer: "Different funds are hired to deliver different exposures. A market-neutral fund is expected to suppress market direction, while a directional growth fund may deliberately carry more beta. The mandate determines what counts as acceptable risk." },
      { question: "What is gross exposure?", answer: "Gross exposure is the absolute value of long positions plus the absolute value of short positions, divided by fund NAV. It measures how much total market exposure the portfolio carries regardless of direction." },
      { question: "What is net exposure?", answer: "Net exposure is long exposure minus short exposure relative to NAV. A positive net book is directionally long; a negative net book is directionally short. Net exposure can be small even when gross exposure is large." },
      { question: "What does the beta hedge do?", answer: "The risk function sizes an index position against the current beta-dollar exposure of the stock book. That reduces broad market sensitivity while leaving more of the company-specific long and short theses in place." },
    ],
  },
};

export function getFinanceGameSeoContent(slug: string): GameSeoContent | undefined {
  return financeGameSeoContent[slug];
}
