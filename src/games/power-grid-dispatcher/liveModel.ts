export type BatteryMode = "charge" | "idle" | "discharge";
export type LiveGridEventId = "morning-ramp" | "wind-drop" | "heatwave" | "transmission-outage";

export type LiveGridControls = {
  thermal: number;
  battery: BatteryMode;
  demandResponse: boolean;
};

export type LiveGridConditions = {
  eventId: LiveGridEventId;
  eventLabel: string;
  eventDetail: string;
  demand: number;
  renewables: number;
  firmCapacity: number;
};

export type LiveGridHistoryEntry = LiveGridConditions & {
  tick: number;
  thermal: number;
  batteryPower: number;
  demandResponse: number;
  supply: number;
  balance: number;
  frequency: number;
  storageAfter: number;
  reliabilityAfter: number;
  scoreAfter: number;
};

export type LivePowerGridState = LiveGridConditions & {
  tick: number;
  maxTicks: number;
  controls: LiveGridControls;
  storage: number;
  demandResponseBudget: number;
  reliability: number;
  frequency: number;
  supply: number;
  balance: number;
  score: number;
  cumulativeCost: number;
  cumulativeEmissions: number;
  energyNotServed: number;
  stabilityPoints: number;
  complete: boolean;
  history: readonly LiveGridHistoryEntry[];
};

export type LivePowerGridResult = {
  score: number;
  style: "balanced-operator" | "reliability-first" | "low-carbon" | "flexibility-spent" | "under-supplied";
  averageCost: number;
  averageEmissions: number;
  energyNotServed: number;
  storageRemaining: number;
  reliability: number;
};

const DEFAULT_MAX_TICKS = 32;
const INITIAL_STORAGE = 58;
const INITIAL_DR_BUDGET = 7;

