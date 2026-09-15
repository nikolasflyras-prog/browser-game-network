export type FutureGameLane = "Play" | "Learn";
export type FutureGameStage = "scenario-ready" | "simulation-ready" | "playtest-ready";

export type FutureGameCandidate = {
  slug: string;
  title: string;
  lane: FutureGameLane;
  category: string;
  stage: FutureGameStage;
  targetSessionMinutes: readonly [number, number];
  primaryHypothesis: string;
  promoteWhen: string;
};

export const futureGameCandidates: readonly FutureGameCandidate[] = [
  {
    slug: "traffic-control",
    title: "Traffic Control",
    lane: "Play",
    category: "Arcade Management",
    stage: "playtest-ready",
    targetSessionMinutes: [0.75, 2.5],
    primaryHypothesis: "A one-input arcade loop can drive very high restart rate and runs per session.",
    promoteWhen: "Orbit Relay leads the MVP on restart rate or repeat runs.",
  },
  {
    slug: "switchyard-daily",
    title: "Switchyard Daily",
    lane: "Play",
    category: "Daily Logic Puzzle",
    stage: "simulation-ready",
    targetSessionMinutes: [2, 4],
    primaryHypothesis: "Daily habit can transfer to a distinct state-routing puzzle without copying Linebreak's path mechanic.",
    promoteWhen: "Linebreak Daily leads on day-2/day-7 return or sharing.",
  },
  {
    slug: "market-maker",
    title: "Market Maker",
    lane: "Learn",
    category: "Finance Simulation",
    stage: "playtest-ready",
    targetSessionMinutes: [2, 4],
    primaryHypothesis: "Educational finance can support short repeatable rounds rather than one-and-done sessions.",
    promoteWhen: "Run the Fed validates interactive finance learning and shorter repeat sessions look valuable.",
  },
  {
    slug: "supply-chain-shock",
    title: "Supply Chain Shock",
    lane: "Learn",
    category: "Operations Simulation",
    stage: "scenario-ready",
    targetSessionMinutes: [4, 6],
    primaryHypothesis: "Scenario-driven operations decisions can capture high-intent search/classroom traffic while remaining game-like.",
    promoteWhen: "Run the Fed validates completion/search but replay is less important than educational depth.",
  },
  {
    slug: "chip-fab",
    title: "Chip Fab",
    lane: "Learn",
    category: "Semiconductor Simulation",
    stage: "scenario-ready",
    targetSessionMinutes: [4, 7],
    primaryHypothesis: "A specialist systems game can create a differentiated technical-learning niche with reusable scenario architecture.",
    promoteWhen: "Technical search traffic or specialist audience engagement justifies a narrower but differentiated title.",
  },
  {
    slug: "power-grid-dispatcher",
    title: "Power Grid Dispatcher",
    lane: "Learn",
    category: "Energy Systems Simulation",
    stage: "scenario-ready",
    targetSessionMinutes: [4, 6],
    primaryHypothesis: "The Learn lane can expand beyond business/finance using the same fast decision-feedback engine.",
    promoteWhen: "Educational simulation engagement is strong enough to broaden into infrastructure/STEM topics.",
  },
] as const;

export function candidatesForLane(lane: FutureGameLane) {
  return futureGameCandidates.filter((candidate) => candidate.lane === lane);
}
