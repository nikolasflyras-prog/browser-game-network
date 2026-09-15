import { describe, expect, it } from "vitest";
import { formatMetricDelta, rankScenarioMetricOutcomes, summarizeScenarioOutcome } from "./scenario-insights";

describe("scenario result insights", () => {
  const initial = { service: 80, backlog: 20, inventory: 50 };
  const final = { service: 92, backlog: 28, inventory: 70 };
  const directions = { service: "higher", backlog: "lower", inventory: "neutral" } as const;

  it("ranks outcomes according to each metric's beneficial direction", () => {
    expect(rankScenarioMetricOutcomes(initial, final, directions)).toEqual([
      { metric: "service", delta: 12, improvement: 12 },
      { metric: "backlog", delta: 8, improvement: -8 },
    ]);
  });

  it("separates the strongest improvement from the biggest pressure", () => {
    expect(summarizeScenarioOutcome(initial, final, directions)).toEqual({
      strongestImprovement: { metric: "service", delta: 12, improvement: 12 },
      biggestPressure: { metric: "backlog", delta: 8, improvement: -8 },
    });
  });

  it("formats deltas for compact result cards", () => {
    expect(formatMetricDelta(4.4)).toBe("+4");
    expect(formatMetricDelta(-3.8)).toBe("-4");
    expect(formatMetricDelta(0.2)).toBe("0");
  });
});
