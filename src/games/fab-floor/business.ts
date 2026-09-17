import { fabFloorScore, type FabFloorState, type FabToolId } from "./model";

export type FabNodeId = "28nm-planar" | "7nm-finfet" | "3nm-gaa";
export type FabBusinessEvent = "none" | "capex_upgrade" | "technician_hired" | "contract_won" | "contract_missed" | "node_advanced";

export type FabNodeProgram = {
  id: FabNodeId;
  label: string;
  description: string;
  minYieldAdd: number;
  rewardAdd: number;
  qualityDragPerSecond: number;
  wearMultiplier: number;
};

export type FabContract = {
  id: string;
  label: string;
  customer: string;
  requiredLots: number;
  minYield: number;
  deadline: number;
  reward: number;
  missPenalty: number;
};

export type FabBusinessState = {
  nodeIndex: number;
  contractIndex: number;
  contractLots: number;
  contractGoodDie: number;
  contractScrap: number;
  contractTimeLeft: number;
  contractsWon: number;
  contractsMissed: number;
  upgrades: Record<FabToolId, number>;
  technicians: number;
  notice: string;
  noticeTimer: number;
};

export const fabBusinessLayout = {
  capex: { x: 125, y: 120 },
  operations: { x: 1090, y: 120 },
} as const;

export const FAB_NODE_PROGRAMS: readonly FabNodeProgram[] = [
  {
    id: "28nm-planar",
    label: "28nm PLANAR",
    description: "Mature-node production with forgiving process windows and lower ASPs.",
    minYieldAdd: 0,
    rewardAdd: 0,
    qualityDragPerSecond: 0,
    wearMultiplier: 1,
  },
  {
    id: "7nm-finfet",
    label: "7nm FINFET",
    description: "Tighter process windows raise value per lot but make yield and uptime more demanding.",
    minYieldAdd: 0.012,
    rewardAdd: 6,
    qualityDragPerSecond: 0.000045,
    wearMultiplier: 1.12,
  },
  {
    id: "3nm-gaa",
    label: "3nm GAA",
    description: "Leading-edge production pays more, but excursions and tool health matter much more.",
    minYieldAdd: 0.022,
    rewardAdd: 12,
    qualityDragPerSecond: 0.00009,
    wearMultiplier: 1.25,
  },
] as const;

