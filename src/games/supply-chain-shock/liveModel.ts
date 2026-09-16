export type SupplyOrderMode = "lean" | "steady" | "buffer";
export type SupplySourceMode = "primary" | "split" | "backup";
export type SupplyFreightMode = "ocean" | "mixed" | "air";
export type SupplyLiveEventId = "supplier-warning" | "port-delay" | "demand-spike" | "supplier-failure";

export type LiveShipment = {
  id: number;
  quantity: number;
  eta: number;
  source: SupplySourceMode;
  freight: SupplyFreightMode;
};

export type LiveSupplyControls = {
  orderMode: SupplyOrderMode;
  sourceMode: SupplySourceMode;
  freightMode: SupplyFreightMode;
};

export type LiveSupplyHistoryEntry = {
  tick: number;
  eventId: SupplyLiveEventId;
  demand: number;
  fulfilled: number;
  inventoryAfter: number;
  backlogAfter: number;
  serviceAfter: number;
  ordered: number;
  leadTime: number;
  scoreAfter: number;
};

export type LiveSupplyChainState = {
  tick: number;
  maxTicks: number;
  controls: LiveSupplyControls;
  inventory: number;
  backlog: number;
  cash: number;
  totalDemand: number;
  totalFulfilled: number;
  service: number;
  score: number;
  inTransit: readonly LiveShipment[];
  expediteSpend: number;
  airTicks: number;
  backupTicks: number;
  splitTicks: number;
  eventId: SupplyLiveEventId;
  eventLabel: string;
  eventDetail: string;
  demand: number;
  complete: boolean;
  history: readonly LiveSupplyHistoryEntry[];
};

export type LiveSupplyResult = {
  score: number;
  style: "resilient-network" | "airfreight-dependent" | "lean-exposed" | "over-buffered" | "balanced-network";
  service: number;
  endingInventory: number;
  backlog: number;
  cash: number;
  expediteSpend: number;
};

const orderRates: Record<SupplyOrderMode, number> = { lean: 7, steady: 10, buffer: 13 };
const procurementCost: Record<SupplySourceMode, number> = { primary: 0.75, split: 1, backup: 1.3 };
const freightCost: Record<SupplyFreightMode, number> = { ocean: 0.12, mixed: 0.38, air: 0.72 };
const baseLeadTime: Record<SupplyFreightMode, number> = { ocean: 4, mixed: 2, air: 1 };

