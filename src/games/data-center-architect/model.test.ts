import { describe, expect, it } from "vitest";
import { advanceDataCenter, createDataCenterState, dataCenterLayout, dataCenterReady, dataCenterStats, interactDataCenter, type DataCenterState } from "./model";

describe("Data Center Architect model", () => {
  it("uses physical staging and rack bays", () => {
    const state = createDataCenterState();
    expect(interactDataCenter(state).event).toBe("none");
    const staged = interactDataCenter({ ...state, playerX: dataCenterLayout.staging.compute.x, playerY: dataCenterLayout.staging.compute.y });
    expect(staged.event).toBe("rack_picked");
    const placed = interactDataCenter({ ...staged.state, playerX: dataCenterLayout.slots[0].x, playerY: dataCenterLayout.slots[0].y });
    expect(placed.event).toBe("rack_placed");
    expect(placed.state.slots[0]).toBe("compute");
  });

  it("rewards network and cooling adjacency", () => {
    const adjacent = createDataCenterState();
    adjacent.slots = ["compute", "network", null, "cooling", null, null, null, null];
    const separated = createDataCenterState();
    separated.slots = ["compute", null, "network", null, null, "cooling", null, null];
    expect(dataCenterStats(adjacent).network).toBeGreaterThan(dataCenterStats(separated).network);
    expect(dataCenterStats(adjacent).thermal).toBeLessThan(dataCenterStats(separated).thermal);
  });

  it("blocks workload deployment until infrastructure meets SLA", () => {
    const state = createDataCenterState();
    const blocked = interactDataCenter({ ...state, playerX: dataCenterLayout.deploy.x, playerY: dataCenterLayout.deploy.y });
    expect(blocked.event).toBe("deploy_blocked");
    const ready: DataCenterState = { ...state, slots: ["compute", "network", "compute", "cooling", "storage", "power", "power", "network"] };
    expect(dataCenterReady(ready)).toBe(true);
  });

  it("creates live rack faults and requires a physical repair-kit route", () => {
    let state: DataCenterState = {
      ...createDataCenterState(7),
      slots: ["compute", "network", "compute", "cooling", "storage", "power", "power", null],
      workloadRunning: true,
      workloadTime: 30,
      faultTimer: 0.01,
    };
    const faulted = advanceDataCenter(state, { x: 0, y: 0 }, 0.05);
    state = faulted.state;
    expect(faulted.event).toBe("fault");
    expect(state.faultSlot).not.toBeNull();

    const withKit = interactDataCenter({ ...state, playerX: dataCenterLayout.repair.x, playerY: dataCenterLayout.repair.y });
    expect(withKit.event).toBe("repair_kit");
    const faultPosition = dataCenterLayout.slots[withKit.state.faultSlot!];
    const repairing = interactDataCenter({ ...withKit.state, playerX: faultPosition.x, playerY: faultPosition.y });
    expect(repairing.event).toBe("repair_started");
    expect(repairing.state.carryingRepairKit).toBe(false);

    state = repairing.state;
    for (let i = 0; i < 110; i += 1) state = advanceDataCenter(state, { x: 0, y: 0 }, 0.05).state;
    expect(state.faultSlot).toBeNull();
    expect(state.repairTimer).toBe(0);
  });
});
