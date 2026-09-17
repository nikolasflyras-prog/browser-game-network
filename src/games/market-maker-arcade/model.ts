export type MarketSide = "buy" | "sell";
export type MarketFloorMode = "playing" | "complete" | "gameover";
export type VenueId = "alpha" | "beta" | "gamma";
export type MarketFloorEvent = "none" | "collision" | "order_spawned" | "order_missed" | "picked_up" | "filled" | "rejected" | "hedged" | "shock" | "complete" | "game_over";

export type MarketOrder = {
  id: number;
  side: MarketSide;
  size: number;
  x: number;
  y: number;
  timeLeft: number;
};

export type MarketVenue = {
  id: VenueId;
  label: string;
  x: number;
  y: number;
  spread: number;
  fillChance: number;
};

export type MarketFloorInput = { x: number; y: number; dash: boolean };

export type MarketFloorState = {
  playerX: number;
  playerY: number;
  vx: number;
  vy: number;
  dashEnergy: number;
  fairValue: number;
  cash: number;
  inventory: number;
  riskCost: number;
  reputation: number;
  timeLeft: number;
  elapsed: number;
  completed: number;
  missed: number;
  combo: number;
  orders: MarketOrder[];
  carried: MarketOrder | null;
  spawnTimer: number;
  marketAccumulator: number;
  nextShockIn: number;
  shockTimeLeft: number;
  shockStrength: number;
  shockLabel: string | null;
  seed: number;
  nextOrderId: number;
  interactionCooldown: number;
  mode: MarketFloorMode;
};

export const MARKET_WORLD = { width: 1000, height: 640 } as const;
export const MARKET_SESSION_SECONDS = 210;
export const MARKET_PLAYER_RADIUS = 16;

export const marketFloorLayout = {
  clientSpots: [
    { x: 185, y: 145 },
    { x: 185, y: 320 },
    { x: 185, y: 495 },
  ],
  hedge: { x: 500, y: 505 },
  venues: [
    { id: "alpha", label: "ALPHA", x: 805, y: 145, spread: 0.55, fillChance: 1 },
    { id: "beta", label: "BETA", x: 805, y: 320, spread: 1.05, fillChance: 0.84 },
    { id: "gamma", label: "GAMMA", x: 805, y: 495, spread: 1.7, fillChance: 0.62 },
  ] satisfies MarketVenue[],
  obstacles: [
    { x: 52, y: 92, width: 92, height: 106 },
    { x: 52, y: 267, width: 92, height: 106 },
    { x: 52, y: 442, width: 92, height: 106 },
    { x: 856, y: 92, width: 92, height: 106 },
    { x: 856, y: 267, width: 92, height: 106 },
    { x: 856, y: 442, width: 92, height: 106 },
    { x: 325, y: 155, width: 150, height: 82 },
    { x: 525, y: 155, width: 150, height: 82 },
    { x: 325, y: 348, width: 150, height: 82 },
    { x: 525, y: 348, width: 150, height: 82 },
    { x: 447, y: 545, width: 106, height: 58 },
  ],
} as const;

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function distance(ax: number, ay: number, bx: number, by: number) { return Math.hypot(ax - bx, ay - by); }
function random(seed: number) { const next = (seed * 1664525 + 1013904223) >>> 0; return { seed: next, value: next / 0xffffffff }; }

function circleRectCollision(x: number, y: number, radius: number, rect: { x: number; y: number; width: number; height: number }) {
  const nearestX = clamp(x, rect.x, rect.x + rect.width);
  const nearestY = clamp(y, rect.y, rect.y + rect.height);
  return Math.hypot(x - nearestX, y - nearestY) < radius;
}

export function marketFloorQuote(state: Pick<MarketFloorState, "fairValue">, venueId: VenueId) {
  const venue = marketFloorLayout.venues.find((item) => item.id === venueId) ?? marketFloorLayout.venues[0];
  return { bid: state.fairValue - venue.spread / 2, ask: state.fairValue + venue.spread / 2, venue };
}

