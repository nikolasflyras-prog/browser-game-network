export type Cell = { x: number; y: number };

export type LinebreakPuzzle = {
  id: string;
  width: number;
  height: number;
  start: Cell;
  exit: Cell;
  key: Cell;
  gate: Cell;
  hazards: readonly Cell[];
  inkLimit: number;
};

export type RouteState = {
  path: Cell[];
  hasKey: boolean;
  passedGate: boolean;
  completed: boolean;
};

export type MoveResult =
  | { accepted: true; state: RouteState; action: "extend" | "backtrack" }
  | {
      accepted: false;
      state: RouteState;
      reason: "out-of-bounds" | "non-adjacent" | "hazard" | "locked-gate" | "revisit" | "ink-limit" | "completed";
    };

const cell = (x: number, y: number): Cell => ({ x, y });

export const linebreakPuzzles: readonly LinebreakPuzzle[] = [
  {
    id: "switchback",
    width: 6,
    height: 6,
    start: cell(0, 2),
    exit: cell(5, 2),
    key: cell(2, 1),
    gate: cell(4, 2),
    hazards: [cell(1, 2), cell(2, 2), cell(4, 1), cell(4, 3), cell(5, 3)],
    inkLimit: 8,
  },
  {
    id: "northbound",
    width: 6,
    height: 6,
    start: cell(0, 4),
    exit: cell(5, 0),
    key: cell(1, 2),
    gate: cell(3, 1),
    hazards: [cell(1, 4), cell(2, 3), cell(3, 2), cell(3, 0), cell(5, 1)],
    inkLimit: 10,
  },
  {
    id: "dogleg",
    width: 6,
    height: 6,
    start: cell(1, 5),
    exit: cell(5, 1),
    key: cell(3, 4),
    gate: cell(4, 2),
    hazards: [cell(1, 4), cell(3, 5), cell(4, 4), cell(3, 2), cell(5, 2)],
    inkLimit: 9,
  },
  {
    id: "reverse-line",
    width: 6,
    height: 6,
    start: cell(5, 5),
    exit: cell(0, 1),
    key: cell(4, 3),
    gate: cell(2, 2),
    hazards: [cell(4, 5), cell(5, 3), cell(2, 3), cell(2, 1), cell(0, 2)],
    inkLimit: 10,
  },
  {
    id: "long-turn",
    width: 6,
    height: 6,
    start: cell(0, 0),
    exit: cell(5, 5),
    key: cell(2, 2),
    gate: cell(3, 4),
    hazards: [cell(0, 1), cell(2, 0), cell(3, 2), cell(4, 3), cell(5, 4)],
    inkLimit: 11,
  },
] as const;

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function cellKey(value: Cell): string {
  return `${value.x},${value.y}`;
}

export function isAdjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

export function isInsidePuzzle(value: Cell, puzzle: LinebreakPuzzle): boolean {
  return value.x >= 0 && value.y >= 0 && value.x < puzzle.width && value.y < puzzle.height;
}

export function initialRouteState(puzzle: LinebreakPuzzle): RouteState {
  return {
    path: [{ ...puzzle.start }],
    hasKey: sameCell(puzzle.start, puzzle.key),
    passedGate: sameCell(puzzle.start, puzzle.gate),
    completed: false,
  };
}

function deriveState(path: Cell[], puzzle: LinebreakPuzzle): RouteState {
  const hasKey = path.some((value) => sameCell(value, puzzle.key));
  const gateIndex = path.findIndex((value) => sameCell(value, puzzle.gate));
  const keyIndex = path.findIndex((value) => sameCell(value, puzzle.key));
  const passedGate = gateIndex >= 0 && keyIndex >= 0 && keyIndex < gateIndex;
  const completed = passedGate && sameCell(path[path.length - 1], puzzle.exit);
  return { path, hasKey, passedGate, completed };
}

export function routeSegments(state: RouteState): number {
  return Math.max(0, state.path.length - 1);
}

export function tryMove(state: RouteState, next: Cell, puzzle: LinebreakPuzzle): MoveResult {
  if (state.completed) return { accepted: false, state, reason: "completed" };
  if (!isInsidePuzzle(next, puzzle)) return { accepted: false, state, reason: "out-of-bounds" };

  const current = state.path[state.path.length - 1];
  if (!isAdjacent(current, next)) return { accepted: false, state, reason: "non-adjacent" };

  const previous = state.path[state.path.length - 2];
  if (previous && sameCell(previous, next)) {
    const path = state.path.slice(0, -1);
    return { accepted: true, state: deriveState(path, puzzle), action: "backtrack" };
  }

  if (puzzle.hazards.some((hazard) => sameCell(hazard, next))) {
    return { accepted: false, state, reason: "hazard" };
  }

  if (sameCell(next, puzzle.gate) && !state.hasKey) {
    return { accepted: false, state, reason: "locked-gate" };
  }

  if (state.path.some((visited) => sameCell(visited, next))) {
    return { accepted: false, state, reason: "revisit" };
  }

  if (routeSegments(state) + 1 > puzzle.inkLimit) {
    return { accepted: false, state, reason: "ink-limit" };
  }

  const path = [...state.path, { ...next }];
  return { accepted: true, state: deriveState(path, puzzle), action: "extend" };
}

export function puzzleForDateKey(dateKey: string): LinebreakPuzzle {
  let hash = 2166136261;
  for (const character of dateKey) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const index = (hash >>> 0) % linebreakPuzzles.length;
  return linebreakPuzzles[index];
}

export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