const CONTRACT_TEMPLATES: readonly FabContract[] = [
  { id: "auto-mcu", label: "AUTO MCU QUALIFICATION", customer: "Mobility Systems", requiredLots: 2, minYield: 0.925, deadline: 62, reward: 13, missPenalty: 8 },
  { id: "ai-ramp", label: "AI ACCELERATOR RAMP", customer: "ComputeWorks", requiredLots: 3, minYield: 0.945, deadline: 72, reward: 19, missPenalty: 11 },
  { id: "rf-defense", label: "RF / DEFENSE LOT", customer: "Aerospace RF", requiredLots: 2, minYield: 0.958, deadline: 66, reward: 17, missPenalty: 10 },
  { id: "hpc-lead", label: "HPC LEAD LOTS", customer: "Frontier Compute", requiredLots: 3, minYield: 0.968, deadline: 76, reward: 24, missPenalty: 13 },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

export function createFabBusinessState(): FabBusinessState {
  return {
    nodeIndex: 0,
    contractIndex: 0,
    contractLots: 0,
    contractGoodDie: 0,
    contractScrap: 0,
    contractTimeLeft: CONTRACT_TEMPLATES[0].deadline,
    contractsWon: 0,
    contractsMissed: 0,
    upgrades: { lithography: 0, etch: 0, metrology: 0 },
    technicians: 0,
    notice: "First customer order is live — protect yield while keeping WIP moving.",
    noticeTimer: 6,
  };
}

export function fabNodeProgram(state: FabBusinessState) {
  return FAB_NODE_PROGRAMS[Math.min(FAB_NODE_PROGRAMS.length - 1, state.nodeIndex)];
}

export function activeFabContract(state: FabBusinessState): FabContract {
  const template = CONTRACT_TEMPLATES[state.contractIndex % CONTRACT_TEMPLATES.length];
  const node = fabNodeProgram(state);
  return {
    ...template,
    minYield: clamp(template.minYield + node.minYieldAdd, 0.88, 0.99),
    reward: template.reward + node.rewardAdd,
    deadline: Math.max(48, template.deadline - state.nodeIndex * 3),
  };
}

export function fabContractYield(state: Pick<FabBusinessState, "contractGoodDie" | "contractScrap">) {
  const total = state.contractGoodDie + state.contractScrap;
  return total > 0 ? state.contractGoodDie / total : 1;
}

export function fabUpgradeCost(state: FabBusinessState, id: FabToolId) {
  const level = state.upgrades[id];
  return level >= 3 ? Infinity : 12 + level * 8;
}

export function fabTechnicianCost(state: FabBusinessState) {
  return state.technicians >= 3 ? Infinity : 10 + state.technicians * 7;
}

export function fabBusinessPrompt(core: FabFloorState, business: FabBusinessState) {
  if (core.mode !== "playing") return "";
  if (distance(core.playerX, core.playerY, fabBusinessLayout.capex.x, fabBusinessLayout.capex.y) <= 62) {
    const level = business.upgrades[core.focus];
    if (level >= 3) return `${core.focus.toUpperCase()} CAPEX MAXED`;
    const cost = fabUpgradeCost(business, core.focus);
    return core.cash >= cost
      ? `E · UPGRADE ${core.focus.toUpperCase()} TOOL L${level}→L${level + 1} · COST ${cost}`
      : `${core.focus.toUpperCase()} UPGRADE NEEDS ${cost} CASH`;
  }
  if (distance(core.playerX, core.playerY, fabBusinessLayout.operations.x, fabBusinessLayout.operations.y) <= 62) {
    if (business.technicians >= 3) return "OPERATIONS TEAM FULL";
    const cost = fabTechnicianCost(business);
    return core.cash >= cost ? `E · HIRE EQUIPMENT TECH · COST ${cost}` : `EQUIPMENT TECH NEEDS ${cost} CASH`;
  }
  return "";
}

export function interactFabBusiness(
  core: FabFloorState,
  business: FabBusinessState,
): { core: FabFloorState; business: FabBusinessState; event: FabBusinessEvent } {
  if (core.mode !== "playing") return { core, business, event: "none" };

  if (distance(core.playerX, core.playerY, fabBusinessLayout.capex.x, fabBusinessLayout.capex.y) <= 62) {
    const id = core.focus;
    const level = business.upgrades[id];
    const cost = fabUpgradeCost(business, id);
    if (level >= 3 || !Number.isFinite(cost) || core.cash < cost) return { core, business, event: "none" };
    return {
      core: { ...core, cash: Math.max(0, core.cash - cost) },
      business: {
        ...business,
        upgrades: { ...business.upgrades, [id]: level + 1 },
        notice: `${id.toUpperCase()} CAPEX ONLINE · LEVEL ${level + 1}`,
        noticeTimer: 5,
      },
      event: "capex_upgrade",
    };
  }

  if (distance(core.playerX, core.playerY, fabBusinessLayout.operations.x, fabBusinessLayout.operations.y) <= 62) {
    const cost = fabTechnicianCost(business);
    if (business.technicians >= 3 || !Number.isFinite(cost) || core.cash < cost) return { core, business, event: "none" };
    return {
      core: { ...core, cash: Math.max(0, core.cash - cost) },
      business: {
        ...business,
        technicians: business.technicians + 1,
        notice: `EQUIPMENT TECH HIRED · TEAM ${business.technicians + 1}/3`,
        noticeTimer: 5,
      },
      event: "technician_hired",
    };
  }

  return { core, business, event: "none" };
}

function nextContract(state: FabBusinessState, contractsWon: number, contractsMissed: number) {
  const nextIndex = state.contractIndex + 1;
  const previousNode = state.nodeIndex;
  const nodeIndex = contractsWon >= 4 ? 2 : contractsWon >= 2 ? 1 : 0;
  const seedState: FabBusinessState = {
    ...state,
    nodeIndex,
    contractIndex: nextIndex,
    contractLots: 0,
    contractGoodDie: 0,
    contractScrap: 0,
    contractsWon,
    contractsMissed,
  };
  return {
    state: { ...seedState, contractTimeLeft: activeFabContract(seedState).deadline },
    nodeAdvanced: nodeIndex > previousNode,
  };
}

export function advanceFabBusiness(
  before: FabFloorState,
  after: FabFloorState,
  business: FabBusinessState,
  dtRaw: number,
): { core: FabFloorState; business: FabBusinessState; event: FabBusinessEvent } {
  if (after.mode !== "playing" && before.mode !== "playing") return { core: after, business, event: "none" };
  const dt = clamp(dtRaw, 0, 0.05);
  const node = fabNodeProgram(business);

  const lots = after.lots.map((lot) => {
    const level = business.upgrades[lot.stage];
    const speedBoost = level * 0.045 * dt;
    const metrologyLearning = lot.stage === "metrology" ? level * 0.000025 * dt : 0;
    return {
      ...lot,
      progress: Math.min(0.995, lot.progress + speedBoost),
      quality: clamp(lot.quality + metrologyLearning - node.qualityDragPerSecond * dt, 0.68, 0.995),
    };
  });

  const tools = { ...after.tools };
  for (const id of Object.keys(tools) as FabToolId[]) {
    const tool = tools[id];
    const queue = lots.filter((lot) => lot.stage === id).length;
    const technicianAssist = business.technicians * 0.32 * dt;
    const upgradeAssist = business.upgrades[id] * 0.006 * dt;
    const nodeWear = Math.max(0, node.wearMultiplier - 1) * (0.04 + queue * 0.008) * dt;
    const maintenance = tool.maintenance > 0 ? Math.max(0, tool.maintenance - technicianAssist) : tool.maintenance;
    tools[id] = {
      ...tool,
      maintenance,
      health: maintenance === 0 && tool.maintenance > 0
        ? 99
        : clamp(tool.health + upgradeAssist - nodeWear, 0, 100),
    };
  }

  let core: FabFloorState = { ...after, lots, tools };
  let next: FabBusinessState = {
    ...business,
    contractTimeLeft: Math.max(0, business.contractTimeLeft - dt),
    noticeTimer: Math.max(0, business.noticeTimer - dt),
  };

  const completedDelta = Math.max(0, after.completedLots - before.completedLots);
  const goodDelta = Math.max(0, after.goodDie - before.goodDie);
  const scrapDelta = Math.max(0, after.scrap - before.scrap);
  if (completedDelta > 0) {
    next = {
      ...next,
      contractLots: next.contractLots + completedDelta,
      contractGoodDie: next.contractGoodDie + goodDelta,
      contractScrap: next.contractScrap + scrapDelta,
    };
  }

  const contract = activeFabContract(next);
  const contractYield = fabContractYield(next);
  if (next.contractLots >= contract.requiredLots && contractYield >= contract.minYield) {
    const won = next.contractsWon + 1;
    core = { ...core, cash: clamp(core.cash + contract.reward, 0, 100), reputation: clamp(core.reputation + 4, 0, 100) };
    const advanced = nextContract(next, won, next.contractsMissed);
    next = {
      ...advanced.state,
      notice: advanced.nodeAdvanced
        ? `${contract.label} WON · NEW NODE PROGRAM ${fabNodeProgram(advanced.state).label}`
        : `${contract.label} WON · +${contract.reward} CASH`,
      noticeTimer: 7,
    };
    return { core, business: next, event: advanced.nodeAdvanced ? "node_advanced" : "contract_won" };
  }

  if (next.contractTimeLeft <= 0) {
    const missed = next.contractsMissed + 1;
    core = { ...core, reputation: clamp(core.reputation - contract.missPenalty, 0, 100) };
    const advanced = nextContract(next, next.contractsWon, missed);
    next = {
      ...advanced.state,
      notice: `${contract.label} MISSED · -${contract.missPenalty} REPUTATION`,
      noticeTimer: 7,
    };
    return { core, business: next, event: "contract_missed" };
  }

  return { core, business: next, event: "none" };
}

export function fabBusinessScore(core: FabFloorState, business: FabBusinessState) {
  const upgradeLevels = Object.values(business.upgrades).reduce((sum, level) => sum + level, 0);
  return fabFloorScore(core)
    + business.contractsWon * 450
    - business.contractsMissed * 220
    + business.nodeIndex * 350
    + upgradeLevels * 120
    + business.technicians * 90;
}
