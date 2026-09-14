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
};

export function getGameSeoContent(slug: string): GameSeoContent | undefined {
  return gameSeoContent[slug];
}
