import { describe, expect, it } from "vitest";
import {
  advanceTrafficSession,
  auditTrafficBalance,
  createTrafficSession,
  stepTraffic,
  trafficPressure,
  trafficResult,
  trafficView,
} from "./model";

describe("Traffic Control production model", () => {
  it("uses a short all-red safety transition before changing axes", () => {
    let session = createTrafficSession(7);
    session = advanceTrafficSession(session, "switch");
    expect(trafficView(session).phase).toBe("ALL_RED");
    session = advanceTrafficSession(session, "none");
    session = advanceTrafficSession(session, "none");
    expect(trafficView(session).phase).toBe("EW");
  });

  it("raises pressure as queues build and ends only on gridlock", () => {
    let state = createTrafficSession(3).state;
    while (!state.complete && state.tick < 500) state = stepTraffic(state, "none");
    expect(state.complete).toBe(true);
    expect(state.gameOverReason).toBe("gridlock");
    expect(trafficPressure(state)).toBeGreaterThan(1);
  });

  it("tracks switches, peak pressure, and final score in the session result", () => {
    let session = createTrafficSession(11);
    while (!session.state.complete && session.state.tick < 500) {
      const view = trafficView(session);
      const action = view.phase !== "ALL_RED" && view.ewQueue >= view.nsQueue + 2 ? "switch" : "none";
      session = advanceTrafficSession(session, action);
    }
    const result = trafficResult(session);
    expect(result).not.toBeNull();
    expect(result?.reason).toBe("gridlock");
    expect(result?.switches).toBeGreaterThanOrEqual(0);
    expect(result?.peakPressure).toBeGreaterThan(0);
  });

  it("makes queue-aware reactive play materially stronger than doing nothing", () => {
    const audit = auditTrafficBalance(64, 900);
    expect(audit.pressure.averageTicks).toBeGreaterThan(audit.idle.averageTicks * 3);
  });

  it("prevents a fixed switching cadence from dominating reactive play", () => {
    const audit = auditTrafficBalance(64, 900);
    expect(audit.pressure.averageScore).toBeGreaterThan(audit.bestPeriodic.averageScore * 1.2);
  });
});
