export type ArchitectMode = "playing" | "complete" | "failed";
export type ModuleType = "compute" | "memory" | "noc" | "io";
export type FrequencyMode = "eco" | "balanced" | "turbo";
export type ArchitectEvent =
  | "none"
  | "collision"
  | "block_picked"
  | "block_placed"
  | "block_removed"
  | "frequency_changed"
  | "verification_passed"
  | "verification_failed"
  | "tapeout"
  | "tapeout_blocked"
  | "job_missed"
  | "complete"
  | "failed";

export type ModuleVariant = {
  id: string;
  type: ModuleType;
  name: string;
  shortName: string;
  description: string;
  performance: number;
  power: number;
  area: number;
  timing: number;
  reliability: number;
  x: number;
  y: number;
};

export type WorkloadSpec = {
  id: string;
  name: string;
  customer: string;
  brief: string;
  minPerformance: number;
  maxPower: number;
  maxArea: number;
  minTiming: number;
  hint: string;
};

export type DesignStats = {
  performance: number;
  power: number;
  area: number;
  timing: number;
  reliability: number;
};

export type ChipArchitectState = {
  playerX: number;
  playerY: number;
  vx: number;
  vy: number;
  timeLeft: number;
  jobTimeLeft: number;
  jobIndex: number;
  carriedVariantId: string | null;
  slots: Record<ModuleType, string | null>;
  frequency: FrequencyMode;
  verified: boolean;
  verificationPass: boolean;
  verificationCooldown: number;
  tapeouts: number;
  missedJobs: number;
  reputation: number;
  points: number;
  elapsed: number;
  mode: ArchitectMode;
};

export type ArchitectInput = { x: number; y: number };

export const CHIP_ARCHITECT_WORLD = { width: 1200, height: 760 } as const;
export const CHIP_ARCHITECT_SESSION_SECONDS = 300;
export const CHIP_ARCHITECT_JOB_SECONDS = 86;
export const CHIP_ARCHITECT_PLAYER_RADIUS = 15;

export const chipArchitectLayout = {
  slots: {
    compute: { x: 555, y: 290, label: "COMPUTE" },
    memory: { x: 705, y: 290, label: "MEMORY" },
    noc: { x: 555, y: 440, label: "NoC" },
    io: { x: 705, y: 440, label: "I/O" },
  },
  verify: { x: 945, y: 245 },
  tune: { x: 945, y: 445 },
  tapeout: { x: 1090, y: 350 },
  spec: { x: 625, y: 95 },
  obstacles: [
    { x: 360, y: 115, width: 165, height: 76 },
    { x: 360, y: 555, width: 165, height: 76 },
    { x: 870, y: 545, width: 150, height: 74 },
  ],
} as const;

