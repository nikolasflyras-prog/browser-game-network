import { describe, expect, it } from "vitest";
import {
  applyScenarioChoice,
  availableScenarioChoices,
  createScenarioState,
  finishScenario,
  summarizeMetricChange,
} from "./scenario-engine";

type Metric = "cash" | "resilience";

describe("future scenario engine", () => {
  it("applies impacts and clamps metrics", () => {
    const state = createScenarioState<Metric>({ cash: 100, resilience: 50 });
    const next = applyScenarioChoice(
      state,
      {
        id: "shock-1",
        title: "Supplier shock",
        prompt: "Choose a response",
        choices: [
          {
            id: "expedite",
            label: "Expedite",
            detail: "Spend to protect service",
            impacts: { cash: -40, resilience: 75 },
            scoreDelta: 5,
            feedback: "Fast, but expensive.",
          },
        ],
      },
      "expedite",
      { min: { cash: 0, resilience: 0 }, max: { resilience: 100 } },
    );

    expect(next.metrics).toEqual({ cash: 60, resilience: 100 });
    expect(next.score).toBe(5);
    expect(next.history).toHaveLength(1);
  });

  it("keeps state immutable", () => {
    const state = createScenarioState<Metric>({ cash: 100, resilience: 50 });
    const next = applyScenarioChoice(
      state,
      {
        id: "step",
        title: "Step",
        prompt: "Pick",
        choices: [
          { id: "a", label: "A", detail: "A", impacts: { cash: -10 }, feedback: "A" },
        ],
      },
      "a",
    );

    expect(state.metrics.cash).toBe(100);
    expect(next.metrics.cash).toBe(90);
  });

  it("supports state-dependent impacts", () => {
    const state = createScenarioState<Metric>({ cash: 50, resilience: 70 });
    const next = applyScenarioChoice(
      state,
      {
        id: "step",
        title: "Step",
        prompt: "Pick",
        choices: [
          {
            id: "buffer",
            label: "Use buffer",
            detail: "Prepared systems absorb the shock",
            impacts: { cash: -5 },
            resolveImpacts: (metrics) => (metrics.resilience >= 60 ? { cash: 3 } : {}),
            feedback: "Preparation reduced the cost.",
          },
        ],
      },
      "buffer",
    );

    expect(next.metrics.cash).toBe(48);
  });

  it("filters choices whose requirements are not met", () => {
    const state = createScenarioState<Metric>({ cash: 20, resilience: 40 });
    const step = {
      id: "failure",
      title: "Failure",
      prompt: "Respond",
      choices: [
        {
          id: "backup",
          label: "Activate backup",
          detail: "Use qualified supply",
          impacts: { resilience: 5 },
          requirements: { resilience: { min: 50 } },
          feedback: "Backup activated.",
        },
        { id: "spot", label: "Buy spot", detail: "Pay up", impacts: { cash: -10 }, feedback: "Expensive." },
      ],
    } as const;

    expect(availableScenarioChoices(state, step).map((choice) => choice.id)).toEqual(["spot"]);
    expect(() => applyScenarioChoice(state, step, "backup")).toThrow(/unavailable/i);
  });

  it("summarizes only changed metrics", () => {
    expect(summarizeMetricChange<Metric>({ cash: 10, resilience: 5 }, { cash: 7, resilience: 5 })).toEqual([
      { metric: "cash", delta: -3 },
    ]);
  });

  it("marks completion explicitly", () => {
    const state = createScenarioState<Metric>({ cash: 10, resilience: 5 });
    expect(finishScenario(state).complete).toBe(true);
  });
});
