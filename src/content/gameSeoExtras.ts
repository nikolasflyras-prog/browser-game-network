import type { GameSeoContent } from "./gameSeo";

const extraGameSeoContent: Record<string, GameSeoContent> = {
  "vector-drift": {
    summary: "Vector Drift is a continuous arcade dodger about steering through a moving corridor under increasing speed. Gates arrive faster and their openings tighten as the run improves, so surviving requires both immediate control and early positioning for the next gap.",
    howTo: [
      "Use Left/Right or A/D to steer. On touch or mouse, press and drag toward the horizontal position you want.",
      "Pass through each red gate without touching either side of the barrier.",
      "Every cleared gate increases the run score and gradually raises speed while shrinking the safe opening.",
      "A collision ends the run. Restart immediately and try to extend your best local score.",
    ],
    concepts: ["Continuous steering", "Reaction under speed pressure", "Spatial anticipation", "Risk and near-miss control"],
    strategy: [
      "Move toward the next opening before it reaches the player rather than waiting until the barrier is close.",
      "Small corrections are safer than crossing the entire playfield late in a gate's approach.",
      "Near-edge passes can score extra points, but the speed ramp makes aggressive lines increasingly risky.",
    ],
    faqs: [
      { question: "How do I control Vector Drift?", answer: "Use the arrow keys or A/D on a keyboard. Pointer and touch controls also work by dragging horizontally across the game canvas." },
      { question: "Does Vector Drift get harder?", answer: "Yes. Gate speed increases, gates arrive more frequently, and the safe opening narrows as more gates are cleared." },
      { question: "Is my high score saved?", answer: "Yes. Your best Vector Drift score is stored locally in this browser." },
    ],
  },
  "pulse-bloom": {
    summary: "Pulse Bloom is a one-shot chain-reaction game. Moving particles drift across the field while you choose a single place and moment to create the first expanding pulse. Any particle it catches becomes another pulse, allowing one good placement to cascade across the board.",
    howTo: [
      "Watch the moving particle field and the capture target for the current round.",
      "Tap, click, or press Space once to place the opening pulse.",
      "Captured particles become new pulses automatically. You cannot place a second shot during the round.",
      "Reach the capture target to advance. Later rounds add particles while making each pulse smaller and shorter-lived.",
    ],
    concepts: ["Chain reactions", "Spatial timing", "Emergent cascades", "One-shot optimization"],
    strategy: [
      "Wait for multiple particles to cluster before placing the first pulse; isolated hits rarely create a long chain.",
      "Aim between converging groups rather than directly on a single particle so the first expansion can touch several paths.",
      "As rounds advance, smaller pulses reward tighter clusters and better timing rather than faster clicking.",
    ],
    faqs: [
      { question: "How many pulses can I place?", answer: "One. The challenge is to choose the first pulse so captured particles continue the chain for you." },
      { question: "Why do later rounds feel harder?", answer: "The target rises and the maximum pulse radius gradually falls, so a loose group that worked early may not sustain a later chain." },
      { question: "Does Pulse Bloom save a best score?", answer: "Yes. The high score is stored locally in your browser and does not require an account." },
    ],
  },
};

export function getExtraGameSeoContent(slug: string): GameSeoContent | undefined {
  return extraGameSeoContent[slug];
}
