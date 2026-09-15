import { describe, expect, it } from "vitest";
import { switchyardLayout } from "./layout";

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

describe("Switchyard responsive layout", () => {
  it.each([
    [320, 480],
    [320, 568],
    [390, 664],
    [430, 740],
  ])("keeps compact controls inside the viewport without overlap at %ix%i", (width, height) => {
    const layout = switchyardLayout(width, height);
    expect(layout.compact).toBe(true);
    const controls = Object.values(layout.controls);
    for (const control of controls) {
      expect(control.x - control.width / 2).toBeGreaterThanOrEqual(0);
      expect(control.x + control.width / 2).toBeLessThanOrEqual(width);
      expect(control.y - control.height / 2).toBeGreaterThan(layout.depots[0].y);
      expect(control.y + control.height / 2).toBeLessThanOrEqual(height);
    }
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        expect(overlaps(controls[i], controls[j])).toBe(false);
      }
    }
  });

  it("uses a single control row on desktop", () => {
    const layout = switchyardLayout(960, 720);
    expect(layout.compact).toBe(false);
    expect(new Set(Object.values(layout.controls).map((control) => control.y)).size).toBe(1);
  });
});
