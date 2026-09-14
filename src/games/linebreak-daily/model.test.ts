import { describe, expect, it } from "vitest";
import {
  initialRouteState,
  linebreakPuzzles,
  puzzleForDateKey,
  routeSegments,
  tryMove,
  utcDateKey,
  type Cell,
  type LinebreakPuzzle,
} from "./model";

const solutions: readonly Cell[][] = [
  [
    { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
    { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
  ],
  [
    { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 },
    { x: 2, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
    { x: 4, y: 0 }, { x: 5, y: 0 },
  ],
  [
    { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 2, y: 4 }, { x: 3, y: 4 },
    { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 5, y: 1 },
  ],
  [
    { x: 5, y: 5 }, { x: 5, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 3 },
    { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 2, y: 2 }, { x: 1, y: 2 },
    { x: 1, y: 1 }, { x: 0, y: 1 },
  ],
  [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 },
    { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 4 },
    { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 5, y: 5 },
  ],
] as const;

function follow(puzzle: LinebreakPuzzle, path: readonly Cell[]) {
  let state = initialRouteState(puzzle);
  expect(path[0]).toEqual(puzzle.start);
  for (const next of path.slice(1)) {
    const result = tryMove(state, next, puzzle);
    expect(result.accepted).toBe(true);
    if (!result.accepted) throw new Error(result.reason);
    state = result.state;
  }
  return state;
}

describe("Linebreak Daily model", () => {
  it("ships five curated puzzles with known valid solutions", () => {
    expect(linebreakPuzzles).toHaveLength(5);
    linebreakPuzzles.forEach((puzzle, index) => {
      const state = follow(puzzle, solutions[index]);
      expect(state.completed).toBe(true);
      expect(state.hasKey).toBe(true);
      expect(state.passedGate).toBe(true);
      expect(routeSegments(state)).toBeLessThanOrEqual(puzzle.inkLimit);
    });
  });

  it("requires the key before the gate", () => {
    const puzzle: LinebreakPuzzle = {
      id: "gate-check",
      width: 3,
      height: 2,
      start: { x: 0, y: 0 },
      key: { x: 0, y: 1 },
      gate: { x: 1, y: 0 },
      exit: { x: 2, y: 0 },
      hazards: [],
      inkLimit: 4,
    };
    const result = tryMove(initialRouteState(puzzle), { x: 1, y: 0 }, puzzle);
    expect(result).toMatchObject({ accepted: false, reason: "locked-gate" });
  });

  it("rejects hazards, revisits, non-adjacent moves, and ink overflow", () => {
    const puzzle: LinebreakPuzzle = {
      id: "rules",
      width: 4,
      height: 3,
      start: { x: 0, y: 0 },
      key: { x: 1, y: 0 },
      gate: { x: 2, y: 0 },
      exit: { x: 3, y: 0 },
      hazards: [{ x: 0, y: 1 }],
      inkLimit: 3,
    };
    const start = initialRouteState(puzzle);
    expect(tryMove(start, { x: 0, y: 1 }, puzzle)).toMatchObject({ accepted: false, reason: "hazard" });
    expect(tryMove(start, { x: 2, y: 0 }, puzzle)).toMatchObject({ accepted: false, reason: "non-adjacent" });

    const afterKey = tryMove(start, { x: 1, y: 0 }, puzzle);
    if (!afterKey.accepted) throw new Error("expected key move");
    const afterGate = tryMove(afterKey.state, { x: 2, y: 0 }, puzzle);
    if (!afterGate.accepted) throw new Error("expected gate move");
    expect(tryMove(afterGate.state, { x: 1, y: 0 }, puzzle)).toMatchObject({ accepted: true, action: "backtrack" });

    const detour = tryMove(afterGate.state, { x: 2, y: 1 }, puzzle);
    if (!detour.accepted) throw new Error("expected detour");
    expect(tryMove(detour.state, { x: 1, y: 1 }, puzzle)).toMatchObject({ accepted: false, reason: "ink-limit" });
  });

  it("backtracking removes the last segment and recomputes key state", () => {
    const puzzle = linebreakPuzzles[0];
    let state = initialRouteState(puzzle);
    for (const next of [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]) {
      const result = tryMove(state, next, puzzle);
      if (!result.accepted) throw new Error(result.reason);
      state = result.state;
    }
    expect(state.hasKey).toBe(true);
    const backtrack = tryMove(state, { x: 1, y: 1 }, puzzle);
    expect(backtrack.accepted).toBe(true);
    if (!backtrack.accepted) return;
    expect(backtrack.action).toBe("backtrack");
    expect(backtrack.state.hasKey).toBe(false);
  });

  it("maps the same date to the same curated puzzle", () => {
    const first = puzzleForDateKey("2026-09-14");
    const second = puzzleForDateKey("2026-09-14");
    expect(second.id).toBe(first.id);
    expect(linebreakPuzzles).toContain(first);
  });

  it("creates UTC date keys", () => {
    expect(utcDateKey(new Date("2026-09-14T23:55:00-04:00"))).toBe("2026-09-15");
  });
});
