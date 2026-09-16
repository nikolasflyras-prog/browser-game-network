export type PackagingMode = "playing" | "complete" | "failed";
export type ComponentType = "compute" | "hbm" | "io" | "bridge" | "optics" | "spreader";
export type BondProfile = "gentle" | "balanced" | "fast";
export type PackagingEvent =
  | "none"
  | "collision"
  | "component_picked"
  | "component_placed"
  | "component_removed"
  | "profile_changed"
  | "inspection_started"
  | "inspection_passed"
  | "inspection_failed"
  | "package_shipped"
  | "ship_blocked"
  | "job_missed"
  | "complete"
  | "failed";

export type PackageComponent = {
  id: string;
  type: ComponentType;
  name: string;
  shortName: string;
  description: string;
  compute: number;
  bandwidth: number;
  thermal: number;
  cooling: number;
  weight: number;
  yield: number;
  x: number;
  y: number;
};

export type PackageSpec = {
  id: string;
  name: string;
  customer: string;
  brief: string;
  minCompute: number;
  minBandwidth: number;
  maxThermal: number;
  maxWarpage: number;
  minYield: number;
  requirements: Partial<Record<ComponentType, number>>;
  hint: string;
};

export type PackageStats = {
  compute: number;
  bandwidth: number;
  thermalPeak: number;
  warpage: number;
  yield: number;
  occupied: number;
};

export type PackagingState = {
  playerX: number;
  playerY: number;
  vx: number;
  vy: number;
  timeLeft: number;
  jobTimeLeft: number;
  jobIndex: number;
  carriedComponentId: string | null;
  slots: Array<string | null>;
  bondProfile: BondProfile;
  inspectionPending: boolean;
  inspectionCooldown: number;
  inspected: boolean;
  inspectionPass: boolean;
  packagesShipped: number;
  missedJobs: number;
  reputation: number;
  points: number;
  elapsed: number;
  mode: PackagingMode;
};

export type PackagingInput = { x: number; y: number };

export const PACKAGING_WORLD = { width: 1200, height: 760 } as const;
export const PACKAGING_SESSION_SECONDS = 300;
export const PACKAGING_JOB_SECONDS = 88;
export const PACKAGING_PLAYER_RADIUS = 15;

export const packageSlotPositions = [
  { x: 520, y: 285 },
  { x: 650, y: 285 },
  { x: 780, y: 285 },
  { x: 520, y: 425 },
  { x: 650, y: 425 },
  { x: 780, y: 425 },
] as const;

export const packagingLayout = {
  inspect: { x: 955, y: 245 },
  profile: { x: 955, y: 455 },
  ship: { x: 1090, y: 350 },
  obstacles: [
    { x: 350, y: 115, width: 165, height: 80 },
    { x: 350, y: 555, width: 165, height: 80 },
    { x: 860, y: 555, width: 160, height: 78 },
  ],
} as const;

export const packageComponents: readonly PackageComponent[] = [
  { id: "xpu-hot", type: "compute", name: "High-Performance XPU", shortName: "XPU-H", description: "Large accelerator die with high performance density and significant heat flux.", compute: 58, bandwidth: 0, thermal: 32, cooling: 0, weight: 3.0, yield: 0.96, x: 105, y: 150 },
  { id: "xpu-efficient", type: "compute", name: "Efficient XPU", shortName: "XPU-E", description: "Smaller accelerator die with lower heat density and stronger known-good-die yield.", compute: 42, bandwidth: 0, thermal: 23, cooling: 0, weight: 2.5, yield: 0.985, x: 105, y: 250 },
  { id: "hbm3e", type: "hbm", name: "HBM3E Stack", shortName: "HBM3E", description: "High-bandwidth memory stack with good mature-package yield.", compute: 0, bandwidth: 52, thermal: 12, cooling: 0, weight: 2.2, yield: 0.98, x: 105, y: 455 },
  { id: "hbm4", type: "hbm", name: "HBM4 Stack", shortName: "HBM4", description: "Higher-bandwidth memory with tighter thermals and newer-stack yield risk.", compute: 0, bandwidth: 68, thermal: 16, cooling: 0, weight: 2.4, yield: 0.96, x: 105, y: 555 },
  { id: "io-die", type: "io", name: "I/O Die", shortName: "I/O", description: "External connectivity and protocol die for package-level ingress and egress.", compute: 0, bandwidth: 30, thermal: 9, cooling: 0, weight: 1.4, yield: 0.99, x: 255, y: 150 },
  { id: "silicon-bridge", type: "bridge", name: "Silicon Bridge", shortName: "BRIDGE", description: "Short-reach die-to-die bridge that improves local chiplet connectivity.", compute: 0, bandwidth: 40, thermal: 4, cooling: 0, weight: 1.0, yield: 0.995, x: 255, y: 250 },
  { id: "optical-engine", type: "optics", name: "Optical Engine", shortName: "OPTICS", description: "Co-packaged optical engine with strong off-package bandwidth and added thermal load.", compute: 0, bandwidth: 58, thermal: 15, cooling: 0, weight: 1.6, yield: 0.965, x: 255, y: 455 },
  { id: "heat-spreader", type: "spreader", name: "Thermal Spreader", shortName: "SPREAD", description: "Dedicated thermal spreader that lowers neighboring hotspot temperature at the cost of package area.", compute: 0, bandwidth: 0, thermal: 2, cooling: 14, weight: 1.8, yield: 0.998, x: 255, y: 555 },
] as const;

