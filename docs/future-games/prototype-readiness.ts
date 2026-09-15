export type FuturePrototypeKind = "realtime-arcade" | "daily-puzzle" | "round-simulation" | "scenario-simulation";

export type FuturePrototypeReadiness = {
  slug: string;
  kind: FuturePrototypeKind;
  deterministicLogic: boolean;
  balanceGate: boolean;
  sessionAdapter: boolean;
  analyticsContract: boolean;
  publicRoute: boolean;
};

export const futurePrototypeReadiness: readonly FuturePrototypeReadiness[] = [
  { slug: "traffic-control", kind: "realtime-arcade", deterministicLogic: true, balanceGate: true, sessionAdapter: true, analyticsContract: true, publicRoute: false },
  { slug: "switchyard-daily", kind: "daily-puzzle", deterministicLogic: true, balanceGate: true, sessionAdapter: true, analyticsContract: true, publicRoute: false },
  { slug: "market-maker", kind: "round-simulation", deterministicLogic: true, balanceGate: true, sessionAdapter: true, analyticsContract: true, publicRoute: false },
  { slug: "supply-chain-shock", kind: "scenario-simulation", deterministicLogic: true, balanceGate: true, sessionAdapter: true, analyticsContract: true, publicRoute: false },
  { slug: "chip-fab", kind: "scenario-simulation", deterministicLogic: true, balanceGate: true, sessionAdapter: true, analyticsContract: true, publicRoute: false },
  { slug: "power-grid-dispatcher", kind: "scenario-simulation", deterministicLogic: true, balanceGate: true, sessionAdapter: true, analyticsContract: true, publicRoute: false },
] as const;
