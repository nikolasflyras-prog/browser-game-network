export type FabStationId = "lithography" | "etch" | "metrology";
export type FabStartMode = "hold" | "steady" | "push";
export type FabEventId = "ramp" | "metrology-drift" | "lithography-bottleneck" | "maintenance-risk";

export type LiveFabStation = {
  queue: number;
  health: number;
  maintenanceTicks: number;
};

export type LiveFabStations = Record<FabStationId, LiveFabStation>;

export type LiveFabHistoryEntry = {
  tick: number;
  eventId: FabEventId;
  starts: number;
  completed: number;
  goodDie: number;
  scrap: number;
  totalWip: number;
  yieldRate: number;
  score: number;
};

export type LiveChipFabState = {
  tick: number;
  maxTicks: number;
  startMode: FabStartMode;
  focus: FabStationId;
  stations: LiveFabStations;
  completedWafers: number;
  goodDie: number;
  scrap: number;
  cash: number;
  score: number;
  eventId: FabEventId;
  eventLabel: string;
  eventDetail: string;
  complete: boolean;
  history: readonly LiveFabHistoryEntry[];
};

export type LiveFabResult = {
  score: number;
  style: "balanced-ramp" | "overdriven" | "process-first" | "maintenance-heavy" | "bottlenecked";
  goodDie: number;
  yieldRate: number;
  endingWip: number;
  scrap: number;
  cash: number;
};

const stationOrder: readonly FabStationId[] = ["lithography", "etch", "metrology"];
const baseCapacity: Record<FabStationId, number> = { lithography: 7, etch: 8, metrology: 9 };
const startRates: Record<FabStartMode, number> = { hold: 3, steady: 6, push: 9 };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function cloneStations(stations: LiveFabStations): LiveFabStations {
  return {
    lithography: { ...stations.lithography },
    etch: { ...stations.etch },
    metrology: { ...stations.metrology },
  };
}

export function fabEventForTick(tick: number) {
  if (tick < 8) return {
    eventId: "ramp" as const,
    eventLabel: "Volume ramp",
    eventDetail: "Customer pull is rising. Add starts carefully: high utilization can create WIP faster than the line can clear it.",
  };
  if (tick < 16) return {
    eventId: "metrology-drift" as const,
    eventLabel: "Metrology drift",
    eventDetail: "Inline measurements are drifting. Metrology capacity and tool health now matter before final yield visibly falls.",
  };
  if (tick < 24) return {
    eventId: "lithography-bottleneck" as const,
    eventLabel: "Lithography bottleneck",
    eventDetail: "A lithography constraint is building queue time. Crew focus can create temporary capacity, but pushing starts still feeds the bottleneck.",
  };
  return {
    eventId: "maintenance-risk" as const,
    eventLabel: "Etch maintenance risk",
    eventDetail: "Etch health is deteriorating late in the run. Planned downtime costs output now but protects yield and future flow.",
  };
}

function capacityFor(station: FabStationId, tick: number, focus: FabStationId, health: number, maintenanceTicks: number) {
  if (maintenanceTicks > 0) return 0;
  let capacity = baseCapacity[station];
  if (tick >= 8 && tick < 16 && station === "metrology") capacity -= 2;
  if (tick >= 16 && tick < 24 && station === "lithography") capacity -= 2;
  if (tick >= 24 && station === "etch") capacity -= 2;
  if (focus === station) capacity += 3;
  const healthFactor = health < 45 ? 0.55 : health < 65 ? 0.75 : health < 80 ? 0.9 : 1;
  return Math.max(0, Math.floor(capacity * healthFactor));
}

function totalWip(stations: LiveFabStations) {
  return stationOrder.reduce((sum, station) => sum + stations[station].queue, 0);
}

function averageHealth(stations: LiveFabStations) {
  return stationOrder.reduce((sum, station) => sum + stations[station].health, 0) / stationOrder.length;
}

function calculateScore(state: Pick<LiveChipFabState, "goodDie" | "scrap" | "cash" | "stations" | "tick" | "maxTicks">) {
  const produced = state.goodDie + state.scrap;
  const yieldRate = produced > 0 ? (state.goodDie / produced) * 100 : 100;
  const throughputTarget = Math.max(1, state.maxTicks * 5.4);
  const throughputScore = clamp((state.goodDie / throughputTarget) * 100, 0, 100);
  const flowScore = clamp(100 - totalWip(state.stations) * 2.2, 0, 100);
  const healthScore = averageHealth(state.stations);
  const cashScore = clamp(state.cash, 0, 100);
  return Math.round(throughputScore * 0.38 + yieldRate * 0.25 + flowScore * 0.15 + healthScore * 0.12 + cashScore * 0.1);
}

export function createLiveChipFabState(maxTicks = 32): LiveChipFabState {
  const event = fabEventForTick(0);
  const stations: LiveFabStations = {
    lithography: { queue: 0, health: 92, maintenanceTicks: 0 },
    etch: { queue: 0, health: 92, maintenanceTicks: 0 },
    metrology: { queue: 0, health: 92, maintenanceTicks: 0 },
  };
  return {
    tick: 0,
    maxTicks,
    startMode: "steady",
    focus: "lithography",
    stations,
    completedWafers: 0,
    goodDie: 0,
    scrap: 0,
    cash: 82,
    score: calculateScore({ goodDie: 0, scrap: 0, cash: 82, stations, tick: 0, maxTicks }),
    ...event,
    complete: false,
    history: [],
  };
}

export function updateLiveFabControls(state: LiveChipFabState, patch: { startMode?: FabStartMode; focus?: FabStationId }) {
  if (state.complete) return state;
  return { ...state, ...patch };
}