export const packageSpecs: readonly PackageSpec[] = [
  { id: "ai-package", name: "AI Accelerator Package", customer: "NovaScale AI", brief: "Co-package compute and memory for a high-throughput training module without creating a thermal wall.", minCompute: 95, minBandwidth: 145, maxThermal: 55, maxWarpage: 3.2, minYield: 0.78, requirements: { compute: 2, hbm: 2 }, hint: "Put HBM beside compute and use thermal spreading to control local coupling." },
  { id: "network-package", name: "Network Switch Package", customer: "Crestline Networks", brief: "Build a reliable high-bandwidth switch package with strong external I/O and die-to-die links.", minCompute: 52, minBandwidth: 105, maxThermal: 52, maxWarpage: 4.0, minYield: 0.80, requirements: { compute: 1, io: 1, bridge: 1 }, hint: "I/O and bridge dies are most useful when placed next to the compute die." },
  { id: "cpo-package", name: "Co-Packaged Optics Module", customer: "Photon Ridge", brief: "Pull optical bandwidth into the package while keeping yield and hotspot risk under control.", minCompute: 82, minBandwidth: 155, maxThermal: 56, maxWarpage: 3.6, minYield: 0.75, requirements: { compute: 2, optics: 1 }, hint: "Optics adds bandwidth and heat. Keep it close enough to compute to earn the link benefit." },
  { id: "edge-module", name: "Edge AI Module", customer: "Field Robotics", brief: "Ship a compact package with enough memory bandwidth for edge inference and high manufacturing yield.", minCompute: 40, minBandwidth: 68, maxThermal: 38, maxWarpage: 2.8, minYield: 0.84, requirements: { compute: 1, hbm: 1, io: 1 }, hint: "A smaller efficient die and a balanced package usually beat brute-force components." },
] as const;

const profileEffects: Record<BondProfile, { yield: number; warpage: number; inspectSeconds: number }> = {
  gentle: { yield: 0.025, warpage: -0.55, inspectSeconds: 5.8 },
  balanced: { yield: 0, warpage: 0, inspectSeconds: 4.3 },
  fast: { yield: -0.035, warpage: 0.8, inspectSeconds: 2.8 },
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

function slotNeighbors(index: number) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const result: number[] = [];
  if (col > 0) result.push(index - 1);
  if (col < 2) result.push(index + 1);
  if (row > 0) result.push(index - 3);
  if (row < 1) result.push(index + 3);
  return result;
}

export function getPackageComponent(id: string | null) {
  return id ? packageComponents.find((component) => component.id === id) ?? null : null;
}

export function getPackageSpec(state: Pick<PackagingState, "jobIndex">) {
  return packageSpecs[Math.min(state.jobIndex, packageSpecs.length - 1)];
}

export function packagingCounts(state: Pick<PackagingState, "slots">) {
  const counts: Record<ComponentType, number> = { compute: 0, hbm: 0, io: 0, bridge: 0, optics: 0, spreader: 0 };
  for (const id of state.slots) {
    const component = getPackageComponent(id);
    if (component) counts[component.type] += 1;
  }
  return counts;
}

