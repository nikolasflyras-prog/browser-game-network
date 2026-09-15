import { describe, expect, it } from "vitest";
import { chooseSwitchyardAction, createSwitchyardPrototype, switchyardPrototypeResult, switchyardPrototypeView } from "./prototype";
import { routeAfterAction, type SwitchyardAction } from "./simulation";

const actions: readonly SwitchyardAction[] = ["HOLD", "A", "B", "C"];

describe("Switchyard Daily prototype adapter", () => {
  it("exposes only visible puzzle state, not the generated solution action", () => {
    const view = switchyardPrototypeView(createSwitchyardPrototype(17));
    expect(view.target).toBeTypeOf("number");
    expect(view.switches).toEqual({ A: false, B: false, C: false });
    expect("solution" in view).toBe(false);
  });

  it("can complete a puzzle through the action adapter", () => {
    let session = createSwitchyardPrototype(32, 4);
    while (!session.state.complete) {
      const action = actions.find((candidate) => routeAfterAction(session.state.switches, candidate) === session.state.target) ?? "HOLD";
      session = chooseSwitchyardAction(session, action);
    }
    expect(switchyardPrototypeResult(session)?.won).toBe(true);
  });
});
