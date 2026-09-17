import { describe, expect, it } from "vitest";
import { createFabFloorState } from "./model";
import {
  activeFabContract,
  advanceFabBusiness,
  createFabBusinessState,
  fabBusinessLayout,
  fabContractYield,
  fabNodeProgram,
  interactFabBusiness,
} from "./business";

describe("Fab Floor business campaign", () => {
  it("starts with a live customer contract on the mature-node program", () => {
    const business = createFabBusinessState();
    expect(fabNodeProgram(business).id).toBe("28nm-planar");
    expect(activeFabContract(business).requiredLots).toBeGreaterThan(0);
    expect(business.contractTimeLeft).toBe(activeFabContract(business).deadline);
  });

  it("spends cash to upgrade the currently focused tool at the physical capex station", () => {
    const core = createFabFloorState();
    const business = createFabBusinessState();
    const result = interactFabBusiness(
      { ...core, playerX: fabBusinessLayout.capex.x, playerY: fabBusinessLayout.capex.y, focus: "lithography" },
      business,
    );
    expect(result.event).toBe("capex_upgrade");
    expect(result.business.upgrades.lithography).toBe(1);
    expect(result.core.cash).toBeLessThan(core.cash);
  });

  it("hires equipment technicians from operations and consumes budget", () => {
    const core = createFabFloorState();
    const business = createFabBusinessState();
    const result = interactFabBusiness(
      { ...core, playerX: fabBusinessLayout.operations.x, playerY: fabBusinessLayout.operations.y },
      business,
    );
    expect(result.event).toBe("technician_hired");
    expect(result.business.technicians).toBe(1);
    expect(result.core.cash).toBeLessThan(core.cash);
  });

  it("wins a contract when enough completed lots clear the yield target", () => {
    const before = createFabFloorState();
    const business = createFabBusinessState();
    const contract = activeFabContract(business);
    const completed = contract.requiredLots;
    const good = completed * 97;
    const scrap = completed * 3;
    const after = {
      ...before,
      completedLots: before.completedLots + completed,
      goodDie: before.goodDie + good,
      scrap: before.scrap + scrap,
    };
    const result = advanceFabBusiness(before, after, business, 0.05);
    expect(result.event).toBe("contract_won");
    expect(result.business.contractsWon).toBe(1);
    expect(result.business.contractIndex).toBe(1);
    expect(result.core.cash).toBeGreaterThan(before.cash);
  });

  it("advances to FinFET after the second customer win", () => {
    const before = createFabFloorState();
    const seed = { ...createFabBusinessState(), contractsWon: 1, contractIndex: 1 };
    const contract = activeFabContract(seed);
    const after = {
      ...before,
      completedLots: contract.requiredLots,
      goodDie: contract.requiredLots * 98.5,
      scrap: contract.requiredLots * 1.5,
    };
    const result = advanceFabBusiness(before, after, seed, 0.05);
    expect(result.event).toBe("node_advanced");
    expect(result.business.contractsWon).toBe(2);
    expect(fabNodeProgram(result.business).id).toBe("7nm-finfet");
  });

  it("misses an expired contract and applies a reputation penalty", () => {
    const core = createFabFloorState();
    const business = { ...createFabBusinessState(), contractTimeLeft: 0.01 };
    const result = advanceFabBusiness(core, core, business, 0.05);
    expect(result.event).toBe("contract_missed");
    expect(result.business.contractsMissed).toBe(1);
    expect(result.core.reputation).toBeLessThan(core.reputation);
  });

  it("tracks contract yield separately from lifetime fab yield", () => {
    expect(fabContractYield({ contractGoodDie: 190, contractScrap: 10 })).toBeCloseTo(0.95, 5);
  });
});