export const moduleVariants: readonly ModuleVariant[] = [
  { id: "wide-core", type: "compute", name: "Wide Core Cluster", shortName: "WIDE", description: "Wide superscalar cores: strong general performance with significant power and area.", performance: 34, power: 27, area: 30, timing: -2, reliability: 0.96, x: 105, y: 150 },
  { id: "vector-array", type: "compute", name: "Vector Array", shortName: "VECTOR", description: "Dense vector compute: highest AI throughput, but tight timing and lower yield margin.", performance: 42, power: 31, area: 28, timing: -4, reliability: 0.94, x: 105, y: 245 },
  { id: "efficient-core", type: "compute", name: "Efficiency Core", shortName: "E-CORE", description: "Smaller efficient cores: lower peak throughput with excellent power and timing headroom.", performance: 25, power: 15, area: 20, timing: 3, reliability: 0.985, x: 105, y: 340 },

  { id: "deep-sram", type: "memory", name: "Deep SRAM", shortName: "DEEP", description: "Large local SRAM complex: feeds compute well but consumes die area.", performance: 28, power: 18, area: 34, timing: -1, reliability: 0.965, x: 245, y: 150 },
  { id: "banked-sram", type: "memory", name: "Banked SRAM", shortName: "BANKED", description: "Balanced banked memory with good bandwidth, area, and timing.", performance: 24, power: 14, area: 28, timing: 1, reliability: 0.98, x: 245, y: 245 },
  { id: "compact-sram", type: "memory", name: "Compact SRAM", shortName: "COMPACT", description: "Small memory footprint for cost-sensitive and low-power designs.", performance: 17, power: 9, area: 19, timing: 3, reliability: 0.99, x: 245, y: 340 },

  { id: "mesh-noc", type: "noc", name: "Mesh NoC", shortName: "MESH", description: "Scalable on-chip mesh with balanced throughput and routing headroom.", performance: 28, power: 17, area: 20, timing: 1, reliability: 0.975, x: 105, y: 520 },
  { id: "crossbar-noc", type: "noc", name: "Crossbar NoC", shortName: "XBAR", description: "Very high bandwidth at the cost of power, area, and timing closure.", performance: 35, power: 25, area: 24, timing: -4, reliability: 0.955, x: 105, y: 615 },
  { id: "ring-noc", type: "noc", name: "Ring NoC", shortName: "RING", description: "Compact low-power fabric for smaller dies and modest traffic.", performance: 19, power: 10, area: 14, timing: 3, reliability: 0.99, x: 105, y: 700 },

  { id: "serdes-224", type: "io", name: "224G SerDes", shortName: "224G", description: "Maximum off-chip bandwidth with a severe power and timing tax.", performance: 38, power: 27, area: 18, timing: -4, reliability: 0.95, x: 245, y: 520 },
  { id: "serdes-112", type: "io", name: "112G SerDes", shortName: "112G", description: "Balanced high-speed I/O with proven implementation margin.", performance: 26, power: 17, area: 14, timing: -1, reliability: 0.98, x: 245, y: 615 },
  { id: "lp-io", type: "io", name: "Low-Power I/O", shortName: "LP-I/O", description: "Low-power interface block for edge and embedded products.", performance: 16, power: 8, area: 12, timing: 3, reliability: 0.99, x: 245, y: 700 },
] as const;

export const workloadSpecs: readonly WorkloadSpec[] = [
  { id: "ai-inference", name: "AI Inference ASIC", customer: "Helix Compute", brief: "Push token throughput without blowing the rack power envelope.", minPerformance: 120, maxPower: 92, maxArea: 102, minTiming: 0, hint: "Vector compute likes bandwidth. Do not ignore timing closure." },
  { id: "edge-vision", name: "Edge Vision SoC", customer: "Northstar Robotics", brief: "Fit useful vision inference into a tight thermal and die-size budget.", minPerformance: 84, maxPower: 50, maxArea: 78, minTiming: 4, hint: "Efficiency and timing margin matter more than peak bandwidth." },
  { id: "network-switch", name: "Network Switch ASIC", customer: "BluePeak Networks", brief: "Build a fast switching die around high-speed I/O without missing timing.", minPerformance: 118, maxPower: 82, maxArea: 96, minTiming: 0, hint: "The fastest I/O can force you to back off frequency elsewhere." },
  { id: "storage-controller", name: "Storage Controller", customer: "Granite Systems", brief: "Balance memory movement, reliability, and cost for a high-volume controller.", minPerformance: 108, maxPower: 86, maxArea: 106, minTiming: 0, hint: "A balanced fabric and memory system beats brute force here." },
] as const;

