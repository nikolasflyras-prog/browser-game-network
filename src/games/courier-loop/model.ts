export type CourierVec = { x: number; y: number };
export type CourierRect = { x: number; y: number; width: number; height: number };
export type CourierPhase = "delivery" | "pickup" | "gameover";
export type CourierEvent = "none" | "collision" | "delivered" | "picked_up" | "game_over";

export type CourierState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: CourierPhase;
  destinationIndex: number;
  deliveries: number;
  score: number;
  timeLeft: number;
  collisionCooldown: number;
};

export type CourierInput = { x: number; y: number };

export type CourierMap = {
  depot: CourierVec;
  destinations: CourierVec[];
  obstacles: CourierRect[];
};

const PLAYER_RADIUS = 13;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(a: CourierVec, b: CourierVec) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function circleRectCollision(x: number, y: number, radius: number, rect: CourierRect) {
  const nearestX = clamp(x, rect.x, rect.x + rect.width);
  const nearestY = clamp(y, rect.y, rect.y + rect.height);
  return Math.hypot(x - nearestX, y - nearestY) < radius;
}

export function courierMap(width: number, height: number): CourierMap {
  return {
    depot: { x: width * 0.11, y: height * 0.5 },
    destinations: [
      { x: width * 0.86, y: height * 0.18 },
      { x: width * 0.88, y: height * 0.79 },
      { x: width * 0.53, y: height * 0.13 },
      { x: width * 0.56, y: height * 0.86 },
      { x: width * 0.22, y: height * 0.2 },
      { x: width * 0.24, y: height * 0.82 },
    ],
    obstacles: [
      { x: width * 0.27, y: height * 0.3, width: width * 0.12, height: height * 0.28 },
      { x: width * 0.45, y: height * 0.18, width: width * 0.11, height: height * 0.28 },
      { x: width * 0.48, y: height * 0.62, width: width * 0.13, height: height * 0.22 },
      { x: width * 0.67, y: height * 0.34, width: width * 0.14, height: height * 0.28 },
    ],
  };
}

export function courierDifficulty(deliveries: number) {
  const safe = Math.max(0, deliveries);
  return {
    speed: 220 + Math.min(130, safe * 9),
    deliveryBonusSeconds: Math.max(4.5, 8 - safe * 0.28),
  };
}

export function courierTarget(state: CourierState, width: number, height: number): CourierVec {
  const map = courierMap(width, height);
  if (state.phase === "pickup") return map.depot;
  return map.destinations[state.destinationIndex % map.destinations.length];
}

export function createCourierState(width: number, height: number): CourierState {
  const map = courierMap(width, height);
  return {
    x: map.depot.x,
    y: map.depot.y,
    vx: 0,
    vy: 0,
    phase: "delivery",
    destinationIndex: 0,
    deliveries: 0,
    score: 0,
    timeLeft: 45,
    collisionCooldown: 0,
  };
}

export function advanceCourier(
  state: CourierState,
  input: CourierInput,
  deltaSeconds: number,
  width: number,
  height: number,
): { state: CourierState; event: CourierEvent } {
  if (state.phase === "gameover") return { state, event: "none" };
  const dt = clamp(deltaSeconds, 0, 0.05);
  const difficulty = courierDifficulty(state.deliveries);
  const magnitude = Math.hypot(input.x, input.y);
  const nx = magnitude > 1 ? input.x / magnitude : input.x;
  const ny = magnitude > 1 ? input.y / magnitude : input.y;
  const targetVx = nx * difficulty.speed;
  const targetVy = ny * difficulty.speed;
  const blend = Math.min(1, dt * 8);
  let vx = state.vx + (targetVx - state.vx) * blend;
  let vy = state.vy + (targetVy - state.vy) * blend;
  const nextX = clamp(state.x + vx * dt, PLAYER_RADIUS + 6, width - PLAYER_RADIUS - 6);
  const nextY = clamp(state.y + vy * dt, PLAYER_RADIUS + 6, height - PLAYER_RADIUS - 6);
  let x = nextX;
  let y = nextY;
  let timeLeft = Math.max(0, state.timeLeft - dt);
  let collisionCooldown = Math.max(0, state.collisionCooldown - dt);
  let event: CourierEvent = "none";

  const map = courierMap(width, height);
  if (map.obstacles.some((rect) => circleRectCollision(nextX, nextY, PLAYER_RADIUS, rect))) {
    x = state.x;
    y = state.y;
    vx *= -0.2;
    vy *= -0.2;
    if (collisionCooldown <= 0) {
      timeLeft = Math.max(0, timeLeft - 1.25);
      collisionCooldown = 0.6;
      event = "collision";
    }
  }

  let next: CourierState = {
    ...state,
    x,
    y,
    vx,
    vy,
    timeLeft,
    collisionCooldown,
  };

  if (timeLeft <= 0) {
    next = { ...next, phase: "gameover", vx: 0, vy: 0, timeLeft: 0 };
    return { state: next, event: "game_over" };
  }

  const target = courierTarget(next, width, height);
  if (distance({ x: next.x, y: next.y }, target) <= 30) {
    if (next.phase === "delivery") {
      const deliveries = next.deliveries + 1;
      const bonus = courierDifficulty(deliveries).deliveryBonusSeconds;
      next = {
        ...next,
        phase: "pickup",
        deliveries,
        score: next.score + 250 + deliveries * 30 + Math.floor(next.timeLeft * 3),
        timeLeft: Math.min(60, next.timeLeft + bonus),
        vx: 0,
        vy: 0,
      };
      event = "delivered";
    } else if (next.phase === "pickup") {
      next = {
        ...next,
        phase: "delivery",
        destinationIndex: (next.destinationIndex + 1) % map.destinations.length,
        score: next.score + 40,
        vx: 0,
        vy: 0,
      };
      event = "picked_up";
    }
  }

  return { state: next, event };
}
