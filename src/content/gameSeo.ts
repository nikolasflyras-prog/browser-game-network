export type GameSeoContent = {
  summary: string;
  howTo: readonly string[];
  concepts: readonly string[];
  strategy: readonly string[];
  faqs: readonly { question: string; answer: string }[];
};

export const gameSeoContent: Record<string, GameSeoContent> = {
  "orbit-relay": {
    summary: "Orbit Relay is a timing game about releasing a moving marker at the right moment. Each launch follows the tangent to your current orbit, so success depends on reading direction, speed, and the position of the next relay rather than simply tapping as fast as possible.",
    howTo: [
      "Watch the yellow marker circle the white source body and read the faint tangent guide.",
      "Tap, click, or press Space when the launch direction points toward the red relay.",
      "Capture the relay before the marker leaves the playfield. Each successful capture creates the next orbit and increases difficulty.",
    ],
    concepts: ["Tangential motion", "Timing under increasing speed", "Risk versus multiplier", "Pattern recognition"],
    strategy: [
      "Use the tangent line as your primary cue instead of aiming directly from the center of the orbit.",
      "Expect the timing window to tighten after successful relays; later launches reward anticipation more than reaction.",
      "A short run is useful practice. Restart quickly and focus on recognizing the correct launch angle.",
    ],
    faqs: [
      { question: "How do I control Orbit Relay?", answer: "Use a tap, mouse click, or the Space key to launch. The shared controls above the game also let you pause, restart, and mute sound." },
      { question: "Why does the marker miss even when the relay looks close?", answer: "The marker launches along the tangent to its orbit, not directly toward the relay. The direction at the instant you launch matters as much as the relay's position." },
      { question: "Does Orbit Relay save progress?", answer: "It stores your local high score in this browser. No account is required." },
    ],
  },
  "linebreak-daily": {
    summary: "Linebreak Daily is a route-planning puzzle with one shared challenge per day. You must draw a continuous path from start to exit, collect the key before crossing the gate, avoid blocked cells, and stay within the puzzle's ink budget.",
    howTo: [
      "Begin at S and extend the route through adjacent grid cells.",
      "Reach K before entering G. The gate is locked until the key is part of your current path.",
      "Avoid red blocked cells and do not cross a cell already used by your route.",
      "Reach E before the ink limit is exceeded. Move back one cell along the route to undo and revise your plan.",
    ],
    concepts: ["Constraint satisfaction", "Path planning", "Limited-resource optimization", "Backtracking"],
    strategy: [
      "Before drawing, identify the rough order of start, key, gate, and exit.",
      "Treat blocked cells as walls and preserve flexible corridors until you know which route the gate requires.",
      "Use backtracking rather than restarting when only the last turn is wrong; the puzzle is designed to reward revision.",
    ],
    faqs: [
      { question: "Is the Linebreak puzzle the same for everyone each day?", answer: "Yes. The date deterministically selects the daily board, so players receive the same challenge for that day." },
      { question: "Can I undo a move?", answer: "Yes. Move back to the previous cell in your route to remove the last segment." },
      { question: "Do I need an account for the daily puzzle?", answer: "No. Completion and your best result for the day are stored locally in your browser." },
    ],
  },
  "run-the-fed": {
    summary: "Run the Fed is an educational monetary-policy simulation. Across eight quarters you choose a policy interest rate and watch inflation, unemployment, growth, spending, investment, asset prices, and financial stability respond to your decisions and scenario shocks.",
    howTo: [
      "Choose a scenario and review the starting economy and policy mandate.",
      "Raise or lower the policy rate in 0.25 percentage-point increments, then advance one quarter.",
      "Read the explanation after each quarter and adjust as the effects of earlier decisions work through the economy.",
      "After eight quarters, your score reflects balance across inflation, employment, growth, financial stability, and policy volatility.",
    ],
    concepts: ["Monetary-policy transmission", "Inflation and unemployment tradeoffs", "Policy lags", "Neutral interest rate", "Financial stability", "Demand and supply shocks"],
    strategy: [
      "Do not optimize a single indicator. A very low inflation rate can still accompany unnecessary economic weakness.",
      "Avoid reacting to every one-quarter move with a large rate change; policy works with lags and abrupt moves can create financial stress.",
      "Distinguish demand problems from supply shocks. A rate decision that helps inflation can also weaken growth and employment.",
    ],
    faqs: [
      { question: "Is Run the Fed a forecast of the real U.S. economy?", answer: "No. It is a simplified teaching model designed to make monetary-policy cause and effect visible. It does not forecast actual Federal Reserve decisions or economic data." },
      { question: "What does the score reward?", answer: "The score rewards keeping inflation, unemployment, growth, and financial stability reasonably balanced while avoiding unnecessarily volatile rate changes." },
      { question: "Why can a rate change take time to work?", answer: "Interest rates influence borrowing, spending, investment, asset prices, and hiring through several channels. The simulation models that idea with delayed and partial responses rather than instant one-for-one changes." },
    ],
  },
  "market-maker": {
    summary: "Market Maker is a short finance simulation about quoting two-sided markets. The chosen spread and quote skew directly change fill probability, while inventory and fair-value moves determine whether apparent spread capture survives mark-to-market and risk penalties.",
    howTo: [
      "Inspect fair value, current inventory, dealer score, and the exact bid and ask attached to each quote posture.",
      "Choose tight, balanced, wide, lean-long, or lean-short, then make the market for that round.",
      "Read the customer-flow and fair-value result before choosing the next quote. Use skew to encourage flow that reduces an inventory imbalance.",
      "After 16 rounds, compare spread capture, customer fills, peak inventory, and risk penalties in the final dealer result.",
    ],
    concepts: ["Bid-ask spread", "Inventory risk", "Order flow", "Market making", "Quote skew", "Mark-to-market P&L"],
    strategy: [
      "Tight quotes win more flow but expose you to informed trading and faster inventory accumulation.",
      "Wide quotes protect against bad fills but can create too many no-flow rounds to earn enough spread.",
      "When inventory is long, lowering the quote can make the ask more attractive and help customers take inventory from you; when short, the opposite skew can help rebuild the position.",
    ],
    faqs: [
      { question: "Why can a profitable trade still hurt the final score?", answer: "The dealer is marked to the new fair value and can also pay an inventory risk penalty. Spread capture is only one part of the result." },
      { question: "What does quote skew do?", answer: "Skew shifts the quote center so one side becomes more attractive, which can help a dealer reduce a long or short inventory position." },
      { question: "Does Market Maker use real market data?", answer: "No. Prices and customer flow are synthetic. The model is designed to teach the mechanics and tradeoffs of two-sided quoting, not simulate a specific security or exchange." },
    ],
  },
  "supply-chain-shock": {
    summary: "Supply Chain Shock is an operations simulation about preparing for and responding to disruption. Decisions about inventory, alternate suppliers, customer allocation, and emergency sourcing change service, cash, backlog, and resilience—and earlier preparation can unlock options that do not exist after a crisis begins.",
    howTo: [
      "Review service, resilience, cash, inventory, backlog, and the preparedness capabilities shown above the current scenario.",
      "Choose one operating response, then inspect the exact metric changes and causal explanation before the next disruption arrives.",
      "Notice that safety stock and qualified alternate capacity are capabilities, not free score: both consume resources before they are needed.",
      "Finish the four-scenario sequence with strong service and resilience without exhausting cash or allowing backlog and excess inventory to dominate the network.",
    ],
    concepts: ["Supply-chain resilience", "Safety stock", "Contingency capacity", "Service levels", "Backlog", "Working capital", "Path dependence"],
    strategy: [
      "Preparation is valuable when it preserves future choices. A qualified second supplier costs cash before the failure but can become the only low-damage response later.",
      "Inventory is a buffer, not a universal good. Safety stock can absorb a logistics delay, but excess inventory ties up working capital and can become a penalty.",
      "Do not optimize the current quarter in isolation. A response that looks cheap now can create backlog, service damage, or missing capabilities in later scenarios.",
    ],
    faqs: [
      { question: "Why is alternate capacity sometimes unavailable?", answer: "The backup-supplier response requires enough resilience to represent work completed before the shutdown. If you did not build that capability earlier, the game does not let you create it instantly during the crisis." },
      { question: "Is more inventory always safer?", answer: "No. Inventory can protect service when logistics break, but it consumes cash and can become inefficient when the buffer is larger than the disruption requires." },
      { question: "Does Supply Chain Shock model a specific company?", answer: "No. The scenarios are synthetic and simplified to make operating tradeoffs visible. They are not a forecast or a model of a particular company's network." },
    ],
  },
};

export function getGameSeoContent(slug: string): GameSeoContent | undefined {
  return gameSeoContent[slug];
}