export function marketFloorPnl(state: Pick<MarketFloorState, "cash" | "inventory" | "fairValue">) {
  return state.cash + state.inventory * state.fairValue;
}

export function scoreMarketFloor(state: Pick<MarketFloorState, "cash" | "inventory" | "fairValue" | "completed" | "combo" | "reputation" | "riskCost" | "missed">) {
  const pnl = marketFloorPnl(state);
  return Math.round(250 + pnl * 20 + state.completed * 115 + state.combo * 18 + state.reputation * 2 - state.riskCost * 38 - state.missed * 85);
}

function spawnOrder(state: MarketFloorState): MarketFloorState {
  let nextSeed = state.seed;
  const sideRoll = random(nextSeed); nextSeed = sideRoll.seed;
  const sizeRoll = random(nextSeed); nextSeed = sizeRoll.seed;
  const deskRoll = random(nextSeed); nextSeed = deskRoll.seed;
  const timerRoll = random(nextSeed); nextSeed = timerRoll.seed;
  const desk = marketFloorLayout.clientSpots[Math.floor(deskRoll.value * marketFloorLayout.clientSpots.length) % marketFloorLayout.clientSpots.length];
  const order: MarketOrder = {
    id: state.nextOrderId,
    side: sideRoll.value < 0.5 ? "buy" : "sell",
    size: 1 + Math.floor(sizeRoll.value * 4),
    x: desk.x,
    y: desk.y,
    timeLeft: 10 + timerRoll.value * 5,
  };
  const cadenceRoll = random(nextSeed); nextSeed = cadenceRoll.seed;
  const cadence = Math.max(2.2, 4.8 - state.elapsed * 0.01) + cadenceRoll.value * 1.15;
  return { ...state, orders: [...state.orders, order], seed: nextSeed, nextOrderId: state.nextOrderId + 1, spawnTimer: cadence };
}

export function createMarketFloorState(seed = 9127): MarketFloorState {
  return {
    playerX: MARKET_WORLD.width / 2,
    playerY: MARKET_WORLD.height / 2,
    vx: 0,
    vy: 0,
    dashEnergy: 100,
    fairValue: 100,
    cash: 0,
    inventory: 0,
    riskCost: 0,
    reputation: 100,
    timeLeft: MARKET_SESSION_SECONDS,
    elapsed: 0,
    completed: 0,
    missed: 0,
    combo: 0,
    orders: [{ id: 1, side: "buy", size: 2, x: marketFloorLayout.clientSpots[1].x, y: marketFloorLayout.clientSpots[1].y, timeLeft: 14 }],
    carried: null,
    spawnTimer: 3.4,
    marketAccumulator: 0,
    nextShockIn: 28,
    shockTimeLeft: 0,
    shockStrength: 0,
    shockLabel: null,
    seed: seed >>> 0,
    nextOrderId: 2,
    interactionCooldown: 0,
    mode: "playing",
  };
}

export function marketFloorPrompt(state: MarketFloorState): string {
  if (state.mode !== "playing") return "";
  if (state.carried) {
    for (const venue of marketFloorLayout.venues) {
      if (distance(state.playerX, state.playerY, venue.x, venue.y) <= 58) return `EXECUTE ${venue.label}`;
    }
    return `${state.carried.side.toUpperCase()} ${state.carried.size} · ROUTE TO A VENUE`;
  }
  const nearbyOrder = state.orders.find((order) => distance(state.playerX, state.playerY, order.x, order.y) <= 52);
  if (nearbyOrder) return `PICK UP ${nearbyOrder.side.toUpperCase()} ${nearbyOrder.size}`;
  if (Math.abs(state.inventory) > 0.01 && distance(state.playerX, state.playerY, marketFloorLayout.hedge.x, marketFloorLayout.hedge.y) <= 58) return "HEDGE INVENTORY";
  return "MOVE · FIND CLIENT FLOW";
}

