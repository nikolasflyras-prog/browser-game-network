import { describe, expect, it } from "vitest";
import {
  chipFabResult,
  createChipFabState,
  fabMetricChanges,
  fabOperatingSignals,
  playFabChoice,
} from "./model";

function reachBottleneck() {
  let state = createChipFabState();
  state = playFabChoice(state, "controlled-ramp");
  return playFabChoice(state, "monitor");
}

describe("Chip Fab production model", () => {
  it("starts with the expected good-output signal", () => {
    expect(fabOperatingSignals(createChipFabState().metrics)).toEqual({
      goodOutput: 30,
      congestion: "watch",
      processRisk: "watch",
    });
  });

  it("shows why running the bottleneck flat-out is not the same as better fab output", () => {
    const base = reachBottleneck();
    const flat = playFabChoice(base, "maximize-utilization");
    const scheduled = playFabChoice(base, "improve-scheduling");

    expect(fabOperatingSignals(flat.metrics)).toMatchObject({ goodOutput: 41, congestion: "high", processRisk: "watch" });
    expect(fabOperatingSignals(scheduled.metrics)).toMatchObject({ goodOutput: 47, congestion: "controlled", processRisk: "watch" });
    expect(scheduled.metrics.throughput).toBeGreaterThan(flat.metrics.throughput);
    expect(scheduled.metrics.yield).toBeGreaterThan(flat.metrics.yield);
    expect(scheduled.metrics.cycleTime).toBeLessThan(flat.metrics.cycleTime);
  });

  it("makes waiting for final-test evidence compound process risk", () => {
    let state = createChipFabState();
    state = playFabChoice(state, "controlled-ramp");
    const monitored = playFabChoice(state, "monitor");
    const keptRunning = playFabChoice(state, "keep-running");

    expect(keptRunning.metrics.throughput).toBeGreaterThan(monitored.metrics.throughput);
    expect(keptRunning.metrics.yield).toBeLessThan(monitored.metrics.yield);
    expect(keptRunning.metrics.defectRisk).toBeGreaterThan(monitored.metrics.defectRisk);
  });

  it("exposes signed decision impacts in objective terms", () => {
    const state = playFabChoice(createChipFabState(), "push-starts");
    const changes = fabMetricChanges(state.history.at(-1) ?? null);
    expect(changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: "throughput", delta: 16, improvement: 16 }),
      expect.objectContaining({ metric: "yield", delta: -9, improvement: -9 }),
      expect.objectContaining({ metric: "cycleTime", delta: 10, improvement: -10 }),
      expect.objectContaining({ metric: "defectRisk", delta: 8, improvement: -8 }),
    ]));
  });

  it("returns a scored terminal fab style", () => {
    let state = createChipFabState();
    for (const choice of ["controlled-ramp", "monitor", "improve-scheduling", "short-maintenance"]) {
      state = playFabChoice(state, choice);
    }
    const result = chipFabResult(state);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
    expect(["overdriven", "process-first", "capacity-first", "balanced-ramp"]).toContain(result!.style);
    expect(result!.strongestImprovement).not.toBeNull();
  });
});
