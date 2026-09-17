export type GameLane = "Play" | "Learn";
export type GameStatus = "diagnostic" | "prototype" | "live";
export type GameCollection = "Semiconductors";
export type GameMetadata = {
  slug: string;
  title: string;
  description: string;
  lane: GameLane;
  category: string;
  status: GameStatus;
  version: string;
  collection?: GameCollection;
};

export const gameRegistry: readonly GameMetadata[] = [
  { slug: "run-the-fed", title: "Run the Fed", description: "Set interest rates across eight quarters and balance inflation, employment, growth, and financial stability as shocks hit the economy.", lane: "Learn", category: "Economics Simulation", status: "live", version: "0.1.0" },
  { slug: "market-maker", title: "Market Maker", description: "Work a live trading floor: collect expiring client orders, route them to competing liquidity venues, manage dealer inventory, hedge risk, and survive market shocks until the closing bell.", lane: "Learn", category: "Finance Simulation", status: "live", version: "0.3.0" },
  { slug: "hedge-fund-floor", title: "Hedge Fund Floor", description: "Run a walkable long/short equity fund: research companies, size positions, hedge beta, hire analysts, traders, and risk staff, react to live news, and protect NAV and LP confidence through the closing bell.", lane: "Learn", category: "Hedge Fund Simulation", status: "live", version: "0.1.0" },
  { slug: "semiconductor-vc", title: "Sand Hill VC", description: "Walk a live semiconductor venture office: meet founders, run technical diligence, choose checks in investment committee, hire analysts, manage reserves, react to news, and support a moving portfolio.", lane: "Learn", category: "Semiconductor Venture", status: "live", version: "0.1.0", collection: "Semiconductors" },
  { slug: "chip-architect", title: "Chip Architect", description: "Walk a chip-design lab, carry IP blocks into a live floorplan, trade performance against power, area, and timing, run verification, and tape out customer ASICs before their design windows close.", lane: "Learn", category: "Chip Design Lab", status: "live", version: "0.1.0", collection: "Semiconductors" },
  { slug: "packaging-lab", title: "Packaging Lab", description: "Build advanced semiconductor packages by physically placing compute dies, HBM, I/O, bridges, optics, and thermal spreaders. Adjacency changes bandwidth, hotspots, warpage, and yield before X-ray inspection and shipment.", lane: "Learn", category: "Advanced Packaging Lab", status: "live", version: "0.1.0", collection: "Semiconductors" },
  { slug: "fab-floor", title: "Fab Floor", description: "Walk a semiconductor fab shift: release wafer lots, follow WIP through lithography, etch, and metrology, move engineering focus to bottlenecks, and carry maintenance kits to tool alarms before yield and cycle time deteriorate.", lane: "Learn", category: "Wafer Fab Operations", status: "live", version: "0.1.0", collection: "Semiconductors" },
  { slug: "data-center-architect", title: "Data Center Architect", description: "Build an AI data hall by physically installing compute, network, power, cooling, and storage racks. Placement changes fabric bandwidth and thermals, then live workloads and rack faults test the architecture against an SLA.", lane: "Learn", category: "AI Infrastructure", status: "live", version: "0.1.0", collection: "Semiconductors" },
  { slug: "supply-chain-shock", title: "Supply Chain Shock", description: "Operate a live sourcing and logistics pipeline: change order rate, source mix, and freight speed while lead times, port delays, demand spikes, inventory, backlog, and supplier failures evolve continuously.", lane: "Learn", category: "Operations Simulation", status: "live", version: "0.2.0" },
  { slug: "chip-fab", title: "Chip Fab", description: "Run a live semiconductor line: set wafer starts, move engineering focus, schedule preventive maintenance, and manage evolving queues, bottlenecks, tool health, yield, and useful output.", lane: "Learn", category: "Semiconductor Simulation", status: "live", version: "0.2.0", collection: "Semiconductors" },
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
  { slug: "skybound", title: "Skybound", description: "Steer an auto-bouncing climber across a rising field of platforms. Preserve momentum, land cleanly, and keep the camera climbing as gaps widen and platforms narrow.", lane: "Play", category: "Vertical Platformer", status: "live", version: "0.1.0" },
  { slug: "circuit-coil", title: "Circuit Coil", description: "Guide a growing live circuit through a tight grid. Collect power nodes, turn without reversing, and survive your own expanding trail as movement speed climbs.", lane: "Play", category: "Growing Trail", status: "live", version: "0.1.0" },
  { slug: "system-check", title: "System Check", description: "A Phase 0 diagnostic scene for the shared browser-game runtime.", lane: "Play", category: "Diagnostic", status: "diagnostic", version: "0.1.0" },
] as const;

export const publicGameRegistry = gameRegistry.filter((game) => game.status !== "diagnostic");
export function getGameMetadata(slug: string): GameMetadata | undefined { return gameRegistry.find((game) => game.slug === slug); }
export function getRelatedGames(slug: string, limit = 3): GameMetadata[] {
  const current = getGameMetadata(slug); if (!current) return [];
  return publicGameRegistry.filter((game) => game.slug !== slug).sort((a, b) => {
    const aScore = Number(a.lane === current.lane) + Number(a.category === current.category) + Number(Boolean(current.collection && a.collection === current.collection));
    const bScore = Number(b.lane === current.lane) + Number(b.category === current.category) + Number(Boolean(current.collection && b.collection === current.collection));
    return bScore - aScore;
  }).slice(0, limit);
}