export function interactMarketFloor(state: MarketFloorState): { state: MarketFloorState; event: MarketFloorEvent } {
  if (state.mode !== "playing" || state.interactionCooldown > 0) return { state, event: "none" };

  if (state.carried) {
    const venue = marketFloorLayout.venues.find((item) => distance(state.playerX, state.playerY, item.x, item.y) <= 58);
    if (!venue) return { state, event: "none" };
    const quote = marketFloorQuote(state, venue.id);
    const fillRoll = random(state.seed);
    if (fillRoll.value > venue.fillChance) {
      return {
        state: {
          ...state,
          seed: fillRoll.seed,
          carried: { ...state.carried, timeLeft: Math.max(1, state.carried.timeLeft - 1.15) },
          reputation: Math.max(0, state.reputation - 2),
          combo: 0,
          interactionCooldown: 0.35,
        },
        event: "rejected",
      };
    }

    const order = state.carried;
    const cash = order.side === "buy" ? state.cash + quote.ask * order.size : state.cash - quote.bid * order.size;
    const inventory = order.side === "buy" ? state.inventory - order.size : state.inventory + order.size;
    return {
      state: {
        ...state,
        seed: fillRoll.seed,
        cash,
        inventory,
        completed: state.completed + 1,
        combo: state.combo + 1,
        reputation: Math.min(100, state.reputation + 1.5),
        carried: null,
        interactionCooldown: 0.28,
      },
      event: "filled",
    };
  }

  const orderIndex = state.orders.findIndex((order) => distance(state.playerX, state.playerY, order.x, order.y) <= 52);
  if (orderIndex >= 0) {
    const orders = [...state.orders];
    const carried = orders.splice(orderIndex, 1)[0] ?? null;
    return { state: { ...state, orders, carried, interactionCooldown: 0.2 }, event: carried ? "picked_up" : "none" };
  }

  if (Math.abs(state.inventory) > 0.01 && distance(state.playerX, state.playerY, marketFloorLayout.hedge.x, marketFloorLayout.hedge.y) <= 58) {
    const quantity = Math.min(2, Math.abs(state.inventory));
    const slippage = 0.22;
    if (state.inventory > 0) {
      return { state: { ...state, inventory: state.inventory - quantity, cash: state.cash + quantity * (state.fairValue - slippage), interactionCooldown: 0.32 }, event: "hedged" };
    }
    return { state: { ...state, inventory: state.inventory + quantity, cash: state.cash - quantity * (state.fairValue + slippage), interactionCooldown: 0.32 }, event: "hedged" };
  }

  return { state, event: "none" };
}

