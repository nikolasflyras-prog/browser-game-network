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
    slug: "orbit-relay",
    title: "Orbit Relay",
    description: "Time each launch, catch the next relay, and keep the orbital chain alive as the window tightens.",
    lane: "Play",
    category: "Timing",
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
