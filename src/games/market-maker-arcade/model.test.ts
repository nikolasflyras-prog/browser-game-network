import { describe, expect, it } from "vitest";
import { MARKET_SESSION_SECONDS, advanceMarketFloor, createMarketFloorState, interactMarketFloor, marketFloorLayout, scoreMarketFloor } from "./model";

describe("market maker arcade model", () => {
  it("starts as a multi-minute trading-floor session", () => {
    const state = createMarketFloorState();
    expect(state.timeLeft).toBe(MARKET_SESSION_SECONDS);
    expect(state.timeLeft).toBeGreaterThanOrEqual(180);
    expect(state.orders.length).toBeGreaterThan(0);
  });

  it("moves the dealer continuously through the floor", () => {
    const state = createMarketFloorState();
    const next = advanceMarketFloor(state, { x: 1, y: 0, dash: false }, 0.05).state;
    expect(next.playerX).toBeGreaterThan(state.playerX);
    expect(next.dashEnergy).toBe(100);
  });

  it("lets the dealer physically pick up a nearby client order", () => {
    const state = createMarketFloorState();
    const order = state.orders[0];
    const result = interactMarketFloor({ ...state, playerX: order.x, playerY: order.y });
    expect(result.event).toBe("picked_up");
    expect(result.state.carried?.id).toBe(order.id);
    expect(result.state.orders).toHaveLength(0);
  });

  it("executes carried flow at the safe venue and changes inventory", () => {
    const state = createMarketFloorState();
    const order = state.orders[0];
    const venue = marketFloorLayout.venues[0];
    const result = interactMarketFloor({ ...state, orders: [], carried: order, playerX: venue.x, playerY: venue.y });
    expect(result.event).toBe("filled");
    expect(result.state.carried).toBeNull();
    expect(result.state.inventory).toBe(-order.size);
    expect(result.state.completed).toBe(1);
  });

  it("lets the hedge station reduce inventory at a cost", () => {
    const state = createMarketFloorState();
    const result = interactMarketFloor({ ...state, inventory: 5, playerX: marketFloorLayout.hedge.x, playerY: marketFloorLayout.hedge.y });
    expect(result.event).toBe("hedged");
    expect(result.state.inventory).toBe(3);
    expect(result.state.cash).toBeGreaterThan(0);
  });

  it("punishes ignored client flow and reflects it in score", () => {
    const state = createMarketFloorState();
    const ignored = { ...state, orders: [{ ...state.orders[0], timeLeft: 0.01 }] };
    const result = advanceMarketFloor(ignored, { x: 0, y: 0, dash: false }, 0.05);
    expect(result.event).toBe("order_missed");
    expect(result.state.missed).toBe(1);
    expect(result.state.reputation).toBeLessThan(100);
    expect(scoreMarketFloor(result.state)).toBeLessThan(scoreMarketFloor(state));
  });
});