export function advanceMarketFloor(state: MarketFloorState, input: MarketFloorInput, deltaSeconds: number): { state: MarketFloorState; event: MarketFloorEvent } {
  if (state.mode !== "playing") return { state, event: "none" };
  const dt = clamp(deltaSeconds, 0, 0.05);
  const magnitude = Math.hypot(input.x, input.y);
  const nx = magnitude > 1 ? input.x / magnitude : input.x;
  const ny = magnitude > 1 ? input.y / magnitude : input.y;
  const dashing = input.dash && state.dashEnergy > 1 && magnitude > 0.1;
  const speed = dashing ? 390 : 245;
  const blend = Math.min(1, dt * 10);
  let vx = state.vx + (nx * speed - state.vx) * blend;
  let vy = state.vy + (ny * speed - state.vy) * blend;
  let playerX = clamp(state.playerX + vx * dt, MARKET_PLAYER_RADIUS + 10, MARKET_WORLD.width - MARKET_PLAYER_RADIUS - 10);
  let playerY = clamp(state.playerY + vy * dt, MARKET_PLAYER_RADIUS + 10, MARKET_WORLD.height - MARKET_PLAYER_RADIUS - 10);
  let event: MarketFloorEvent = "none";
  if (marketFloorLayout.obstacles.some((rect) => circleRectCollision(playerX, playerY, MARKET_PLAYER_RADIUS, rect))) {
    playerX = state.playerX;
    playerY = state.playerY;
    vx *= -0.12;
    vy *= -0.12;
    event = "collision";
  }

  let dashEnergy = dashing ? state.dashEnergy - dt * 34 : state.dashEnergy + dt * 19;
  dashEnergy = clamp(dashEnergy, 0, 100);
  const elapsed = state.elapsed + dt;
  const timeLeft = Math.max(0, state.timeLeft - dt);
  const spawnTimer = state.spawnTimer - dt;
  let marketAccumulator = state.marketAccumulator + dt;
  let fairValue = state.fairValue;
  let nextShockIn = state.nextShockIn - dt;
  let shockTimeLeft = Math.max(0, state.shockTimeLeft - dt);
  let shockStrength = state.shockStrength;
  let shockLabel = state.shockLabel;
  let seed = state.seed;
  let orders = state.orders.map((order) => ({ ...order, timeLeft: order.timeLeft - dt }));
  let carried = state.carried ? { ...state.carried, timeLeft: state.carried.timeLeft - dt } : null;
  let missed = state.missed;
  let reputation = state.reputation;
  let combo = state.combo;

  const expired = orders.filter((order) => order.timeLeft <= 0).length;
  if (expired > 0) {
    orders = orders.filter((order) => order.timeLeft > 0);
    missed += expired;
    reputation = Math.max(0, reputation - expired * 14);
    combo = 0;
    if (event === "none") event = "order_missed";
  }
  if (carried && carried.timeLeft <= 0) {
    carried = null;
    missed += 1;
    reputation = Math.max(0, reputation - 18);
    combo = 0;
    if (event === "none") event = "order_missed";
  }

  if (shockTimeLeft <= 0 && shockStrength !== 0) {
    shockStrength = 0;
    shockLabel = null;
  }
  if (nextShockIn <= 0) {
    const directionRoll = random(seed); seed = directionRoll.seed;
    const sizeRoll = random(seed); seed = sizeRoll.seed;
    const waitRoll = random(seed); seed = waitRoll.seed;
    shockStrength = (directionRoll.value < 0.5 ? -1 : 1) * (0.55 + sizeRoll.value * 0.45);
    shockTimeLeft = 7.5;
    shockLabel = shockStrength > 0 ? "RISK-ON SURGE" : "SELL-OFF";
    nextShockIn = 31 + waitRoll.value * 17;
    if (event === "none") event = "shock";
  }

  while (marketAccumulator >= 0.25) {
    marketAccumulator -= 0.25;
    const noiseRoll = random(seed); seed = noiseRoll.seed;
    const noise = (noiseRoll.value - 0.5) * 0.24;
    fairValue = clamp(fairValue + noise + shockStrength * 0.075, 82, 118);
  }

  let next: MarketFloorState = {
    ...state,
    playerX,
    playerY,
    vx,
    vy,
    dashEnergy,
    fairValue,
    riskCost: state.riskCost + Math.pow(Math.abs(state.inventory), 1.35) * dt * 0.08,
    reputation,
    timeLeft,
    elapsed,
    missed,
    combo,
    orders,
    carried,
    spawnTimer,
    marketAccumulator,
    nextShockIn,
    shockTimeLeft,
    shockStrength,
    shockLabel,
    seed,
    interactionCooldown: Math.max(0, state.interactionCooldown - dt),
  };

  if (spawnTimer <= 0 && orders.length + (carried ? 1 : 0) < 6) {
    next = spawnOrder(next);
    if (event === "none") event = "order_spawned";
  }

  if (reputation <= 0) return { state: { ...next, mode: "gameover", vx: 0, vy: 0 }, event: "game_over" };
  if (timeLeft <= 0) return { state: { ...next, mode: "complete", vx: 0, vy: 0, timeLeft: 0 }, event: "complete" };
  return { state: next, event };
}