const curves = {
  morning: {
    demand: [60, 62, 65, 68, 70, 72, 73, 74],
    renewables: [16, 17, 19, 21, 23, 25, 27, 29],
    capacity: [90, 90, 90, 90, 90, 90, 90, 90],
  },
  wind: {
    demand: [73, 75, 77, 79, 80, 81, 79, 77],
    renewables: [21, 18, 15, 11, 9, 11, 14, 18],
    capacity: [90, 90, 90, 90, 90, 90, 90, 90],
  },
  heat: {
    demand: [82, 85, 88, 91, 94, 93, 90, 87],
    renewables: [25, 26, 24, 21, 18, 16, 15, 16],
    capacity: [90, 90, 90, 90, 90, 90, 90, 90],
  },
  outage: {
    demand: [82, 84, 86, 88, 87, 85, 83, 80],
    renewables: [16, 17, 18, 19, 18, 17, 18, 20],
    capacity: [66, 66, 66, 66, 72, 72, 82, 82],
  },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function stageForTick(tick: number): { phase: 0 | 1 | 2 | 3; offset: number } {
  const bounded = clamp(Math.floor(tick), 0, DEFAULT_MAX_TICKS - 1);
  return { phase: Math.min(3, Math.floor(bounded / 8)) as 0 | 1 | 2 | 3, offset: bounded % 8 };
}

export function gridConditionsForTick(tick: number): LiveGridConditions {
  const { phase, offset } = stageForTick(tick);

  if (phase === 0) {
    return {
      eventId: "morning-ramp",
      eventLabel: "Morning ramp",
      eventDetail: "Load is climbing before solar reaches full output. Build enough firm supply without wasting flexibility too early.",
      demand: curves.morning.demand[offset],
      renewables: curves.morning.renewables[offset],
      firmCapacity: curves.morning.capacity[offset],
    };
  }

  if (phase === 1) {
    return {
      eventId: "wind-drop",
      eventLabel: "Wind forecast miss",
      eventDetail: "Renewable output is falling faster than forecast. Decide whether to ramp firm generation or spend stored energy.",
      demand: curves.wind.demand[offset],
      renewables: curves.wind.renewables[offset],
      firmCapacity: curves.wind.capacity[offset],
    };
  }

  if (phase === 2) {
    return {
      eventId: "heatwave",
      eventLabel: "Heatwave peak",
      eventDetail: "Air-conditioning demand is setting a new high. Battery energy and demand response are now valuable peak resources.",
      demand: curves.heat.demand[offset],
      renewables: curves.heat.renewables[offset],
      firmCapacity: curves.heat.capacity[offset],
    };
  }

  return {
    eventId: "transmission-outage",
    eventLabel: "Transmission outage",
    eventDetail: "A major path has tripped. Firm generation is temporarily deliverability-limited even if your setpoint is higher.",
    demand: curves.outage.demand[offset],
    renewables: curves.outage.renewables[offset],
    firmCapacity: curves.outage.capacity[offset],
  };
}

function projectedSupply(conditions: LiveGridConditions, controls: LiveGridControls, storage: number, demandResponseBudget: number) {
  const thermal = Math.min(controls.thermal, conditions.firmCapacity);
  const batteryPower = controls.battery === "discharge"
    ? Math.min(18, storage / 0.42)
    : controls.battery === "charge"
      ? -Math.min(10, (100 - storage) / 0.32)
      : 0;
  const demandResponse = controls.demandResponse && demandResponseBudget > 0 ? 9 : 0;
  const supply = thermal + conditions.renewables + batteryPower + demandResponse;
  return { thermal, batteryPower, demandResponse, supply };
}

function liveScore(
  ticks: number,
  stabilityPoints: number,
  reliability: number,
  cumulativeCost: number,
  cumulativeEmissions: number,
  storage: number,
  demandResponseBudget: number,
) {
  if (ticks <= 0) return 100;
  const averageStability = stabilityPoints / ticks;
  const averageCost = cumulativeCost / ticks;
  const averageEmissions = cumulativeEmissions / ticks;
  const costEfficiency = clamp(100 - averageCost * 5, 0, 100);
  const emissionsScore = clamp(100 - averageEmissions * 7, 0, 100);
  const flexibility = storage * 0.72 + (demandResponseBudget / INITIAL_DR_BUDGET) * 28;

  return Math.round(
    averageStability * 0.45 +
    reliability * 0.25 +
    costEfficiency * 0.12 +
    emissionsScore * 0.08 +
    flexibility * 0.1,
  );
}

export function createLivePowerGridState(maxTicks = DEFAULT_MAX_TICKS): LivePowerGridState {
  const conditions = gridConditionsForTick(0);
  const controls: LiveGridControls = { thermal: 50, battery: "idle", demandResponse: false };
  const initial = projectedSupply(conditions, controls, INITIAL_STORAGE, INITIAL_DR_BUDGET);
  const balance = initial.supply - conditions.demand;

  return {
    ...conditions,
    tick: 0,
    maxTicks,
    controls,
    storage: INITIAL_STORAGE,
    demandResponseBudget: INITIAL_DR_BUDGET,
    reliability: 100,
    frequency: round1(clamp(60 + balance * 0.018, 59.2, 60.8)),
    supply: round1(initial.supply),
    balance: round1(balance),
    score: 100,
    cumulativeCost: 0,
    cumulativeEmissions: 0,
    energyNotServed: 0,
    stabilityPoints: 0,
    complete: false,
    history: [],
  };
}

export function updateLiveGridControls(state: LivePowerGridState, patch: Partial<LiveGridControls>): LivePowerGridState {
  if (state.complete) return state;
  const nextControls: LiveGridControls = {
    ...state.controls,
    ...patch,
    thermal: clamp(patch.thermal ?? state.controls.thermal, 25, 92),
    demandResponse: state.demandResponseBudget > 0 ? (patch.demandResponse ?? state.controls.demandResponse) : false,
  };
  const projected = projectedSupply(state, nextControls, state.storage, state.demandResponseBudget);
  const balance = projected.supply - state.demand;

  return {
    ...state,
    controls: nextControls,
    supply: round1(projected.supply),
    balance: round1(balance),
    frequency: round1(clamp(60 + balance * 0.018, 59.2, 60.8)),
  };
}

export function advanceLivePowerGrid(state: LivePowerGridState): LivePowerGridState {
  if (state.complete) return state;

  const conditions = gridConditionsForTick(state.tick);
  const actual = projectedSupply(conditions, state.controls, state.storage, state.demandResponseBudget);
  const balance = actual.supply - conditions.demand;
  const shortfall = Math.max(0, -balance);
  const oversupply = Math.max(0, balance);
  const frequency = clamp(60 + balance * 0.018, 59.2, 60.8);

  const storageDelta = actual.batteryPower >= 0
    ? -actual.batteryPower * 0.42
    : -actual.batteryPower * 0.32;
  const storage = clamp(state.storage + storageDelta, 0, 100);
  const demandResponseBudget = Math.max(0, state.demandResponseBudget - (actual.demandResponse > 0 ? 1 : 0));

  const reliabilityLoss = shortfall * 0.28 + Math.max(0, shortfall - 8) * 0.35 + Math.max(0, oversupply - 18) * 0.08;
  const recovery = Math.abs(balance) <= 4 ? 0.35 : 0;
  const reliability = clamp(state.reliability - reliabilityLoss + recovery, 0, 100);

  const tickCost = actual.thermal * 0.14 + Math.max(0, actual.thermal - 65) * 0.22 + Math.abs(actual.batteryPower) * 0.03 + actual.demandResponse * 0.28;
  const tickEmissions = actual.thermal * 0.11;
  const cumulativeCost = state.cumulativeCost + tickCost;
  const cumulativeEmissions = state.cumulativeEmissions + tickEmissions;
  const energyNotServed = state.energyNotServed + shortfall;
  const tickStability = clamp(100 - Math.abs(balance) * 3.3 - shortfall * 1.6, 0, 100);
  const stabilityPoints = state.stabilityPoints + tickStability;
  const nextTick = state.tick + 1;
  const score = liveScore(nextTick, stabilityPoints, reliability, cumulativeCost, cumulativeEmissions, storage, demandResponseBudget);

  const entry: LiveGridHistoryEntry = {
    ...conditions,
    tick: nextTick,
    thermal: round1(actual.thermal),
    batteryPower: round1(actual.batteryPower),
    demandResponse: round1(actual.demandResponse),
    supply: round1(actual.supply),
    balance: round1(balance),
    frequency: round1(frequency),
    storageAfter: round1(storage),
    reliabilityAfter: round1(reliability),
    scoreAfter: score,
  };

  const complete = nextTick >= state.maxTicks;
  const nextConditions = gridConditionsForTick(complete ? state.maxTicks - 1 : nextTick);
  const nextControls = demandResponseBudget <= 0 && state.controls.demandResponse
    ? { ...state.controls, demandResponse: false }
    : state.controls;
  const nextProjection = complete
    ? actual
    : projectedSupply(nextConditions, nextControls, storage, demandResponseBudget);
  const nextBalance = complete ? balance : nextProjection.supply - nextConditions.demand;

  return {
    ...state,
    ...nextConditions,
    tick: nextTick,
    controls: nextControls,
    storage: round1(storage),
    demandResponseBudget,
    reliability: round1(reliability),
    frequency: round1(complete ? frequency : clamp(60 + nextBalance * 0.018, 59.2, 60.8)),
    supply: round1(complete ? actual.supply : nextProjection.supply),
    balance: round1(complete ? balance : nextBalance),
    score,
    cumulativeCost: round1(cumulativeCost),
    cumulativeEmissions: round1(cumulativeEmissions),
    energyNotServed: round1(energyNotServed),
    stabilityPoints: round1(stabilityPoints),
    complete,
    history: [...state.history, entry],
  };
}

export function liveGridBalanceState(balance: number) {
  const magnitude = Math.abs(balance);
  if (magnitude <= 4) return "stable" as const;
  if (magnitude <= 9) return "watch" as const;
  return "emergency" as const;
}

export function liveGridResult(state: LivePowerGridState): LivePowerGridResult | null {
  if (!state.complete) return null;
  const ticks = Math.max(1, state.tick);
  const averageCost = state.cumulativeCost / ticks;
  const averageEmissions = state.cumulativeEmissions / ticks;

  let style: LivePowerGridResult["style"] = "balanced-operator";
  if (state.energyNotServed >= 45 || state.reliability < 72) style = "under-supplied";
  else if (state.storage < 12 && state.demandResponseBudget === 0) style = "flexibility-spent";
  else if (state.reliability >= 96 && averageCost >= 10) style = "reliability-first";
  else if (averageEmissions <= 5.8 && state.energyNotServed < 20) style = "low-carbon";

  return {
    score: state.score,
    style,
    averageCost: round1(averageCost),
    averageEmissions: round1(averageEmissions),
    energyNotServed: round1(state.energyNotServed),
    storageRemaining: round1(state.storage),
    reliability: round1(state.reliability),
  };
}
