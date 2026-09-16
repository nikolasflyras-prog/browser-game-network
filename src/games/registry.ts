export type GameLane = "Play" | "Learn";
export type GameStatus = "diagnostic" | "prototype" | "live";

export type GameMetadata = {
  slug: string;
  title: string;
  description: string;
  lane: GameLane;
  category: string;
  status: GameStatus;
  version: string;
};

export const gameRegistry: readonly GameMetadata[] = [
  {
    slug: "run-the-fed",
    title: "Run the Fed",
    description: "Set interest rates across eight quarters and balance inflation, employment, growth, and financial stability as shocks hit the economy.",
    lane: "Learn",
    category: "Economics Simulation",
    status: "live",
    version: "0.1.0",
  },
  {
    slug: "market-maker",
    title: "Market Maker",
    description: "Steer a live two-sided market while customer flow and fair value keep moving. Balance spread capture, informed flow, and inventory risk in real time.",
    lane: "Learn",
    category: "Finance Simulation",
    status: "live",
    version: "0.2.0",
  },
  {
    slug: "supply-chain-shock",
    title: "Supply Chain Shock",
    description: "Manage service, cash, inventory, resilience, and backlog through disruptions where earlier preparation changes which responses are available later.",
    lane: "Learn",
    category: "Operations Simulation",
    status: "live",
    version: "0.1.0",
  },
  {
    slug: "chip-fab",
    title: "Chip Fab",
    description: "Run a semiconductor fab through ramp pressure, process drift, bottlenecks, and maintenance while balancing yield, useful throughput, cycle time, defect risk, and cash.",
    lane: "Learn",
    category: "Semiconductor Simulation",
    status: "live",
    version: "0.1.0",
  },
  {
    slug: "power-grid-dispatcher",
    title: "Power Grid Dispatcher",
    description: "Dispatch generation, storage, demand response, and transmission workarounds through grid stress while balancing reliability, reserve, cost, emissions, and finite flexibility.",
    lane: "Learn",
    category: "Energy Systems Simulation",
    status: "live",
    version: "0.1.0",
  },
  {
    slug: "linebreak-daily",
    title: "Linebreak Daily",
    description: "Draw one continuous route through the daily grid. Find the key, cross the gate, avoid hazards, and reach the exit before your ink runs out.",
    lane: "Play",
    category: "Daily Puzzle",
    status: "live",
    version: "0.1.0",
  },
  {
    slug: "orbit-relay",
    title: "Orbit Relay",
    description: "Time each launch, catch the next relay, and keep the orbital chain alive as the window tightens.",
    lane: "Play",
    category: "Timing",
    status: "live",
    version: "0.1.0",
  },
  {
    slug: "system-check",
    title: "System Check",
    description: "A Phase 0 diagnostic scene for the shared browser-game runtime.",
    lane: "Play",
    category: "Diagnostic",
    status: "diagnostic",
    version: "0.1.0",
  },
] as const;

export const publicGameRegistry = gameRegistry.filter((game) => game.status !== "diagnostic");

export function getGameMetadata(slug: string): GameMetadata | undefined {
  return gameRegistry.find((game) => game.slug === slug);
}

export function getRelatedGames(slug: string, limit = 3): GameMetadata[] {
  const current = getGameMetadata(slug);
  if (!current) return [];

  return publicGameRegistry
    .filter((game) => game.slug !== slug)
    .sort((a, b) => {
      const aScore = Number(a.lane === current.lane) + Number(a.category === current.category);
      const bScore = Number(b.lane === current.lane) + Number(b.category === current.category);
      return bScore - aScore;
    })
    .slice(0, limit);
}
