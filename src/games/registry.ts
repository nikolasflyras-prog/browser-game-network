export type GameLane = "Play" | "Learn";
export type GameStatus = "diagnostic" | "prototype" | "live";
export type GameMetadata = { slug: string; title: string; description: string; lane: GameLane; category: string; status: GameStatus; version: string };

export const gameRegistry: readonly GameMetadata[] = [
  { slug: "run-the-fed", title: "Run the Fed", description: "Set interest rates across eight quarters and balance inflation, employment, growth, and financial stability as shocks hit the economy.", lane: "Learn", category: "Economics Simulation", status: "live", version: "0.1.0" },
  { slug: "market-maker", title: "Market Maker", description: "Steer a live two-sided market while customer flow and fair value keep moving. Balance spread capture, informed flow, and inventory risk in real time.", lane: "Learn", category: "Finance Simulation", status: "live", version: "0.2.0" },
  { slug: "supply-chain-shock", title: "Supply Chain Shock", description: "Operate a live sourcing and logistics pipeline: change order rate, source mix, and freight speed while lead times, port delays, demand spikes, inventory, backlog, and supplier failures evolve continuously.", lane: "Learn", category: "Operations Simulation", status: "live", version: "0.2.0" },
  { slug: "chip-fab", title: "Chip Fab", description: "Run a live semiconductor line: set wafer starts, move engineering focus, schedule preventive maintenance, and manage evolving queues, bottlenecks, tool health, yield, and useful output.", lane: "Learn", category: "Semiconductor Simulation", status: "live", version: "0.2.0" },
  { slug: "power-grid-dispatcher", title: "Power Grid Dispatcher", description: "Balance a live power system as demand, renewable output, and transmission capacity move under you. Adjust firm generation, finite battery energy, and demand response in real time.", lane: "Learn", category: "Energy Systems Simulation", status: "live", version: "0.2.0" },
  { slug: "linebreak-daily", title: "Linebreak Daily", description: "Draw one continuous route through the daily grid. Find the key, cross the gate, avoid hazards, and reach the exit before your ink runs out.", lane: "Play", category: "Daily Puzzle", status: "live", version: "0.1.0" },
  { slug: "orbit-relay", title: "Orbit Relay", description: "Time each launch, catch the next relay, and keep the orbital chain alive as the window tightens.", lane: "Play", category: "Timing", status: "live", version: "0.1.0" },
  { slug: "vector-drift", title: "Vector Drift", description: "Steer through a continuously accelerating gate field. Thread shrinking gaps, survive near misses, and keep the drift alive as speed builds.", lane: "Play", category: "Arcade Dodger", status: "live", version: "0.1.0" },
  { slug: "pulse-bloom", title: "Pulse Bloom", description: "Place one pulse and turn a field of moving particles into a chain reaction. Clear each capture target with a single well-timed shot.", lane: "Play", category: "Chain Reaction", status: "live", version: "0.1.0" },
  { slug: "stackline", title: "Stackline", description: "Drop a moving block onto the tower below. Every overhang is cut away, every perfect drop preserves width, and the line gets faster as the stack climbs.", lane: "Play", category: "Precision Stacker", status: "live", version: "0.1.0" },
  { slug: "switchyard", title: "Switchyard", description: "Route a growing stream of numbered trains through one live junction. Set the switch before each train locks its path and protect your three lives as traffic accelerates.", lane: "Play", category: "Routing Arcade", status: "live", version: "0.1.0" },
  { slug: "rebound-rush", title: "Rebound Rush", description: "Keep a ricocheting ball alive with a shrinking paddle while clearing multi-wave target fields. Shape each rebound, build hit combos, and protect three lives as ball speed rises.", lane: "Play", category: "Paddle Arcade", status: "live", version: "0.1.0" },
  { slug: "railflip", title: "Railflip", description: "Run two parallel rails at full speed and flip between them with one input. Read approaching blockers, preserve your clean streak, and survive an accelerating obstacle stream.", lane: "Play", category: "One-Button Runner", status: "live", version: "0.1.0" },
  { slug: "courier-loop", title: "Courier Loop", description: "Drive a live top-down delivery shift. Route around buildings, hit changing destinations, return to the depot for each package, and stretch the clock with clean deliveries.", lane: "Play", category: "Top-Down Delivery", status: "live", version: "0.1.0" },
  { slug: "magnet-field", title: "Magnet Field", description: "Move a magnetic core through a drifting field and hold the attraction beam to collect scrap. The same force pulls bombs toward you, so every fast combo raises the risk.", lane: "Play", category: "Physics Collection", status: "live", version: "0.1.0" },
  { slug: "system-check", title: "System Check", description: "A Phase 0 diagnostic scene for the shared browser-game runtime.", lane: "Play", category: "Diagnostic", status: "diagnostic", version: "0.1.0" },
] as const;

export const publicGameRegistry = gameRegistry.filter((game) => game.status !== "diagnostic");
export function getGameMetadata(slug: string): GameMetadata | undefined { return gameRegistry.find((game) => game.slug === slug); }
export function getRelatedGames(slug: string, limit = 3): GameMetadata[] {
  const current = getGameMetadata(slug); if (!current) return [];
  return publicGameRegistry.filter((game) => game.slug !== slug).sort((a, b) => { const aScore = Number(a.lane === current.lane) + Number(a.category === current.category); const bScore = Number(b.lane === current.lane) + Number(b.category === current.category); return bScore - aScore; }).slice(0, limit);
}
