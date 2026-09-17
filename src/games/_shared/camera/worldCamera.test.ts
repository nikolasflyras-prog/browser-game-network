import { describe, expect, it } from "vitest";
import { boundedWorldCamera } from "./worldCamera";

describe("boundedWorldCamera", () => {
  it("follows a player in the middle of the world", () => {
    const camera = boundedWorldCamera({ playerX: 600, playerY: 400, viewportWidth: 390, viewportHeight: 600, worldWidth: 1200, worldHeight: 800, scale: 0.75 });
    expect(camera.cameraX).toBe(600);
    expect(camera.cameraY).toBe(400);
  });

  it("clamps near world edges so the viewport does not expose gutters", () => {
    const camera = boundedWorldCamera({ playerX: 1180, playerY: 40, viewportWidth: 390, viewportHeight: 600, worldWidth: 1200, worldHeight: 800, scale: 0.75, anchorY: 330 });
    expect(camera.cameraX).toBeLessThan(1180);
    expect(camera.cameraY).toBeGreaterThan(40);
  });
});