export function packageStats(state: Pick<PackagingState, "slots" | "bondProfile">): PackageStats {
  const components = state.slots.map((id) => getPackageComponent(id));
  const occupied = components.filter(Boolean).length;
  const compute = components.reduce((sum, component) => sum + (component?.compute ?? 0), 0);
  let bandwidth = 0;

  components.forEach((component, index) => {
    if (!component || component.bandwidth <= 0) return;
    const neighbors = slotNeighbors(index).map((neighbor) => components[neighbor]).filter(Boolean) as PackageComponent[];
    const adjacentCompute = neighbors.some((neighbor) => neighbor.type === "compute");
    const factor = adjacentCompute ? 1 : component.type === "hbm" ? 0.55 : 0.7;
    bandwidth += component.bandwidth * factor;
  });

  let thermalPeak = 0;
  components.forEach((component, index) => {
    if (!component) return;
    const neighbors = slotNeighbors(index).map((neighbor) => components[neighbor]).filter(Boolean) as PackageComponent[];
    const coupledHeat = neighbors.reduce((sum, neighbor) => sum + Math.max(0, neighbor.thermal) * 0.28, 0);
    const localCooling = neighbors.reduce((sum, neighbor) => sum + neighbor.cooling, 0);
    thermalPeak = Math.max(thermalPeak, component.thermal + coupledHeat - localCooling);
  });

  const leftWeight = [0, 3].reduce((sum, index) => sum + (components[index]?.weight ?? 0), 0);
  const rightWeight = [2, 5].reduce((sum, index) => sum + (components[index]?.weight ?? 0), 0);
  const topWeight = [0, 1, 2].reduce((sum, index) => sum + (components[index]?.weight ?? 0), 0);
  const bottomWeight = [3, 4, 5].reduce((sum, index) => sum + (components[index]?.weight ?? 0), 0);
  let warpage = Math.abs(leftWeight - rightWeight) * 0.8 + Math.abs(topWeight - bottomWeight) * 0.35;

  let packageYield = components.reduce((product, component) => component ? product * component.yield : product, 1);
  packageYield *= Math.max(0.82, 1 - Math.max(0, occupied - 1) * 0.012);
  packageYield += profileEffects[state.bondProfile].yield;
  warpage += profileEffects[state.bondProfile].warpage;

  return {
    compute: Math.round(compute * 10) / 10,
    bandwidth: Math.round(bandwidth * 10) / 10,
    thermalPeak: Math.round(Math.max(0, thermalPeak) * 10) / 10,
    warpage: Math.round(Math.max(0, warpage) * 10) / 10,
    yield: Math.round(clamp(packageYield, 0, 0.999) * 1000) / 1000,
    occupied,
  };
}

export function packageMeetsSpec(state: Pick<PackagingState, "slots" | "bondProfile" | "jobIndex">) {
  const stats = packageStats(state);
  const spec = getPackageSpec(state);
  const counts = packagingCounts(state);
  const requirementsMet = (Object.keys(spec.requirements) as ComponentType[]).every((type) => counts[type] >= (spec.requirements[type] ?? 0));
  return requirementsMet && stats.compute >= spec.minCompute && stats.bandwidth >= spec.minBandwidth && stats.thermalPeak <= spec.maxThermal && stats.warpage <= spec.maxWarpage && stats.yield >= spec.minYield;
}

export function packagingScore(state: Pick<PackagingState, "points" | "reputation" | "packagesShipped" | "missedJobs">) {
  return Math.max(0, Math.round(state.points + state.reputation * 5 + state.packagesShipped * 220 - state.missedJobs * 130));
}

export function createPackagingState(): PackagingState {
  return {
    playerX: 620,
    playerY: 660,
    vx: 0,
    vy: 0,
    timeLeft: PACKAGING_SESSION_SECONDS,
    jobTimeLeft: PACKAGING_JOB_SECONDS,
    jobIndex: 0,
    carriedComponentId: null,
    slots: Array(6).fill(null),
    bondProfile: "balanced",
    inspectionPending: false,
    inspectionCooldown: 0,
    inspected: false,
    inspectionPass: false,
    packagesShipped: 0,
    missedJobs: 0,
    reputation: 100,
    points: 0,
    elapsed: 0,
    mode: "playing",
  };
}

function clearInspection(state: PackagingState) {
  return { ...state, inspectionPending: false, inspectionCooldown: 0, inspected: false, inspectionPass: false };
}

function nextJob(state: PackagingState, jobIndex: number): PackagingState {
  return {
    ...state,
    jobIndex,
    jobTimeLeft: PACKAGING_JOB_SECONDS,
    carriedComponentId: null,
    slots: Array(6).fill(null),
    bondProfile: "balanced",
    inspectionPending: false,
    inspectionCooldown: 0,
    inspected: false,
    inspectionPass: false,
  };
}