const frequencyModes: Record<FrequencyMode, { performance: number; power: number; timing: number }> = {
  eco: { performance: 0.88, power: 0.82, timing: 3 },
  balanced: { performance: 1, power: 1, timing: 0 },
  turbo: { performance: 1.15, power: 1.2, timing: -4 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function circleRectCollision(x: number, y: number, radius: number, rect: { x: number; y: number; width: number; height: number }) {
  const nearestX = clamp(x, rect.x, rect.x + rect.width);
  const nearestY = clamp(y, rect.y, rect.y + rect.height);
  return Math.hypot(x - nearestX, y - nearestY) < radius;
}

export function getArchitectWorkload(state: Pick<ChipArchitectState, "jobIndex">) {
  return workloadSpecs[Math.min(state.jobIndex, workloadSpecs.length - 1)];
}

export function getModuleVariant(id: string | null) {
  return id ? moduleVariants.find((variant) => variant.id === id) ?? null : null;
}

export function designComplete(state: Pick<ChipArchitectState, "slots">) {
  return (Object.keys(state.slots) as ModuleType[]).every((type) => Boolean(state.slots[type]));
}

export function chipDesignStats(state: Pick<ChipArchitectState, "slots" | "frequency" | "jobIndex">): DesignStats {
  const variants = (Object.keys(state.slots) as ModuleType[])
    .map((type) => getModuleVariant(state.slots[type]))
    .filter((variant): variant is ModuleVariant => Boolean(variant));

  let performance = variants.reduce((sum, variant) => sum + variant.performance, 0);
  let power = variants.reduce((sum, variant) => sum + variant.power, 0);
  let area = variants.reduce((sum, variant) => sum + variant.area, 0);
  let timing = 5 + variants.reduce((sum, variant) => sum + variant.timing, 0);
  const reliability = variants.length ? variants.reduce((sum, variant) => sum + variant.reliability, 0) / variants.length : 0;
  const workload = getArchitectWorkload(state);
  const ids = new Set(variants.map((variant) => variant.id));

  if (workload.id === "ai-inference" && ids.has("vector-array") && ids.has("mesh-noc") && (ids.has("banked-sram") || ids.has("deep-sram"))) {
    performance += 15;
    power += 4;
  }
  if (workload.id === "edge-vision" && ids.has("efficient-core") && ids.has("compact-sram") && ids.has("ring-noc") && ids.has("lp-io")) {
    performance += 12;
    power -= 4;
    timing += 2;
  }
  if (workload.id === "network-switch" && ids.has("serdes-224") && (ids.has("mesh-noc") || ids.has("crossbar-noc"))) {
    performance += 18;
    power += 5;
  }
  if (workload.id === "storage-controller" && ids.has("deep-sram") && ids.has("mesh-noc") && ids.has("serdes-112")) {
    performance += 8;
    timing += 1;
  }

  const mode = frequencyModes[state.frequency];
  performance *= mode.performance;
  power *= mode.power;
  timing += mode.timing;

  return {
    performance: Math.round(performance * 10) / 10,
    power: Math.round(power * 10) / 10,
    area: Math.round(area * 10) / 10,
    timing: Math.round(timing * 10) / 10,
    reliability: Math.round(reliability * 1000) / 1000,
  };
}

export function verificationCanPass(state: Pick<ChipArchitectState, "slots" | "frequency" | "jobIndex">) {
  if (!designComplete(state)) return false;
  const stats = chipDesignStats(state);
  return stats.timing >= 0 && stats.reliability >= 0.94;
}

export function tapeoutReady(state: Pick<ChipArchitectState, "slots" | "frequency" | "jobIndex" | "verified" | "verificationPass">) {
  if (!state.verified || !state.verificationPass || !designComplete(state)) return false;
  const stats = chipDesignStats(state);
  const spec = getArchitectWorkload(state);
  return stats.performance >= spec.minPerformance && stats.power <= spec.maxPower && stats.area <= spec.maxArea && stats.timing >= spec.minTiming;
}

export function chipArchitectScore(state: Pick<ChipArchitectState, "points" | "reputation" | "tapeouts" | "missedJobs">) {
  return Math.max(0, Math.round(state.points + state.reputation * 5 + state.tapeouts * 200 - state.missedJobs * 120));
}

export function createChipArchitectState(): ChipArchitectState {
  return {
    playerX: 610,
    playerY: 650,
    vx: 0,
    vy: 0,
    timeLeft: CHIP_ARCHITECT_SESSION_SECONDS,
    jobTimeLeft: CHIP_ARCHITECT_JOB_SECONDS,
    jobIndex: 0,
    carriedVariantId: null,
    slots: { compute: null, memory: null, noc: null, io: null },
    frequency: "balanced",
    verified: false,
    verificationPass: false,
    verificationCooldown: 0,
    tapeouts: 0,
    missedJobs: 0,
    reputation: 100,
    points: 0,
    elapsed: 0,
    mode: "playing",
  };
}

function resetDesignForNextJob(state: ChipArchitectState, nextIndex: number): ChipArchitectState {
  return {
    ...state,
    jobIndex: nextIndex,
    jobTimeLeft: CHIP_ARCHITECT_JOB_SECONDS,
    carriedVariantId: null,
    slots: { compute: null, memory: null, noc: null, io: null },
    frequency: "balanced",
    verified: false,
    verificationPass: false,
    verificationCooldown: 0,
  };
}

export function architectPrompt(state: ChipArchitectState) {
  if (state.mode !== "playing") return "";
  const carried = getModuleVariant(state.carriedVariantId);

  const nearbyVariant = moduleVariants.find((variant) => distance(state.playerX, state.playerY, variant.x, variant.y) <= 44);
  if (nearbyVariant) {
    if (carried) return `CARRYING ${carried.shortName} · PLACE IT OR RETURN IT FIRST`;
    return `E · PICK UP ${nearbyVariant.name.toUpperCase()}`;
  }

  for (const type of Object.keys(chipArchitectLayout.slots) as ModuleType[]) {
    const slot = chipArchitectLayout.slots[type];
    if (distance(state.playerX, state.playerY, slot.x, slot.y) <= 50) {
      const installed = getModuleVariant(state.slots[type]);
      if (carried && carried.type === type) return `E · INSTALL ${carried.shortName} IN ${slot.label}`;
      if (carried) return `${slot.label} ONLY ACCEPTS ${type.toUpperCase()} IP`;
      if (installed) return `E · REMOVE ${installed.shortName}`;
      return `${slot.label} SLOT EMPTY`;
    }
  }

  if (distance(state.playerX, state.playerY, chipArchitectLayout.verify.x, chipArchitectLayout.verify.y) <= 58) {
    if (!designComplete(state)) return "BUILD ALL FOUR BLOCKS BEFORE VERIFICATION";
    if (state.verificationCooldown > 0) return `VERIFICATION RUNNING · ${Math.ceil(state.verificationCooldown)}s`;
    return state.verified ? "VERIFICATION COMPLETE · CHANGE DESIGN TO RERUN" : "E · RUN RTL / TIMING VERIFICATION";
  }

  if (distance(state.playerX, state.playerY, chipArchitectLayout.tune.x, chipArchitectLayout.tune.y) <= 58) {
    return `E · CLOCK MODE ${state.frequency.toUpperCase()} → ${state.frequency === "balanced" ? "TURBO" : state.frequency === "turbo" ? "ECO" : "BALANCED"}`;
  }

  if (distance(state.playerX, state.playerY, chipArchitectLayout.tapeout.x, chipArchitectLayout.tapeout.y) <= 58) {
    return tapeoutReady(state) ? "E · TAPE OUT DESIGN" : "TAPEOUT BLOCKED · HIT VERIFIED PPA TARGETS";
  }

  return carried ? `CARRYING ${carried.shortName} · FIND THE ${carried.type.toUpperCase()} SLOT` : "MOVE THROUGH THE LAB · BUILD THE CUSTOMER CHIP";
}

export function interactChipArchitect(state: ChipArchitectState): { state: ChipArchitectState; event: ArchitectEvent } {
  if (state.mode !== "playing") return { state, event: "none" };
  const carried = getModuleVariant(state.carriedVariantId);

  const nearbyVariant = moduleVariants.find((variant) => distance(state.playerX, state.playerY, variant.x, variant.y) <= 44);
  if (nearbyVariant && !carried) {
    return { state: { ...state, carriedVariantId: nearbyVariant.id }, event: "block_picked" };
  }

  for (const type of Object.keys(chipArchitectLayout.slots) as ModuleType[]) {
    const slot = chipArchitectLayout.slots[type];
    if (distance(state.playerX, state.playerY, slot.x, slot.y) > 50) continue;
    const installed = state.slots[type];
    if (carried && carried.type === type) {
      const slots = { ...state.slots, [type]: carried.id };
      return {
        state: { ...state, slots, carriedVariantId: installed, verified: false, verificationPass: false },
        event: "block_placed",
      };
    }
    if (!carried && installed) {
      const slots = { ...state.slots, [type]: null };
      return {
        state: { ...state, slots, carriedVariantId: installed, verified: false, verificationPass: false },
        event: "block_removed",
      };
    }
    return { state, event: "none" };
  }

  if (distance(state.playerX, state.playerY, chipArchitectLayout.verify.x, chipArchitectLayout.verify.y) <= 58) {
    if (!designComplete(state) || state.verificationCooldown > 0 || state.verified) return { state, event: "none" };
    const pass = verificationCanPass(state);
    return {
      state: { ...state, verified: true, verificationPass: pass, verificationCooldown: 5.5 },
      event: pass ? "verification_passed" : "verification_failed",
    };
  }

  if (distance(state.playerX, state.playerY, chipArchitectLayout.tune.x, chipArchitectLayout.tune.y) <= 58) {
    const next: FrequencyMode = state.frequency === "balanced" ? "turbo" : state.frequency === "turbo" ? "eco" : "balanced";
    return {
      state: { ...state, frequency: next, verified: false, verificationPass: false },
      event: "frequency_changed",
    };
  }

  if (distance(state.playerX, state.playerY, chipArchitectLayout.tapeout.x, chipArchitectLayout.tapeout.y) <= 58) {
    if (!tapeoutReady(state)) return { state, event: "tapeout_blocked" };
    const stats = chipDesignStats(state);
    const spec = getArchitectWorkload(state);
    const headroom = Math.max(0, stats.performance - spec.minPerformance) + Math.max(0, spec.maxPower - stats.power) + Math.max(0, spec.maxArea - stats.area) + Math.max(0, stats.timing - spec.minTiming) * 2;
    const points = state.points + 1050 + Math.round(state.jobTimeLeft * 5 + headroom * 8);
    const nextIndex = state.jobIndex + 1;
    const tapeouts = state.tapeouts + 1;
    if (nextIndex >= workloadSpecs.length) {
      return {
        state: { ...state, points, tapeouts, reputation: Math.min(100, state.reputation + 4), mode: "complete", vx: 0, vy: 0 },
        event: "complete",
      };
    }
    return {
      state: resetDesignForNextJob({ ...state, points, tapeouts, reputation: Math.min(100, state.reputation + 4) }, nextIndex),
      event: "tapeout",
    };
  }

  return { state, event: "none" };
}

export function advanceChipArchitect(state: ChipArchitectState, input: ArchitectInput, deltaSeconds: number): { state: ChipArchitectState; event: ArchitectEvent } {
  if (state.mode !== "playing") return { state, event: "none" };
  const dt = clamp(deltaSeconds, 0, 0.05);
  const magnitude = Math.hypot(input.x, input.y);
  const nx = magnitude > 1 ? input.x / magnitude : input.x;
  const ny = magnitude > 1 ? input.y / magnitude : input.y;
  const speed = 255;
  const blend = Math.min(1, dt * 10);
  let vx = state.vx + (nx * speed - state.vx) * blend;
  let vy = state.vy + (ny * speed - state.vy) * blend;
  let playerX = clamp(state.playerX + vx * dt, CHIP_ARCHITECT_PLAYER_RADIUS + 8, CHIP_ARCHITECT_WORLD.width - CHIP_ARCHITECT_PLAYER_RADIUS - 8);
  let playerY = clamp(state.playerY + vy * dt, CHIP_ARCHITECT_PLAYER_RADIUS + 8, CHIP_ARCHITECT_WORLD.height - CHIP_ARCHITECT_PLAYER_RADIUS - 8);
  let event: ArchitectEvent = "none";

  if (chipArchitectLayout.obstacles.some((rect) => circleRectCollision(playerX, playerY, CHIP_ARCHITECT_PLAYER_RADIUS, rect))) {
    playerX = state.playerX;
    playerY = state.playerY;
    vx *= -0.08;
    vy *= -0.08;
    event = "collision";
  }

  let next: ChipArchitectState = {
    ...state,
    playerX,
    playerY,
    vx,
    vy,
    elapsed: state.elapsed + dt,
    timeLeft: Math.max(0, state.timeLeft - dt),
    jobTimeLeft: Math.max(0, state.jobTimeLeft - dt),
    verificationCooldown: Math.max(0, state.verificationCooldown - dt),
  };

  if (next.jobTimeLeft <= 0) {
    const missedJobs = next.missedJobs + 1;
    const reputation = Math.max(0, next.reputation - 18);
    const nextIndex = next.jobIndex + 1;
    if (reputation <= 0) {
      return { state: { ...next, missedJobs, reputation, mode: "failed", vx: 0, vy: 0 }, event: "failed" };
    }
    if (nextIndex >= workloadSpecs.length) {
      return { state: { ...next, missedJobs, reputation, mode: "complete", vx: 0, vy: 0 }, event: "complete" };
    }
    next = resetDesignForNextJob({ ...next, missedJobs, reputation }, nextIndex);
    event = "job_missed";
  }

  if (next.timeLeft <= 0) {
    next = { ...next, timeLeft: 0, mode: "complete", vx: 0, vy: 0 };
    return { state: next, event: "complete" };
  }

  return { state: next, event };
}
