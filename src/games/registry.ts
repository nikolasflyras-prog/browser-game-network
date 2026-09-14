export type GameLane = "Play" | "Learn";
export type GameStatus = "diagnostic" | "prototype" | "live";
export type GameCategory = "Arcade" | "Puzzle" | "Strategy" | "Simulation" | "Diagnostic";

export type GameMetadata = {
  slug: string;
  title: string;
  description: string;
  lane: GameLane;
  category: GameCategory;
  status: GameStatus;
  version: string;
};

export const gameRegistry: readonly GameMetadata[] = [
  {
    slug: "orbit-relay",
    title: "Orbit Relay",
    description: "Time each launch, catch the next relay, and keep the orbital chain alive as the window tightens.",
    lane: "Play",
    category: "Arcade",
    status: "prototype",
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

export function getGameMetadata(slug: string): GameMetadata | undefined {
  return gameRegistry.find((game) => game.slug === slug);
}

export function getPublicGames(): GameMetadata[] {
  return gameRegistry.filter((game) => game.status !== "diagnostic");
}

export function getRelatedGames(slug: string, limit = 3): GameMetadata[] {
  const current = getGameMetadata(slug);
  if (!current || limit <= 0) return [];

  const candidates = getPublicGames().filter((game) => game.slug !== slug);
  const sameLane = candidates.filter((game) => game.lane === current.lane);
  const otherLane = candidates.filter((game) => game.lane !== current.lane);
  return [...sameLane, ...otherLane].slice(0, limit);
}