export function packagingPrompt(state: PackagingState) {
  if (state.mode !== "playing") return "";
  const carried = getPackageComponent(state.carriedComponentId);
  const bin = packageComponents.find((component) => distance(state.playerX, state.playerY, component.x, component.y) <= 44);
  if (bin) return carried ? `CARRYING ${carried.shortName} · PLACE IT ON THE SUBSTRATE FIRST` : `E · PICK UP ${bin.name.toUpperCase()}`;

  for (let index = 0; index < packageSlotPositions.length; index += 1) {
    const slot = packageSlotPositions[index];
    if (distance(state.playerX, state.playerY, slot.x, slot.y) > 48) continue;
    const installed = getPackageComponent(state.slots[index]);
    if (carried) return `E · PLACE ${carried.shortName} IN PACKAGE SLOT ${index + 1}`;
    if (installed) return `E · REMOVE ${installed.shortName} FROM SLOT ${index + 1}`;
    return `PACKAGE SLOT ${index + 1} EMPTY`;
  }

  if (distance(state.playerX, state.playerY, packagingLayout.inspect.x, packagingLayout.inspect.y) <= 58) {
    if (state.inspectionPending) return `X-RAY / REFLOW RUNNING · ${Math.ceil(state.inspectionCooldown)}s`;
    if (state.inspected) return state.inspectionPass ? "INSPECTION PASS · PACKAGE CAN SHIP" : "INSPECTION FAIL · REWORK THE PACKAGE";
    return `E · X-RAY + REFLOW INSPECTION · ${profileEffects[state.bondProfile].inspectSeconds.toFixed(1)}s`;
  }

  if (distance(state.playerX, state.playerY, packagingLayout.profile.x, packagingLayout.profile.y) <= 58) {
    const next = state.bondProfile === "balanced" ? "FAST" : state.bondProfile === "fast" ? "GENTLE" : "BALANCED";
    return `E · BOND PROFILE ${state.bondProfile.toUpperCase()} → ${next}`;
  }

  if (distance(state.playerX, state.playerY, packagingLayout.ship.x, packagingLayout.ship.y) <= 58) {
    return state.inspected && state.inspectionPass ? "E · SHIP PACKAGE" : "SHIP BLOCKED · PASS INSPECTION FIRST";
  }

  return carried ? `CARRYING ${carried.shortName} · PLACE IT TO SHAPE THERMALS AND BANDWIDTH` : "BUILD THE PACKAGE · ADJACENCY CHANGES BANDWIDTH AND HEAT";
}

export function interactPackagingLab(state: PackagingState): { state: PackagingState; event: PackagingEvent } {
  if (state.mode !== "playing") return { state, event: "none" };
  const carried = getPackageComponent(state.carriedComponentId);
  const bin = packageComponents.find((component) => distance(state.playerX, state.playerY, component.x, component.y) <= 44);
  if (bin && !carried) return { state: { ...state, carriedComponentId: bin.id }, event: "component_picked" };

  for (let index = 0; index < packageSlotPositions.length; index += 1) {
    const slot = packageSlotPositions[index];
    if (distance(state.playerX, state.playerY, slot.x, slot.y) > 48) continue;
    const installed = state.slots[index];
    if (carried) {
      const slots = [...state.slots];
      slots[index] = carried.id;
      return { state: clearInspection({ ...state, slots, carriedComponentId: installed }), event: "component_placed" };
    }
    if (installed) {
      const slots = [...state.slots];
      slots[index] = null;
      return { state: clearInspection({ ...state, slots, carriedComponentId: installed }), event: "component_removed" };
    }
    return { state, event: "none" };
  }

  if (distance(state.playerX, state.playerY, packagingLayout.profile.x, packagingLayout.profile.y) <= 58) {
    const bondProfile: BondProfile = state.bondProfile === "balanced" ? "fast" : state.bondProfile === "fast" ? "gentle" : "balanced";
    return { state: clearInspection({ ...state, bondProfile }), event: "profile_changed" };
  }

  if (distance(state.playerX, state.playerY, packagingLayout.inspect.x, packagingLayout.inspect.y) <= 58) {
    if (state.inspectionPending) return { state, event: "none" };
    return {
      state: { ...state, inspectionPending: true, inspectionCooldown: profileEffects[state.bondProfile].inspectSeconds, inspected: false, inspectionPass: false },
      event: "inspection_started",
    };
  }

  if (distance(state.playerX, state.playerY, packagingLayout.ship.x, packagingLayout.ship.y) <= 58) {
    if (!state.inspected || !state.inspectionPass) return { state, event: "ship_blocked" };
    const stats = packageStats(state);
    const spec = getPackageSpec(state);
    const headroom = Math.max(0, stats.compute - spec.minCompute) + Math.max(0, stats.bandwidth - spec.minBandwidth) * 0.5 + Math.max(0, spec.maxThermal - stats.thermalPeak) * 2 + Math.max(0, spec.maxWarpage - stats.warpage) * 8 + Math.max(0, stats.yield - spec.minYield) * 500;
    const points = state.points + 1100 + Math.round(state.jobTimeLeft * 5 + headroom * 6);
    const jobIndex = state.jobIndex + 1;
    const packagesShipped = state.packagesShipped + 1;
    if (jobIndex >= packageSpecs.length) {
      return { state: { ...state, points, packagesShipped, reputation: Math.min(100, state.reputation + 4), mode: "complete", vx: 0, vy: 0 }, event: "complete" };
    }
    return { state: nextJob({ ...state, points, packagesShipped, reputation: Math.min(100, state.reputation + 4) }, jobIndex), event: "package_shipped" };
  }

  return { state, event: "none" };
}

