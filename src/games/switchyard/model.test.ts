import { describe, expect, it } from "vitest";
import { laneFromIndex, nextSwitchTrain, resolveSwitchTrain, switchDifficulty } from "./model";

describe("Switchyard model", () => {
  it("spawns trains deterministically", () => {
    expect(nextSwitchTrain(1234)).toEqual(nextSwitchTrain(1234));
  });

  it("ramps traffic pressure as more trains resolve", () => {
    const early = switchDifficulty(0);
    const late = switchDifficulty(20);
    expect(late.spawnMs).toBeLessThan(early.spawnMs);
    expect(late.progressPerSecond).toBeGreaterThan(early.progressPerSecond);
  });

  it("builds score and streak on correct routing", () => {
    const result = resolveSwitchTrain(20, 2, 3, "left", "left");
    expect(result.correct).toBe(true);
    expect(result.score).toBeGreaterThan(20);
    expect(result.streak).toBe(3);
    expect(result.lives).toBe(3);
  });

  it("costs a life and resets streak on a wrong route", () => {
    expect(resolveSwitchTrain(40, 5, 3, "left", "right")).toEqual({ correct: false, score: 40, streak: 0, lives: 2 });
  });

  it("cycles switch lanes in either direction", () => {
    expect(laneFromIndex(3)).toBe("left");
    expect(laneFromIndex(-1)).toBe("right");
  });
});
