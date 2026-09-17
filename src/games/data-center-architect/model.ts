export type RackType = "compute" | "network" | "power" | "cooling" | "storage";
export type DataCenterEvent =
  | "none"
  | "rack_picked"
  | "rack_placed"
  | "rack_removed"
  | "deploy_started"
  | "deploy_blocked"
  | "fault"
  | "repair_kit"
  | "repair_started"
  | "workload_complete"
  | "session_complete"
  | "collision";
export type WorkloadId = "training" | "inference" | "hpc";
export type RackSpec = {
  id: RackType;
  name: string;
  compute: number;
  network: number;
  powerCapacity: number;
  powerDraw: number;
  cooling: number;
  storage: number;
  heat: number;
};
export type WorkloadSpec = {
  id: WorkloadId;
  name: string;
  duration: number;
  compute: number;
  network: number;
  storage: number;
  maxHeat: number;
  redundancy: number;
};
export type DataCenterState = {
  playerX: number;
  playerY: number;
  vx: number;
  vy: number;
  timeLeft: number;
  elapsed: number;
  slots: Array<RackType | null>;
  carried: RackType | null;
  carryingRepairKit: boolean;
  workloadIndex: number;
  workloadRunning: boolean;
  workloadTime: number;
  uptime: number;
  slaBreaches: number;
  faultSlot: number | null;
  faultTimer: number;
  repairTimer: number;
  seed: number;
  completedWorkloads: number;
  budget: number;
  reputation: number;
  mode: "playing" | "complete" | "failed";
};

export const DATA_CENTER_WORLD = { width: 1320, height: 800 } as const;
export const DATA_CENTER_SECONDS = 390;

export const rackSpecs: Record<RackType, RackSpec> = {
  compute: { id: "compute", name: "GPU Compute Rack", compute: 48, network: 0, powerCapacity: 0, powerDraw: 18, cooling: 0, storage: 0, heat: 24 },
  network: { id: "network", name: "800G Fabric Rack", compute: 0, network: 72, powerCapacity: 0, powerDraw: 7, cooling: 0, storage: 0, heat: 7 },
  power: { id: "power", name: "UPS / PDU Rack", compute: 0, network: 0, powerCapacity: 58, powerDraw: 2, cooling: 0, storage: 0, heat: 3 },
  cooling: { id: "cooling", name: "Liquid Cooling CDU", compute: 0, network: 0, powerCapacity: 0, powerDraw: 5, cooling: 42, storage: 0, heat: 1 },
  storage: { id: "storage", name: "NVMe Storage Rack", compute: 0, network: 12, powerCapacity: 0, powerDraw: 8, cooling: 0, storage: 65, heat: 10 },
};

export const workloads: readonly WorkloadSpec[] = [
  { id: "training", name: "Frontier Training Pod", duration: 48, compute: 90, network: 75, storage: 55, maxHeat: 44, redundancy: 2 },
  { id: "inference", name: "Low-Latency Inference Fleet", duration: 42, compute: 70, network: 88, storage: 35, maxHeat: 40, redundancy: 2 },
  { id: "hpc", name: "Scientific HPC Queue", duration: 52, compute: 82, network: 62, storage: 70, maxHeat: 46, redundancy: 1 },
];

