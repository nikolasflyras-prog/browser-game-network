import { describe, expect, it } from "vitest";
import {
  CHIP_ARCHITECT_JOB_SECONDS,
  advanceChipArchitect,
  chipArchitectLayout,
  chipDesignStats,
  createChipArchitectState,
  interactChipArchitect,
  moduleVariants,
  tapeoutReady,
  type ChipArchitectState,
  type ModuleType,
} from "./model";

function install(state: ChipArchitectState, variantId: string): ChipArchitectState {
  const variant = moduleVariants.find((item) => item.id === variantId)!;
  const slot = chipArchitectLayout.slots[variant.type];
  const picked = interactChipArchitect({ ...state, playerX: variant.x, playerY: variant.y });
  expect(picked.event).toBe("block_picked");
  const placed = interactChipArchitect({ ...picked.state, playerX: slot.x, playerY: slot.y });
  expect(placed.event).toBe("block_placed");
  return placed.state;
}

function buildAiDesign() {
  let state = createChipArchitectState();
  for (const id of ["vector-array", "banked-sram", "mesh-noc", "serdes-112"]) state = install(state, id);
  return state;
}

describe("Chip Architect model", () => {
  it("starts in a live lab with four empty floorplan slots", () => {
    const state = createChipArchitectState();
    expect(state.jobIndex).toBe(0);
    expect(state.jobTimeLeft).toBe(CHIP_ARCHITECT_JOB_SECONDS);
    expect(Object.values(state.slots).every((slot) => slot === null)).toBe(true);
    expect(state.frequency).toBe("balanced");
  });

  it("requires the player to physically pick up an IP block before installing it", () => {
    const state = createChipArchitectState();
    const tooFar = interactChipArchitect(state);
    expect(tooFar.event).toBe("none");

    const vector = moduleVariants.find((item) => item.id === "vector-array")!;
    const picked = interactChipArchitect({ ...state, playerX: vector.x, playerY: vector.y });
    expect(picked.event).toBe("block_picked");
    expect(picked.state.carriedVariantId).toBe("vector-array");

    const wrongSlot = chipArchitectLayout.slots.memory;
    const rejected = interactChipArchitect({ ...picked.state, playerX: wrongSlot.x, playerY: wrongSlot.y });
    expect(rejected.event).toBe("none");
    expect(rejected.state.carriedVariantId).toBe("vector-array");
  });

  it("builds a complete AI floorplan whose PPA changes with clock mode", () => {
    const state = buildAiDesign();
    const balanced = chipDesignStats(state);
    const turbo = chipDesignStats({ ...state, frequency: "turbo" });
    const eco = chipDesignStats({ ...state, frequency: "eco" });
    expect(Object.values(state.slots).every(Boolean)).toBe(true);
    expect(turbo.performance).toBeGreaterThan(balanced.performance);
    expect(turbo.power).toBeGreaterThan(balanced.power);
    expect(eco.timing).toBeGreaterThan(balanced.timing);
  });

  it("requires verification before a design can tape out", () => {
    let state = buildAiDesign();
    expect(tapeoutReady(state)).toBe(false);

    const verified = interactChipArchitect({ ...state, playerX: chipArchitectLayout.verify.x, playerY: chipArchitectLayout.verify.y });
    expect(verified.event).toBe("verification_passed");
    expect(verified.state.verified).toBe(true);
    expect(verified.state.verificationPass).toBe(true);
    expect(tapeoutReady(verified.state)).toBe(true);

    const taped = interactChipArchitect({ ...verified.state, playerX: chipArchitectLayout.tapeout.x, playerY: chipArchitectLayout.tapeout.y });
    expect(taped.event).toBe("tapeout");
    expect(taped.state.tapeouts).toBe(1);
    expect(taped.state.jobIndex).toBe(1);
    expect(Object.values(taped.state.slots).every((slot) => slot === null)).toBe(true);
  });

  it("invalidates verification when a placed block is removed", () => {
    const built = buildAiDesign();
    const verified = interactChipArchitect({ ...built, playerX: chipArchitectLayout.verify.x, playerY: chipArchitectLayout.verify.y }).state;
    const slot = chipArchitectLayout.slots.compute;
    const removed = interactChipArchitect({ ...verified, playerX: slot.x, playerY: slot.y });
    expect(removed.event).toBe("block_removed");
    expect(removed.state.verified).toBe(false);
    expect(removed.state.slots.compute).toBeNull();
    expect(removed.state.carriedVariantId).toBe("vector-array");
  });

  it("moves to the next customer if the active specification expires", () => {
    const state: ChipArchitectState = { ...createChipArchitectState(), jobTimeLeft: 0.02 };
    const result = advanceChipArchitect(state, { x: 0, y: 0 }, 0.05);
    expect(result.event).toBe("job_missed");
    expect(result.state.jobIndex).toBe(1);
    expect(result.state.missedJobs).toBe(1);
    expect(result.state.reputation).toBe(82);
  });

  it("keeps every installed block in the correct typed floorplan slot", () => {
    let state = createChipArchitectState();
    const ids: Record<ModuleType, string> = {
      compute: "efficient-core",
      memory: "compact-sram",
      noc: "ring-noc",
      io: "lp-io",
    };
    for (const type of Object.keys(ids) as ModuleType[]) state = install(state, ids[type]);
    expect(state.slots).toEqual(ids);
  });
});
