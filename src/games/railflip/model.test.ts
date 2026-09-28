import { describe, expect, it } from "vitest";
import { flipLane, nextRailObstacle, railCollision, railDifficulty, railObstacleProfile, railPassScore } from "./model";

describe("Railflip model", () => {
  it("accelerates and compresses obstacle cadence", () => {
    expect(railDifficulty(20).speed).toBeGreaterThan(railDifficulty(0).speed);
    expect(railDifficulty(20).spawnMs).toBeLessThan(railDifficulty(0).spawnMs);
  });

  it("generates deterministic obstacle lanes", () => {
    expect(nextRailObstacle(8128)).toEqual(nextRailObstacle(8128));
  });

  it("gives express and freight obstacles different timing profiles", () => {
    expect(railObstacleProfile("express").speedFactor).toBeGreaterThan(1);
    expect(railObstacleProfile("express").widthFactor).toBeLessThan(1);
    expect(railObstacleProfile("freight").speedFactor).toBeLessThan(1);
    expect(railObstacleProfile("freight").widthFactor).toBeGreaterThan(1);
  });

  it("rewards clearing special obstacle classes", () => {
    expect(railPassScore(0, 4, "express")).toBeGreaterThan(railPassScore(0, 4, "barrier"));
    expect(railPassScore(0, 4, "freight")).toBeGreaterThan(railPassScore(0, 4, "barrier"));
  });

  it("flips between the two rails", () => {
    expect(flipLane("upper")).toBe("lower");
    expect(flipLane("lower")).toBe("upper");
  });

  it("collides only when position and blocked rail both match", () => {
    expect(railCollision("upper", "upper", 200, 210, 40, 10)).toBe(true);
    expect(railCollision("lower", "upper", 200, 210, 40, 10)).toBe(false);
  });

  it("rewards longer clean streaks", () => {
    expect(railPassScore(0, 8)).toBeGreaterThan(railPassScore(0, 0));
  });
});