const demandCurves = {
  warning: [9, 9, 10, 10, 10, 11, 10, 10],
  port: [10, 11, 11, 12, 12, 11, 12, 11],
  spike: [14, 15, 16, 16, 17, 16, 15, 14],
  failure: [13, 14, 14, 13, 13, 12, 12, 11],
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function supplyEventForTick(tick: number) {
  const bounded = clamp(Math.floor(tick), 0, 31);
  const offset = bounded % 8;
  if (bounded < 8) return {
    eventId: "supplier-warning" as const,
    eventLabel: "Supplier warning",
    eventDetail: "Primary-supplier yields are wobbling. Nothing has failed yet, so resilience decisions still feel optional.",
    demand: demandCurves.warning[offset],
  };
  if (bounded < 16) return {
    eventId: "port-delay" as const,
    eventLabel: "Port congestion",
    eventDetail: "Ocean freight is backing up. Orders you launch now arrive later unless you pay for faster logistics.",
    demand: demandCurves.port[offset],
  };
  if (bounded < 24) return {
    eventId: "demand-spike" as const,
    eventLabel: "Demand spike",
    eventDetail: "A competitor recall pushes orders sharply higher. Inventory position and lead time matter more than today's on-hand stock.",
    demand: demandCurves.spike[offset],
  };
  return {
    eventId: "supplier-failure" as const,
    eventLabel: "Supplier shutdown",
    eventDetail: "The primary supplier has stopped shipping. Split and backup sourcing preserve flow; primary-only orders mostly disappear.",
    demand: demandCurves.failure[offset],
  };
}

function sourceFillFactor(source: SupplySourceMode, eventId: SupplyLiveEventId) {
  if (eventId === "supplier-warning") return source === "primary" ? 0.9 : source === "split" ? 0.98 : 1;
  if (eventId === "supplier-failure") return source === "primary" ? 0.15 : source === "split" ? 0.58 : 1;
  return 1;
}

function leadTimeFor(freight: SupplyFreightMode, eventId: SupplyLiveEventId) {
  const portPenalty = eventId === "port-delay" ? (freight === "ocean" ? 3 : freight === "mixed" ? 1 : 0) : 0;
  return baseLeadTime[freight] + portPenalty;
}

function serviceRate(totalFulfilled: number, totalDemand: number) {
  return totalDemand > 0 ? clamp((totalFulfilled / totalDemand) * 100, 0, 100) : 100;
}

function calculateScore(service: number, backlog: number, cash: number, inventory: number) {
  const backlogControl = clamp(100 - backlog * 4, 0, 100);
  const inventoryEfficiency = clamp(100 - Math.abs(inventory - 24) * 2.2, 0, 100);
  return Math.round(service * 0.5 + backlogControl * 0.2 + cash * 0.15 + inventoryEfficiency * 0.15);
}

export function createLiveSupplyChainState(maxTicks = 32): LiveSupplyChainState {
  const event = supplyEventForTick(0);
  return {
    tick: 0,
    maxTicks,
    controls: { orderMode: "steady", sourceMode: "primary", freightMode: "ocean" },
    inventory: 28,
    backlog: 0,
    cash: 70,
    totalDemand: 0,
    totalFulfilled: 0,
    service: 100,
    score: calculateScore(100, 0, 70, 28),
    inTransit: [],
    expediteSpend: 0,
    airTicks: 0,
    backupTicks: 0,
    splitTicks: 0,
    ...event,
    complete: false,
    history: [],
  };
}

export function updateLiveSupplyControls(state: LiveSupplyChainState, patch: Partial<LiveSupplyControls>): LiveSupplyChainState {
  if (state.complete) return state;
  return { ...state, controls: { ...state.controls, ...patch } };
}

export function advanceLiveSupplyChain(state: LiveSupplyChainState): LiveSupplyChainState {
  if (state.complete) return state;
  const event = supplyEventForTick(state.tick);

  let arrivals = 0;
  const inTransit: LiveShipment[] = [];
  for (const shipment of state.inTransit) {
    if (shipment.eta <= 1) arrivals += shipment.quantity;
    else inTransit.push({ ...shipment, eta: shipment.eta - 1 });
  }

  const availableInventory = state.inventory + arrivals;
  const required = event.demand + state.backlog;
  const fulfilled = Math.min(availableInventory, required);
  const inventoryAfterDemand = availableInventory - fulfilled;
  const backlog = Math.max(0, required - fulfilled);
  const totalDemand = state.totalDemand + event.demand;
  const totalFulfilled = state.totalFulfilled + fulfilled;
  const service = serviceRate(totalFulfilled, totalDemand);

  const requested = orderRates[state.controls.orderMode];
  const fillFactor = sourceFillFactor(state.controls.sourceMode, event.eventId);
  const unitCost = procurementCost[state.controls.sourceMode] + freightCost[state.controls.freightMode];
  const affordable = Math.max(0, state.cash + fulfilled * 1.25) / unitCost;
  const ordered = round1(Math.min(requested * fillFactor, affordable));
  const leadTime = leadTimeFor(state.controls.freightMode, event.eventId);
  if (ordered > 0) {
    inTransit.push({ id: state.tick + 1, quantity: ordered, eta: leadTime, source: state.controls.sourceMode, freight: state.controls.freightMode });
  }

  const orderSpend = ordered * unitCost;
  const revenue = fulfilled * 1.25;
  const cash = clamp(state.cash + revenue - orderSpend, 0, 100);
  const expediteSpend = state.expediteSpend + ordered * Math.max(0, freightCost[state.controls.freightMode] - freightCost.ocean);
  const nextTick = state.tick + 1;
  const complete = nextTick >= state.maxTicks;
  const nextEvent = supplyEventForTick(complete ? state.maxTicks - 1 : nextTick);
  const score = calculateScore(service, backlog, cash, inventoryAfterDemand);
  const entry: LiveSupplyHistoryEntry = {
    tick: nextTick,
    eventId: event.eventId,
    demand: event.demand,
    fulfilled: round1(fulfilled),
    inventoryAfter: round1(inventoryAfterDemand),
    backlogAfter: round1(backlog),
    serviceAfter: round1(service),
    ordered,
    leadTime,
    scoreAfter: score,
  };

  return {
    ...state,
    ...nextEvent,
    tick: nextTick,
    inventory: round1(inventoryAfterDemand),
    backlog: round1(backlog),
    cash: round1(cash),
    totalDemand: round1(totalDemand),
    totalFulfilled: round1(totalFulfilled),
    service: round1(service),
    score,
    inTransit,
    expediteSpend: round1(expediteSpend),
    airTicks: state.airTicks + Number(state.controls.freightMode === "air"),
    backupTicks: state.backupTicks + Number(state.controls.sourceMode === "backup"),
    splitTicks: state.splitTicks + Number(state.controls.sourceMode === "split"),
    complete,
    history: [...state.history, entry],
  };
}

export function liveSupplySignals(state: LiveSupplyChainState) {
  const inTransitUnits = state.inTransit.reduce((sum, shipment) => sum + shipment.quantity, 0);
  const inventoryPosition = state.inventory + inTransitUnits;
  const nextArrival = state.inTransit.length ? Math.min(...state.inTransit.map((shipment) => shipment.eta)) : null;
  const backlogState = state.backlog >= 18 ? "high" : state.backlog >= 7 ? "watch" : "controlled";
  const serviceState = state.service >= 94 ? "controlled" : state.service >= 84 ? "watch" : "high";
  return { inTransitUnits: round1(inTransitUnits), inventoryPosition: round1(inventoryPosition), nextArrival, backlogState, serviceState } as const;
}

export function liveSupplyResult(state: LiveSupplyChainState): LiveSupplyResult | null {
  if (!state.complete) return null;
  let style: LiveSupplyResult["style"] = "balanced-network";
  if (state.service >= 94 && state.backlog <= 6 && state.backupTicks + state.splitTicks >= 8) style = "resilient-network";
  else if (state.airTicks >= 12 || state.expediteSpend >= 45) style = "airfreight-dependent";
  else if (state.service < 82 && state.controls.orderMode === "lean") style = "lean-exposed";
  else if (state.inventory >= 45) style = "over-buffered";
  return {
    score: state.score,
    style,
    service: round1(state.service),
    endingInventory: round1(state.inventory),
    backlog: round1(state.backlog),
    cash: round1(state.cash),
    expediteSpend: round1(state.expediteSpend),
  };
}
