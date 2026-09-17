import { describe, expect, it } from "vitest";
import { advanceFabFloor, createFabFloorState, fabFloorLayout, interactFabFloor } from "./model";

describe("Fab Floor model", () => {
  it("requires the player to walk to lot release", () => {
    const state = createFabFloorState();
    expect(interactFabFloor(state).event).toBe("none");
    const released = interactFabFloor({ ...state, playerX: fabFloorLayout.release.x, playerY: fabFloorLayout.release.y });
    expect(released.event).toBe("lot_released");
    expect(released.state.lots).toHaveLength(1);
  });

  it("requires a physical maintenance kit before an alarm can be repaired", () => {
    const base = createFabFloorState(); const litho = fabFloorLayout.tools.lithography; const x = litho.x + litho.width / 2; const y = litho.y + litho.height / 2;
    const alarmed = { ...base, playerX: x, playerY: y, tools: { ...base.tools, lithography: { ...base.tools.lithography, alarm: true } } };
    expect(interactFabFloor(alarmed).event).toBe("none");
    const kit = interactFabFloor({ ...alarmed, playerX: fabFloorLayout.maintenance.x, playerY: fabFloorLayout.maintenance.y }).state;
    const repaired = interactFabFloor({ ...kit, playerX: x, playerY: y });
    expect(repaired.event).toBe("maintenance_started");
    expect(repaired.state.carryingKit).toBe(false);
  });

  it("moves released lots continuously through process stages", () => {
    let state = interactFabFloor({ ...createFabFloorState(), playerX: fabFloorLayout.release.x, playerY: fabFloorLayout.release.y }).state;
    for (let i = 0; i < 500; i += 1) state = advanceFabFloor(state, { x: 0, y: 0 }, 0.05).state;
    expect(state.tools.lithography.processed).toBeGreaterThan(0);
    expect(state.lots[0]?.stage === "etch" || state.lots[0]?.stage === "metrology" || state.completedLots > 0).toBe(true);
  });
});