export const dataCenterLayout = {
  staging: {
    compute: { x: 110, y: 130 },
    network: { x: 110, y: 250 },
    power: { x: 110, y: 370 },
    cooling: { x: 110, y: 490 },
    storage: { x: 110, y: 610 },
  },
  slots: [
    { x: 500, y: 225 }, { x: 650, y: 225 }, { x: 800, y: 225 },
    { x: 500, y: 430 }, { x: 650, y: 430 }, { x: 800, y: 430 },
    { x: 950, y: 225 }, { x: 950, y: 430 },
  ],
  deploy: { x: 1160, y: 215 },
  repair: { x: 1160, y: 585 },
  obstacles: [
    { x: 285, y: 105, width: 130, height: 110 },
    { x: 285, y: 570, width: 130, height: 110 },
  ],
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function random(seed: number) {
  const next = (seed * 1664525 + 1013904223) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

function circleRectCollision(x: number, y: number, radius: number, rect: { x: number; y: number; width: number; height: number }) {
  const nearestX = clamp(x, rect.x, rect.x + rect.width);
  const nearestY = clamp(y, rect.y, rect.y + rect.height);
  return Math.hypot(x - nearestX, y - nearestY) < radius;
}

export function createDataCenterState(seed = 90909): DataCenterState {
  return {
    playerX: 210,
    playerY: 700,
    vx: 0,
    vy: 0,
    timeLeft: DATA_CENTER_SECONDS,
    elapsed: 0,
    slots: Array(8).fill(null),
    carried: null,
    carryingRepairKit: false,
    workloadIndex: 0,
    workloadRunning: false,
    workloadTime: 0,
    uptime: 0,
    slaBreaches: 0,
    faultSlot: null,
    faultTimer: 35,
    repairTimer: 0,
    seed: seed >>> 0,
    completedWorkloads: 0,
    budget: 100,
    reputation: 100,
    mode: "playing",
  };
}

function neighbors(index: number) {
  const position = dataCenterLayout.slots[index];
  return dataCenterLayout.slots
    .map((candidate, candidateIndex) => ({ candidateIndex, distance: distance(position.x, position.y, candidate.x, candidate.y) }))
    .filter((entry) => entry.candidateIndex !== index && entry.distance < 230)
    .map((entry) => entry.candidateIndex);
}

export function dataCenterStats(state: Pick<DataCenterState, "slots" | "faultSlot">) {
  let compute = 0;
  let network = 0;
  let powerCapacity = 0;
  let powerDraw = 0;
  let cooling = 0;
  let storage = 0;
  let heat = 0;

  state.slots.forEach((id, index) => {
    if (!id) return;
    const rack = rackSpecs[id];
    const faultFactor = state.faultSlot === index ? 0.4 : 1;
    compute += rack.compute * faultFactor;
    network += rack.network * faultFactor;
    powerCapacity += rack.powerCapacity * faultFactor;
    powerDraw += rack.powerDraw;
    cooling += rack.cooling * faultFactor;
    storage += rack.storage * faultFactor;
    heat += rack.heat;
  });

  state.slots.forEach((id, index) => {
    if (id !== "compute") return;
    const adjacent = neighbors(index).map((neighborIndex) => state.slots[neighborIndex]);
    if (adjacent.includes("network")) network += 12;
    if (adjacent.includes("cooling")) heat -= 8;
  });

  const redundancy = state.slots.filter((value) => value === "power").length + state.slots.filter((value) => value === "network").length * 0.5;
  const thermal = Math.max(0, heat - cooling * 0.72);
  return {
    compute: Math.round(compute),
    network: Math.round(network),
    powerCapacity: Math.round(powerCapacity),
    powerDraw: Math.round(powerDraw),
    cooling: Math.round(cooling),
    storage: Math.round(storage),
    thermal: Math.round(thermal * 10) / 10,
    redundancy: Math.round(redundancy * 10) / 10,
  };
}

export function currentWorkload(state: Pick<DataCenterState, "workloadIndex">) {
  return workloads[Math.min(state.workloadIndex, workloads.length - 1)];
}

export function dataCenterReady(state: DataCenterState) {
  const stats = dataCenterStats(state);
  const workload = currentWorkload(state);
  return stats.compute >= workload.compute
    && stats.network >= workload.network
    && stats.storage >= workload.storage
    && stats.powerCapacity >= stats.powerDraw
    && stats.thermal <= workload.maxHeat
    && stats.redundancy >= workload.redundancy;
}

export function dataCenterScore(state: DataCenterState) {
  const stats = dataCenterStats(state);
  return Math.max(0, Math.round(
    state.completedWorkloads * 900
    + state.uptime * 4
    + state.reputation * 5
    + state.budget * 2
    - state.slaBreaches * 160
    + stats.redundancy * 25,
  ));
}

function nearFaultedRack(state: DataCenterState) {
  if (state.faultSlot === null) return false;
  const position = dataCenterLayout.slots[state.faultSlot];
  return distance(state.playerX, state.playerY, position.x, position.y) <= 62;
}

export function dataCenterPrompt(state: DataCenterState) {
  if (state.mode !== "playing") return "";

  for (const id of Object.keys(dataCenterLayout.staging) as RackType[]) {
    const position = dataCenterLayout.staging[id];
    if (distance(state.playerX, state.playerY, position.x, position.y) <= 52) {
      return state.carried ? `CARRYING ${rackSpecs[state.carried].name.toUpperCase()}` : `E · PICK UP ${rackSpecs[id].name.toUpperCase()}`;
    }
  }

  // Fault handling takes priority over normal bay removal so the failed rack reads as a repair target.
  if (nearFaultedRack(state)) {
    if (state.repairTimer > 0) return `RACK REPAIR RUNNING · ${state.repairTimer.toFixed(1)}s`;
    return state.carryingRepairKit ? "E · START RACK REPAIR" : "FAULTED RACK · GET REPAIR KIT";
  }

  for (let index = 0; index < dataCenterLayout.slots.length; index += 1) {
    const position = dataCenterLayout.slots[index];
    if (distance(state.playerX, state.playerY, position.x, position.y) > 58) continue;
    if (state.carried) return `E · INSTALL ${rackSpecs[state.carried].name.toUpperCase()} IN BAY ${index + 1}`;
    if (state.slots[index]) return `E · REMOVE ${rackSpecs[state.slots[index]!].name.toUpperCase()}`;
    return `RACK BAY ${index + 1} EMPTY`;
  }

  if (distance(state.playerX, state.playerY, dataCenterLayout.deploy.x, dataCenterLayout.deploy.y) <= 62) {
    if (state.workloadRunning) return `${currentWorkload(state).name.toUpperCase()} LIVE · ${Math.ceil(state.workloadTime)}s`;
    return dataCenterReady(state) ? `E · DEPLOY ${currentWorkload(state).name.toUpperCase()}` : "DEPLOY BLOCKED · CAPACITY / THERMAL / REDUNDANCY";
  }

  if (distance(state.playerX, state.playerY, dataCenterLayout.repair.x, dataCenterLayout.repair.y) <= 62) {
    return state.carryingRepairKit ? "REPAIR KIT CARRIED" : "E · PICK UP REPAIR KIT";
  }

  return state.workloadRunning ? "KEEP SLA GREEN · WATCH POWER, NETWORK, AND THERMALS" : "BUILD THE HALL · ADJACENCY CHANGES NETWORK AND COOLING";
}

export function interactDataCenter(state: DataCenterState): { state: DataCenterState; event: DataCenterEvent } {
  if (state.mode !== "playing") return { state, event: "none" };

  for (const id of Object.keys(dataCenterLayout.staging) as RackType[]) {
    const position = dataCenterLayout.staging[id];
    if (distance(state.playerX, state.playerY, position.x, position.y) <= 52 && !state.carried) {
      return { state: { ...state, carried: id }, event: "rack_picked" };
    }
  }

  // A faulted occupied bay is a repair target first. This prevents E from removing the rack
  // when the player arrives with a repair kit, and prevents accidental removal without a kit.
  if (nearFaultedRack(state)) {
    if (state.carryingRepairKit && state.repairTimer <= 0) {
      return { state: { ...state, carryingRepairKit: false, repairTimer: 5 }, event: "repair_started" };
    }
    return { state, event: "none" };
  }

  for (let index = 0; index < dataCenterLayout.slots.length; index += 1) {
    const position = dataCenterLayout.slots[index];
    if (distance(state.playerX, state.playerY, position.x, position.y) > 58) continue;
    if (state.carried) {
      const slots = [...state.slots];
      const old = slots[index];
      slots[index] = state.carried;
      return { state: { ...state, slots, carried: old, budget: Math.max(0, state.budget - 2) }, event: "rack_placed" };
    }
    if (state.slots[index]) {
      const slots = [...state.slots];
      const old = slots[index];
      slots[index] = null;
      return { state: { ...state, slots, carried: old }, event: "rack_removed" };
    }
  }

  if (distance(state.playerX, state.playerY, dataCenterLayout.deploy.x, dataCenterLayout.deploy.y) <= 62 && !state.workloadRunning) {
    if (!dataCenterReady(state)) return { state, event: "deploy_blocked" };
    const workload = currentWorkload(state);
    return { state: { ...state, workloadRunning: true, workloadTime: workload.duration }, event: "deploy_started" };
  }

  if (distance(state.playerX, state.playerY, dataCenterLayout.repair.x, dataCenterLayout.repair.y) <= 62 && !state.carryingRepairKit) {
    return { state: { ...state, carryingRepairKit: true }, event: "repair_kit" };
  }

  return { state, event: "none" };
}

export function advanceDataCenter(state: DataCenterState, input: { x: number; y: number }, rawDelta: number): { state: DataCenterState; event: DataCenterEvent } {
  if (state.mode !== "playing") return { state, event: "none" };

  const dt = clamp(rawDelta, 0, 0.05);
  const magnitude = Math.hypot(input.x, input.y);
  const nx = magnitude > 1 ? input.x / magnitude : input.x;
  const ny = magnitude > 1 ? input.y / magnitude : input.y;
  const speed = 260;
  const blend = Math.min(1, dt * 10);
  let vx = state.vx + (nx * speed - state.vx) * blend;
  let vy = state.vy + (ny * speed - state.vy) * blend;
  let playerX = clamp(state.playerX + vx * dt, 24, DATA_CENTER_WORLD.width - 24);
  let playerY = clamp(state.playerY + vy * dt, 24, DATA_CENTER_WORLD.height - 24);
  let event: DataCenterEvent = "none";

  if (dataCenterLayout.obstacles.some((obstacle) => circleRectCollision(playerX, playerY, 15, obstacle))) {
    playerX = state.playerX;
    playerY = state.playerY;
    vx *= 0.05;
    vy *= 0.05;
    event = "collision";
  }

  let faultSlot = state.faultSlot;
  const repairTimer = Math.max(0, state.repairTimer - dt);
  let faultTimer = state.faultTimer - dt;
  let seed = state.seed;

  if (state.repairTimer > 0 && repairTimer <= 0) faultSlot = null;

  if (faultTimer <= 0 && state.workloadRunning && faultSlot === null) {
    const occupied = state.slots.map((value, index) => value !== null ? index : -1).filter((index) => index >= 0);
    const faultRoll = random(seed);
    seed = faultRoll.seed;
    if (occupied.length) {
      faultSlot = occupied[Math.floor(faultRoll.value * occupied.length)];
      event = "fault";
    }
    const timerRoll = random(seed);
    seed = timerRoll.seed;
    faultTimer = 30 + timerRoll.value * 24;
  }

  let workloadTime = state.workloadTime;
  let workloadRunning = state.workloadRunning;
  let uptime = state.uptime;
  let slaBreaches = state.slaBreaches;
  let reputation = state.reputation;
  let completedWorkloads = state.completedWorkloads;
  let workloadIndex = state.workloadIndex;
  let budget = state.budget;
  const stats = dataCenterStats({ ...state, faultSlot });

  if (workloadRunning) {
    workloadTime = Math.max(0, workloadTime - dt);
    const workload = currentWorkload(state);
    const healthy = stats.compute >= workload.compute
      && stats.network >= workload.network
      && stats.storage >= workload.storage
      && stats.powerCapacity >= stats.powerDraw
      && stats.thermal <= workload.maxHeat;
    if (healthy) uptime += dt;
    else {
      slaBreaches += dt;
      reputation = clamp(reputation - 0.55 * dt, 0, 100);
    }

    if (workloadTime <= 0) {
      workloadRunning = false;
      completedWorkloads += 1;
      budget = clamp(budget + 18, 0, 100);
      workloadIndex += 1;
      event = workloadIndex >= workloads.length ? "session_complete" : "workload_complete";
    }
  }

  const timeLeft = Math.max(0, state.timeLeft - dt);
  const mode = timeLeft <= 0 || workloadIndex >= workloads.length ? "complete" as const : reputation <= 0 ? "failed" as const : "playing" as const;

  return {
    state: {
      ...state,
      playerX,
      playerY,
      vx,
      vy,
      timeLeft,
      elapsed: state.elapsed + dt,
      faultSlot,
      faultTimer,
      repairTimer,
      seed,
      workloadTime,
      workloadRunning,
      uptime,
      slaBreaches,
      reputation,
      completedWorkloads,
      workloadIndex,
      budget,
      mode,
    },
    event,
  };
}
