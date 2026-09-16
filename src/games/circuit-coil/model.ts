export type CoilDirection = "up" | "down" | "left" | "right";
export type CoilCell = { x: number; y: number };
export type CircuitCoilState = {
  body: CoilCell[];
  direction: CoilDirection;
  queuedDirection: CoilDirection;
  food: CoilCell;
  seed: number;
  score: number;
  steps: number;
  mode: "playing" | "gameover";
};
export type CoilEvent = "none" | "food" | "game_over";

const opposite: Record<CoilDirection, CoilDirection> = { up: "down", down: "up", left: "right", right: "left" };
const delta: Record<CoilDirection, CoilCell> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
function random(seed: number) { const next = (seed * 1664525 + 1013904223) >>> 0; return { seed: next, value: next / 0xffffffff }; }
function same(a: CoilCell, b: CoilCell) { return a.x === b.x && a.y === b.y; }

function spawnFood(seed: number, body: CoilCell[], columns: number, rows: number): { seed: number; food: CoilCell } {
  let current = seed;
  for (let attempt = 0; attempt < 256; attempt += 1) {
    const rx = random(current); current = rx.seed; const ry = random(current); current = ry.seed;
    const food = { x: Math.floor(rx.value * columns), y: Math.floor(ry.value * rows) };
    if (!body.some((cell) => same(cell, food))) return { seed: current, food };
  }
  for (let y = 0; y < rows; y += 1) for (let x = 0; x < columns; x += 1) if (!body.some((cell) => cell.x === x && cell.y === y)) return { seed: current, food: { x, y } };
  return { seed: current, food: body[0] };
}

export function coilStepSeconds(score: number) { return Math.max(0.07, 0.155 - Math.max(0, score) * 0.0045); }

export function createCircuitCoilState(columns = 26, rows = 18, seed = 91): CircuitCoilState {
  const cx = Math.floor(columns / 2); const cy = Math.floor(rows / 2);
  const body = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
  const spawned = spawnFood(seed >>> 0, body, columns, rows);
  return { body, direction: "right", queuedDirection: "right", food: spawned.food, seed: spawned.seed, score: 0, steps: 0, mode: "playing" };
}

export function queueCoilDirection(state: CircuitCoilState, direction: CoilDirection): CircuitCoilState {
  if (opposite[state.direction] === direction) return state;
  return { ...state, queuedDirection: direction };
}

export function advanceCircuitCoil(state: CircuitCoilState, columns = 26, rows = 18): { state: CircuitCoilState; event: CoilEvent } {
  if (state.mode === "gameover") return { state, event: "none" };
  const direction = opposite[state.direction] === state.queuedDirection ? state.direction : state.queuedDirection;
  const move = delta[direction]; const head = state.body[0]; const nextHead = { x: head.x + move.x, y: head.y + move.y };
  if (nextHead.x < 0 || nextHead.x >= columns || nextHead.y < 0 || nextHead.y >= rows) return { state: { ...state, direction, queuedDirection: direction, mode: "gameover", steps: state.steps + 1 }, event: "game_over" };
  const eating = same(nextHead, state.food);
  const collisionBody = eating ? state.body : state.body.slice(0, -1);
  if (collisionBody.some((cell) => same(cell, nextHead))) return { state: { ...state, direction, queuedDirection: direction, mode: "gameover", steps: state.steps + 1 }, event: "game_over" };
  const body = [nextHead, ...state.body]; if (!eating) body.pop();
  if (!eating) return { state: { ...state, body, direction, queuedDirection: direction, steps: state.steps + 1 }, event: "none" };
  const score = state.score + 1; const spawned = spawnFood(state.seed, body, columns, rows);
  return { state: { ...state, body, direction, queuedDirection: direction, food: spawned.food, seed: spawned.seed, score, steps: state.steps + 1 }, event: "food" };
}
