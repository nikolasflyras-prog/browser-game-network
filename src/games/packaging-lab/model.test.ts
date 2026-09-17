import { describe, expect, it } from "vitest";
import {
  PACKAGING_JOB_SECONDS,
  advancePackagingLab,
  createPackagingState,
  getPackageComponent,
  interactPackagingLab,
  packageComponents,
  packageMeetsSpec,
  packageSlotPositions,
  packageStats,
  packagingLayout,
  type PackagingState,
} from "./model";

function place(state: PackagingState, componentId: string, slotIndex: number): PackagingState {
  const component = packageComponents.find((item) => item.id === componentId)!;
  const picked = interactPackagingLab({ ...state, playerX: component.x, playerY: component.y });
  expect(picked.event).toBe("component_picked");
  const slot = packageSlotPositions[slotIndex];
  const placed = interactPackagingLab({ ...picked.state, playerX: slot.x, playerY: slot.y });
  expect(placed.event).toBe("component_placed");
  return placed.state;
}

function buildAiPackage() {
  let state = createPackagingState();
  const placements: Array<[string, number]> = [
    ["xpu-hot", 0],
    ["hbm4", 1],
    ["optical-engine", 2],
    ["heat-spreader", 3],
    ["xpu-efficient", 4],
    ["hbm3e", 5],
  ];
  for (const [id, slot] of placements) state = place(state, id, slot);
  return state;
}

describe("Packaging Lab model", () => {
  it("starts with a blank six-site package and a live customer window", () => {
    const state = createPackagingState();
    expect(state.slots).toHaveLength(6);
    expect(state.slots.every((slot) => slot === null)).toBe(true);
    expect(state.jobTimeLeft).toBe(PACKAGING_JOB_SECONDS);
    expect(state.bondProfile).toBe("balanced");
  });

  it("lets the operator physically pick and place package components", () => {
    const state = createPackagingState();
    const component = getPackageComponent("hbm4")!;
    const picked = interactPackagingLab({ ...state, playerX: component.x, playerY: component.y });
    expect(picked.event).toBe("component_picked");
    expect(picked.state.carriedComponentId).toBe("hbm4");

    const slot = packageSlotPositions[1];
    const placed = interactPackagingLab({ ...picked.state, playerX: slot.x, playerY: slot.y });
    expect(placed.event).toBe("component_placed");
    expect(placed.state.slots[1]).toBe("hbm4");
    expect(placed.state.carriedComponentId).toBeNull();
  });

  it("rewards placing HBM adjacent to compute with more usable bandwidth", () => {
    let adjacent = createPackagingState();
    adjacent = place(adjacent, "xpu-efficient", 0);
    adjacent = place(adjacent, "hbm4", 1);

    let remote = createPackagingState();
    remote = place(remote, "xpu-efficient", 0);
    remote = place(remote, "hbm4", 5);

    expect(packageStats(adjacent).bandwidth).toBeGreaterThan(packageStats(remote).bandwidth);
  });

  it("uses an adjacent spreader to reduce the local thermal peak", () => {
    let hot = createPackagingState();
    hot = place(hot, "xpu-hot", 0);
    hot = place(hot, "hbm4", 1);

    let cooled = hot;
    cooled = place(cooled, "heat-spreader", 3);
    expect(packageStats(cooled).thermalPeak).toBeLessThan(packageStats(hot).thermalPeak);
  });

  it("can build, inspect, and ship a valid AI package", () => {
    let state = buildAiPackage();
    expect(packageMeetsSpec(state)).toBe(true);

    const started = interactPackagingLab({ ...state, playerX: packagingLayout.inspect.x, playerY: packagingLayout.inspect.y });
    expect(started.event).toBe("inspection_started");
    state = started.state;
    let event = "none";
    for (let i = 0; i < 120; i += 1) {
      const result = advancePackagingLab(state, { x: 0, y: 0 }, 0.05);
      state = result.state;
      if (result.event !== "none") event = result.event;
    }
    expect(event).toBe("inspection_passed");
    expect(state.inspectionPass).toBe(true);

    const shipped = interactPackagingLab({ ...state, playerX: packagingLayout.ship.x, playerY: packagingLayout.ship.y });
    expect(shipped.event).toBe("package_shipped");
    expect(shipped.state.packagesShipped).toBe(1);
    expect(shipped.state.jobIndex).toBe(1);
  });

  it("trades inspection speed for yield and warpage through the bond profile", () => {
    const state = buildAiPackage();
    const gentle = packageStats({ ...state, bondProfile: "gentle" });
    const fast = packageStats({ ...state, bondProfile: "fast" });
    expect(gentle.yield).toBeGreaterThan(fast.yield);
    expect(gentle.warpage).toBeLessThan(fast.warpage);
  });

  it("moves on and penalizes reputation when a package window expires", () => {
    const state: PackagingState = { ...createPackagingState(), jobTimeLeft: 0.02 };
    const result = advancePackagingLab(state, { x: 0, y: 0 }, 0.05);
    expect(result.event).toBe("job_missed");
    expect(result.state.jobIndex).toBe(1);
    expect(result.state.reputation).toBe(82);
  });
});
