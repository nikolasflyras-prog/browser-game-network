import { describe, expect, it } from "vitest";
import { chipFabPrototype } from "./chip-fab/prototype";
import { supplyChainPrototype } from "./supply-chain-shock/prototype";
import { chooseScenarioSession, createScenarioSession, scenarioSessionView } from "./scenario-session";

describe("scenario prototype session", () => {
  it("exposes one shared view model for scenario games", () => {
    const session = createScenarioSession(chipFabPrototype);
    const view = scenarioSessionView(chipFabPrototype, session);
    expect(view.stepNumber).toBe(1);
    expect(view.totalSteps).toBe(4);
    expect(view.choices).toHaveLength(3);
    expect(view.complete).toBe(false);
  });

  it("keeps unavailable choices visible for consequence-aware UI", () => {
    let session = createScenarioSession(supplyChainPrototype);
    session = chooseScenarioSession(supplyChainPrototype, session, "wait");
    session = chooseScenarioSession(supplyChainPrototype, session, "prioritize");
    session = chooseScenarioSession(supplyChainPrototype, session, "ration");

    const view = scenarioSessionView(supplyChainPrototype, session);
    const backup = view.choices.find((choice) => choice.id === "activate-backup");
    expect(backup?.available).toBe(false);
    expect(backup?.unavailableFeedback).toMatch(/qualified alternate capacity/i);
    expect(() => chooseScenarioSession(supplyChainPrototype, session, "activate-backup")).toThrow(/qualified alternate capacity/i);
  });

  it("returns a classified result on the final legal choice", () => {
    let session = createScenarioSession(supplyChainPrototype);
    for (const choiceId of ["safety-stock", "prioritize", "ration", "broker-market"] as const) {
      session = chooseScenarioSession(supplyChainPrototype, session, choiceId);
    }
    expect(session.state.complete).toBe(true);
    expect(session.result?.score).toBeTypeOf("number");
    expect(session.result?.style).toBeTypeOf("string");
  });
});
