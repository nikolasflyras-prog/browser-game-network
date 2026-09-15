import type { ScenarioRules, ScenarioStep } from "../scenario-engine";

export type SupplyMetric = "cash" | "service" | "inventory" | "resilience" | "backlog";

export const initialSupplyMetrics: Record<SupplyMetric, number> = {
  cash: 70,
  service: 88,
  inventory: 45,
  resilience: 35,
  backlog: 12,
};

export const supplyChainRules: ScenarioRules<SupplyMetric> = {
  min: { cash: 0, service: 0, inventory: 0, resilience: 0, backlog: 0 },
  max: { cash: 100, service: 100, inventory: 100, resilience: 100, backlog: 100 },
};

function consumeSafetyStock(metrics: Record<SupplyMetric, number>) {
  if (metrics.inventory < 60) return {};
  return { service: 14, backlog: -14, inventory: -16 } satisfies Partial<Record<SupplyMetric, number>>;
}

export const supplyChainScenarios: readonly ScenarioStep<SupplyMetric>[] = [
  {
    id: "supplier-warning",
    title: "Supplier warning",
    prompt: "Your sole display-controller supplier reports unstable yields. Demand is still normal. What do you do before anything actually breaks?",
    choices: [
      {
        id: "dual-source",
        label: "Qualify a second supplier",
        detail: "Spend now to create an alternate source.",
        impacts: { cash: -18, resilience: 24, inventory: 3 },
        feedback: "You paid a meaningful qualification cost, but created alternate capacity before the disruption arrived.",
      },
      {
        id: "safety-stock",
        label: "Build safety stock",
        detail: "Buy extra units while supply is available.",
        impacts: { cash: -7, inventory: 20, resilience: 10 },
        feedback: "Buffer inventory tied up working capital, but it can absorb a near-term logistics shock.",
      },
      {
        id: "wait",
        label: "Wait for evidence",
        detail: "Preserve cash and avoid overreacting.",
        impacts: { cash: 3, resilience: -7 },
        feedback: "You preserved cash, but remained exposed to a single point of failure.",
      },
    ],
  },
  {
    id: "port-delay",
    title: "Port congestion",
    prompt: "Ocean lead times jump by three weeks and customer orders are already scheduled.",
    choices: [
      {
        id: "airfreight",
        label: "Use air freight",
        detail: "Protect service at a steep logistics cost.",
        impacts: { cash: -14, service: 8, backlog: -8 },
        resolveImpacts: consumeSafetyStock,
        feedback: "Expediting protected customers. If you built safety stock earlier, that buffer also absorbs part of the delay.",
      },
      {
        id: "prioritize",
        label: "Prioritize key customers",
        detail: "Allocate scarce inventory to the highest-value accounts.",
        impacts: { service: 2, backlog: 3, inventory: -5, cash: 2 },
        resolveImpacts: consumeSafetyStock,
        feedback: "Allocation limited the damage; prior safety stock makes the tradeoff materially easier.",
      },
      {
        id: "accept-delay",
        label: "Accept the delay",
        detail: "Avoid expedite costs and wait for the network to clear.",
        impacts: { cash: 4, service: -12, backlog: 14 },
        resolveImpacts: consumeSafetyStock,
        feedback: "Cash was preserved. Any earlier safety stock is consumed to cushion service and backlog before the delay reaches customers.",
      },
    ],
  },
  {
    id: "demand-spike",
    title: "Demand spike",
    prompt: "A competitor recalls a major product and your weekly orders jump 35%.",
    choices: [
      {
        id: "overtime",
        label: "Add overtime",
        detail: "Push the current network harder for four weeks.",
        impacts: { cash: -8, service: 9, backlog: -7, resilience: -5 },
        feedback: "Overtime captured the demand spike, but reduced operating slack and increased fatigue risk.",
      },
      {
        id: "ration",
        label: "Cap new orders",
        detail: "Protect existing commitments and refuse marginal demand.",
        impacts: { service: 5, backlog: -2, cash: -2 },
        feedback: "You protected promised service but left some upside on the table.",
      },
      {
        id: "chase-all",
        label: "Accept every order",
        detail: "Maximize bookings now and solve fulfillment later.",
        impacts: { cash: 8, backlog: 20, service: -10 },
        feedback: "Bookings surged, but the operating system could not support the promise dates.",
      },
    ],
  },
  {
    id: "supplier-failure",
    title: "Supplier shutdown",
    prompt: "The original supplier stops shipments for six weeks. Your preparation is now tested.",
    choices: [
      {
        id: "activate-backup",
        label: "Activate alternate capacity",
        detail: "Shift volume to supply you qualified before the shutdown.",
        impacts: { cash: -8, service: 6, resilience: 8, backlog: -9 },
        requirements: { resilience: { min: 50 } },
        unavailableFeedback: "You do not have enough qualified alternate capacity to activate a backup supplier.",
        feedback: "Prepared alternate capacity converted an earlier resilience investment into real service protection.",
      },
      {
        id: "broker-market",
        label: "Buy from brokers",
        detail: "Source spot inventory at a large premium.",
        impacts: { cash: -18, service: 4, backlog: -5, resilience: -2 },
        feedback: "Spot purchasing bridged the gap, but at a severe cost and with little long-term resilience benefit.",
      },
      {
        id: "production-cut",
        label: "Cut production",
        detail: "Protect cash and wait for normal supply.",
        impacts: { cash: 5, service: -18, backlog: 20 },
        feedback: "You protected liquidity but transferred the disruption directly to customers.",
      },
    ],
  },
] as const;

export function supplyChainCapabilities(metrics: Record<SupplyMetric, number>) {
  return {
    alternateCapacityReady: metrics.resilience >= 50,
    safetyStockReady: metrics.inventory >= 60,
  } as const;
}

export function supplyChainFinalScore(metrics: Record<SupplyMetric, number>) {
  const cashHealth = metrics.cash;
  const backlogControl = 100 - metrics.backlog;
  const excessInventoryPenalty = Math.max(0, metrics.inventory - 70) * 0.5;
  const raw = metrics.service * 0.35 + metrics.resilience * 0.25 + cashHealth * 0.2 + backlogControl * 0.2;
  return Math.max(0, Math.round(raw - excessInventoryPenalty));
}

export function operatingStyle(metrics: Record<SupplyMetric, number>) {
  if (metrics.resilience >= 70 && metrics.inventory <= 70) return "resilient" as const;
  if (metrics.inventory >= 75) return "over-buffered" as const;
  if (metrics.cash >= 75 && metrics.resilience < 45) return "lean" as const;
  return "reactive" as const;
}
