import { describe, expect, it } from "vitest";
import { brickPattern, reboundDifficulty, reboundHitScore, reflectFromPaddle } from "./model";

describe("Rebound Rush model", () => {
  it("raises ball speed and narrows the paddle across waves", () => {
    expect(reboundDifficulty(6).ballSpeed).toBeGreaterThan(reboundDifficulty(1).ballSpeed);
    expect(reboundDifficulty(6).paddleWidth).toBeLessThan(reboundDifficulty(1).paddleWidth);
  });

  it("sends center paddle hits mostly upward", () => {
    const velocity = reflectFromPaddle(400, 400, 140, 320);
    expect(Math.abs(velocity.vx)).toBeLessThan(1);
    expect(velocity.vy).toBeLessThan(-300);
  });

  it("angles edge hits away from the paddle center", () => {
    expect(reflectFromPaddle(460, 400, 140, 320).vx).toBeGreaterThan(0);
    expect(reflectFromPaddle(340, 400, 140, 320).vx).toBeLessThan(0);
  });

  it("adds denser target fields as waves advance", () => {
    expect(brickPattern(5).length).toBeGreaterThan(brickPattern(1).length);
  });

  it("introduces armored and charge bricks in later waves", () => {
    const late = brickPattern(8);
    expect(late.some((brick) => brick.kind === "armored")).toBe(true);
    expect(late.some((brick) => brick.kind === "charge")).toBe(true);
    expect(late.find((brick) => brick.kind === "armored")?.strength).toBe(2);
  });

  it("keeps opening waves mostly straightforward", () => {
    expect(brickPattern(1).every((brick) => brick.kind === "normal")).toBe(true);
  });

  it("rewards sustained hit combos", () => {
    expect(reboundHitScore(8)).toBeGreaterThan(reboundHitScore(0));
  });
});