export function scheduleFabMaintenance(state: LiveChipFabState, station: FabStationId): LiveChipFabState {
  if (state.complete || state.stations[station].maintenanceTicks > 0 || state.cash < 5) return state;
  const stations = cloneStations(state.stations);
  stations[station] = { ...stations[station], maintenanceTicks: 2 };
  const next = { ...state, stations, cash: round1(state.cash - 5) };
  return { ...next, score: calculateScore(next) };
}

function applyScriptedShock(stations: LiveFabStations, tick: number) {
  if (tick === 8) stations.metrology.health = clamp(stations.metrology.health - 18, 0, 100);
  if (tick === 16) stations.lithography.health = clamp(stations.lithography.health - 22, 0, 100);
  if (tick === 24) stations.etch.health = clamp(stations.etch.health - 25, 0, 100);
}

export function advanceLiveChipFab(state: LiveChipFabState): LiveChipFabState {
  if (state.complete) return state;
  const stations = cloneStations(state.stations);
  applyScriptedShock(stations, state.tick);

  const starts = startRates[state.startMode];
  stations.lithography.queue += starts;

  const processed: Record<FabStationId, number> = { lithography: 0, etch: 0, metrology: 0 };
  for (const station of stationOrder) {
    const current = stations[station];
    const capacity = capacityFor(station, state.tick, state.focus, current.health, current.maintenanceTicks);
    processed[station] = Math.min(current.queue, capacity);
    current.queue -= processed[station];
    if (station === "lithography") stations.etch.queue += processed[station];
    else if (station === "etch") stations.metrology.queue += processed[station];
  }

  const completed = processed.metrology;
  const wipBeforeWear = totalWip(stations);
  const avgHealthBeforeWear = averageHealth(stations);
  const startPressure = state.startMode === "push" ? 4 : state.startMode === "steady" ? 1 : -1;
  const yieldRate = clamp(72 + avgHealthBeforeWear * 0.25 - wipBeforeWear * 0.18 - Math.max(0, startPressure), 45, 98);
  const goodThisTick = completed * (yieldRate / 100);
  const scrapThisTick = completed - goodThisTick;

  for (const station of stationOrder) {
    const current = stations[station];
    if (current.maintenanceTicks > 0) {
      current.maintenanceTicks -= 1;
      if (current.maintenanceTicks === 0) current.health = 98;
      continue;
    }
    const utilizationWear = processed[station] * 0.22;
    const pushWear = state.startMode === "push" ? 0.7 : state.startMode === "steady" ? 0.25 : 0;
    const focusRelief = state.focus === station ? 0.35 : 0;
    current.health = clamp(current.health - 0.65 - utilizationWear - pushWear + focusRelief, 0, 100);
  }

  const goodDie = state.goodDie + goodThisTick;
  const scrap = state.scrap + scrapThisTick;
  const completedWafers = state.completedWafers + completed;
  const cash = clamp(state.cash + goodThisTick * 0.32 - starts * 0.08 - scrapThisTick * 0.18, 0, 100);
  const nextTick = state.tick + 1;
  const complete = nextTick >= state.maxTicks;
  const nextEvent = fabEventForTick(complete ? state.maxTicks - 1 : nextTick);
  const nextBase = {
    ...state,
    ...nextEvent,
    tick: nextTick,
    stations,
    completedWafers: round1(completedWafers),
    goodDie: round1(goodDie),
    scrap: round1(scrap),
    cash: round1(cash),
    complete,
  };
  const score = calculateScore(nextBase);
  const entry: LiveFabHistoryEntry = {
    tick: nextTick,
    eventId: fabEventForTick(state.tick).eventId,
    starts,
    completed,
    goodDie: round1(goodThisTick),
    scrap: round1(scrapThisTick),
    totalWip: totalWip(stations),
    yieldRate: round1(yieldRate),
    score,
  };

  return { ...nextBase, score, history: [...state.history, entry] };
}

export function liveFabSignals(state: LiveChipFabState) {
  const wip = totalWip(state.stations);
  const avgHealth = averageHealth(state.stations);
  const produced = state.goodDie + state.scrap;
  const yieldRate = produced > 0 ? (state.goodDie / produced) * 100 : 100;
  const bottleneck = [...stationOrder].sort((a, b) => state.stations[b].queue - state.stations[a].queue)[0];
  const flowState = wip >= 42 ? "high" : wip >= 22 ? "watch" : "controlled";
  const processState = avgHealth < 58 ? "high" : avgHealth < 76 ? "watch" : "controlled";
  return { totalWip: wip, averageHealth: round1(avgHealth), yieldRate: round1(yieldRate), bottleneck, flowState, processState } as const;
}

export function liveFabResult(state: LiveChipFabState): LiveFabResult | null {
  if (!state.complete) return null;
  const signals = liveFabSignals(state);
  const maintenanceActions = stationOrder.reduce((sum, station) => sum + Number(state.stations[station].health >= 97), 0);
  let style: LiveFabResult["style"] = "balanced-ramp";
  if (signals.totalWip >= 38) style = "bottlenecked";
  else if (signals.yieldRate < 78 && state.goodDie > state.maxTicks * 4.5) style = "overdriven";
  else if (signals.yieldRate >= 91 && state.goodDie < state.maxTicks * 3.8) style = "process-first";
  else if (maintenanceActions >= 2 && state.goodDie < state.maxTicks * 4.2) style = "maintenance-heavy";
  return {
    score: state.score,
    style,
    goodDie: round1(state.goodDie),
    yieldRate: signals.yieldRate,
    endingWip: signals.totalWip,
    scrap: round1(state.scrap),
    cash: round1(state.cash),
  };
}
