import { describe, expect, it } from "vitest";
import { auditMarketMakerBalance, runMarketMakerPlaytest } from "./playtest";

describe("Market Maker headless playtest", () => {
  it("is deterministic for the same seed and policy", () => {
    expect(runMarketMakerPlaytest(91, "inventory-aware")).toEqual(runMarketMakerPlaytest(91, "inventory-aware"));
  });

  it("makes tighter quotes trade more often than wide quotes", () => {
    const audit = auditMarketMakerBalance(128, 16);
    expect(audit.tight.averageFills).toBeGreaterThan(audit.wide.averageFills * 2);
  });

  it("makes inventory-aware skew materially reduce inventory risk", () => {
    const audit = auditMarketMakerBalance(256, 16);
    expect(audit["inventory-aware"].averageAbsEndingInventory).toBeLessThan(
      audit.balanced.averageAbsEndingInventory * 0.75,
    );
    expect(audit["inventory-aware"].averageScore).toBeGreaterThan(audit.wide.averageScore);
  });
});
