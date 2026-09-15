import { describe, expect, it } from "vitest";
import { averageFinalScoreByChoice, enumerateScenarioPaths, scenarioScoreRange } from "./scenario-audit";
import type { ScenarioStep } from "./scenario-engine";

type Metric = "cash" | "quality";

const steps: readonly ScenarioStep<Metric>[] = [
  {
    id: "prepare",
    title: "Prepare",
    prompt: "Choose",
    choices: [
      { id: "save", label: "Save", detail: "Save cash", impacts: { cash: 5 }, feedback: "Cash saved." },
      { id: "invest", label: "Invest", detail: "Improve quality", impacts: { cash: -5, quality: 10 }, feedback: "Quality improved." },
    ],
  },
  {
    id: "execute",
    title: "Execute",
    prompt: "Choose",
    choices: [
      { id: "normal", label: "Normal", detail: "Proceed", impacts: {}, feedback: "Done." },
      {
        id: "premium",
        label: "Premium",
        detail: "Requires quality",
        impacts: { cash: 8 },
        requirements: { quality: { min: 55 } },
        feedback: "Premium path unlocked.",
      },
    ],
  },
];

describe("scenario audit", () => {
  const paths = enumerateScenarioPaths(
    steps,
    { cash: 50, quality: 50 },
    { min: { cash: 0, quality: 0 }, max: { cash: 100, quality: 100 } },
    (state) => state.metrics.cash + state.metrics.quality,
  );

  it("enumerates only legal paths", () => {
    expect(paths).toHaveLength(3);
    expect(paths.some((path) => path.choiceIds.join("/") === "save/premium")).toBe(false);
  });

  it("summarizes choice performance and score spread", () => {
    const averages = averageFinalScoreByChoice(paths, 0);
    expect(averages.invest).toBeGreaterThan(averages.save);
    expect(scenarioScoreRange(paths).spread).toBeGreaterThan(0);
  });
});
