import type { GameEventName } from "@/games/_shared/types/runtime";

export type FutureAnalyticsEventContract = {
  event: GameEventName;
  when: string;
  properties: readonly string[];
};

export type FutureGameAnalyticsContract = {
  slug: string;
  primarySignal: string;
  events: readonly FutureAnalyticsEventContract[];
};

export const futureGameAnalyticsContracts: readonly FutureGameAnalyticsContract[] = [
  {
    slug: "traffic-control",
    primarySignal: "restart rate and runs per session",
    events: [
      { event: "game_started", when: "run begins", properties: ["seed", "session_run_index"] },
      { event: "game_action", when: "signal switch requested", properties: ["action", "tick", "phase", "ns_queue", "ew_queue"] },
      { event: "game_over", when: "gridlock ends a run", properties: ["reason", "score", "ticks", "switches", "peak_pressure"] },
      { event: "game_restarted", when: "restart control is used", properties: ["session_run_index"] },
    ],
  },
  {
    slug: "switchyard-daily",
    primarySignal: "day-2/day-7 return and daily completion",
    events: [
      { event: "daily_started", when: "daily seed begins", properties: ["daily_id", "seed"] },
      { event: "level_completed", when: "a train route resolves", properties: ["turn", "action", "target", "actual", "correct", "strikes"] },
      { event: "daily_completed", when: "daily ends", properties: ["score", "strikes", "won", "sequence", "duration_ms", "saved_best"] },
      { event: "game_completed", when: "daily runtime reaches a terminal state", properties: ["mode", "score", "won"] },
      { event: "game_restarted", when: "daily is replayed", properties: ["mode", "daily_id", "input_type"] },
      { event: "share_clicked", when: "result copy is requested", properties: ["score", "streak", "won", "method"] },
    ],
  },
  {
    slug: "market-maker",
    primarySignal: "completion plus repeat sessions",
    events: [
      { event: "game_started", when: "dealer session begins", properties: ["seed", "rounds"] },
      { event: "level_completed", when: "quote round resolves", properties: ["round", "posture", "bid", "ask", "inventory_before", "inventory_after", "round_score"] },
      { event: "game_completed", when: "dealer session ends", properties: ["score", "ending_inventory", "raw_pnl", "duration_ms"] },
      { event: "game_restarted", when: "dealer starts another run", properties: ["previous_score"] },
    ],
  },
  {
    slug: "supply-chain-shock",
    primarySignal: "completion and high-intent search/classroom engagement",
    events: [
      { event: "game_started", when: "scenario pack begins", properties: ["pack", "version"] },
      { event: "level_completed", when: "operating response resolves", properties: ["step", "choice", "score_delta", "cash", "service", "inventory", "resilience", "backlog"] },
      { event: "game_action", when: "player taps an unavailable response", properties: ["action", "step", "choice", "reason"] },
      { event: "game_completed", when: "scenario pack ends", properties: ["score", "style", "duration_ms"] },
      { event: "game_restarted", when: "scenario pack is replayed", properties: ["previous_score"] },
    ],
  },
  {
    slug: "chip-fab",
    primarySignal: "completion and differentiated technical discovery",
    events: [
      { event: "game_started", when: "fab ramp begins", properties: ["pack", "version"] },
      { event: "level_completed", when: "fab response resolves", properties: ["step", "choice", "score_delta", "yield", "throughput", "cycle_time", "defect_risk", "cash"] },
      { event: "game_action", when: "player taps an unavailable response", properties: ["action", "step", "choice", "reason"] },
      { event: "game_completed", when: "fab ramp ends", properties: ["score", "style", "duration_ms"] },
      { event: "game_restarted", when: "fab ramp is replayed", properties: ["previous_score"] },
    ],
  },
  {
    slug: "power-grid-dispatcher",
    primarySignal: "completion with comprehension of reliability tradeoffs",
    events: [
      { event: "game_started", when: "dispatch day begins", properties: ["pack", "version"] },
      { event: "level_completed", when: "dispatch response resolves", properties: ["step", "choice", "score_delta", "reliability", "reserve", "storage", "cost", "emissions"] },
      { event: "game_action", when: "player taps an unavailable response", properties: ["action", "step", "choice", "reason"] },
      { event: "game_completed", when: "dispatch day ends", properties: ["score", "style", "duration_ms"] },
      { event: "game_restarted", when: "dispatch day is replayed", properties: ["previous_score"] },
    ],
  },
] as const;

export function analyticsContractFor(slug: string) {
  return futureGameAnalyticsContracts.find((contract) => contract.slug === slug);
}

export function analyticsEventNamesFor(slug: string): readonly GameEventName[] {
  return analyticsContractFor(slug)?.events.map((event) => event.event) ?? [];
}