export function advancePackagingLab(state: PackagingState, input: PackagingInput, deltaSeconds: number): { state: PackagingState; event: PackagingEvent } {
  if (state.mode !== "playing") return { state, event: "none" };
  const dt = clamp(deltaSeconds, 0, 0.05);
  const magnitude = Math.hypot(input.x, input.y);
  const nx = magnitude > 1 ? input.x / magnitude : input.x;
  const ny = magnitude > 1 ? input.y / magnitude : input.y;
  const speed = 255;
  const blend = Math.min(1, dt * 10);
  let vx = state.vx + (nx * speed - state.vx) * blend;
  let vy = state.vy + (ny * speed - state.vy) * blend;
  let playerX = clamp(state.playerX + vx * dt, PACKAGING_PLAYER_RADIUS + 8, PACKAGING_WORLD.width - PACKAGING_PLAYER_RADIUS - 8);
  let playerY = clamp(state.playerY + vy * dt, PACKAGING_PLAYER_RADIUS + 8, PACKAGING_WORLD.height - PACKAGING_PLAYER_RADIUS - 8);
  let event: PackagingEvent = "none";

  if (packagingLayout.obstacles.some((rect) => circleRectCollision(playerX, playerY, PACKAGING_PLAYER_RADIUS, rect))) {
    playerX = state.playerX;
    playerY = state.playerY;
    vx *= -0.08;
    vy *= -0.08;
    event = "collision";
  }

  const wasPending = state.inspectionPending;
  let next: PackagingState = {
    ...state,
    playerX,
    playerY,
    vx,
    vy,
    elapsed: state.elapsed + dt,
    timeLeft: Math.max(0, state.timeLeft - dt),
    jobTimeLeft: Math.max(0, state.jobTimeLeft - dt),
    inspectionCooldown: Math.max(0, state.inspectionCooldown - dt),
  };

  if (wasPending && next.inspectionCooldown <= 0) {
    const pass = packageMeetsSpec(next);
    next = { ...next, inspectionPending: false, inspected: true, inspectionPass: pass };
    event = pass ? "inspection_passed" : "inspection_failed";
  }

  if (next.jobTimeLeft <= 0) {
    const missedJobs = next.missedJobs + 1;
    const reputation = Math.max(0, next.reputation - 18);
    const jobIndex = next.jobIndex + 1;
    if (reputation <= 0) return { state: { ...next, missedJobs, reputation, mode: "failed", vx: 0, vy: 0 }, event: "failed" };
    if (jobIndex >= packageSpecs.length) return { state: { ...next, missedJobs, reputation, mode: "complete", vx: 0, vy: 0 }, event: "complete" };
    next = nextJob({ ...next, missedJobs, reputation }, jobIndex);
    event = "job_missed";
  }

  if (next.timeLeft <= 0) {
    next = { ...next, timeLeft: 0, mode: "complete", vx: 0, vy: 0 };
    return { state: next, event: "complete" };
  }

  return { state: next, event };
}
