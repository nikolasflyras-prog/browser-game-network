import { describe, expect, it } from "vitest";
import { compactPrototypeEvent, prototypeMetricProperties } from "./ui/prototype-events";

describe("prototype event helpers", () => {
  it("normalizes camelCase metrics to analytics-friendly snake_case", () => {
    expect(prototypeMetricProperties({ cycleTime: 42, defectRisk: 17, service: 91 })).toEqual({
      cycle_time: 42,
      defect_risk: 17,
      service: 91,
    });
  });

  it("creates a compact lab readout without changing the underlying event", () => {
    expect(compactPrototypeEvent("level_completed", { step: "shock-1", choice: "buffer", score_delta: 4 })).toContain(
      "level_completed",
    );
  });
});
