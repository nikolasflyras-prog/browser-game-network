export type FabToolId = "lithography" | "etch" | "metrology";
export type FabFloorEvent = "none" | "lot_released" | "focus_changed" | "kit_picked" | "maintenance_started" | "alarm" | "lot_completed" | "shift_complete" | "collision";
export type FabLotStage = "lithography" | "etch" | "metrology";
export type FabTool = { id: FabToolId; health: number; alarm: boolean; maintenance: number; processed: number };
export type FabLot = { id: number; stage: FabLotStage; progress: number; quality: number; age: number };
export type FabFloorState = {
  playerX: number; playerY: number; vx: number; vy: number; timeLeft: number; elapsed: number; nextLotId: number; releaseCooldown: number;
  lots: FabLot[]; tools: Record<FabToolId, FabTool>; focus: FabToolId; carryingKit: boolean; completedLots: number; goodDie: number; scrap: number;
  cash: number; reputation: number; alarmTimer: number; seed: number; mode: "playing" | "complete" | "failed";
};
export const FAB_FLOOR_WORLD = { width: 1240, height: 760 } as const;
export const FAB_FLOOR_SECONDS = 330;
export const FAB_PLAYER_RADIUS = 15;
export const fabFloorLayout = {
  release: { x: 120, y: 370 }, maintenance: { x: 1080, y: 620 },
  tools: {
    lithography: { x: 390, y: 250, width: 190, height: 125 },
    etch: { x: 650, y: 250, width: 190, height: 125 },
    metrology: { x: 910, y: 250, width: 190, height: 125 },
  },
  corridors: [{ x: 250, y: 95, width: 120, height: 90 }, { x: 600, y: 545, width: 145, height: 90 }],
} as const;
const toolOrder: FabToolId[] = ["lithography", "etch", "metrology"];
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function distance(ax: number, ay: number, bx: number, by: number) { return Math.hypot(ax - bx, ay - by); }
function random(seed: number) { const next = (seed * 1664525 + 1013904223) >>> 0; return { seed: next, value: next / 0xffffffff }; }
function circleRect(x: number, y: number, radius: number, rect: { x: number; y: number; width: number; height: number }) { const nx = clamp(x, rect.x, rect.x + rect.width); const ny = clamp(y, rect.y, rect.y + rect.height); return Math.hypot(x - nx, y - ny) < radius; }
function toolCenter(id: FabToolId) { const r = fabFloorLayout.tools[id]; return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }
export function createFabFloorState(seed = 424242): FabFloorState { return {
  playerX: 170, playerY: 560, vx: 0, vy: 0, timeLeft: FAB_FLOOR_SECONDS, elapsed: 0, nextLotId: 1, releaseCooldown: 0, lots: [],
  tools: { lithography: { id: "lithography", health: 94, alarm: false, maintenance: 0, processed: 0 }, etch: { id: "etch", health: 94, alarm: false, maintenance: 0, processed: 0 }, metrology: { id: "metrology", health: 94, alarm: false, maintenance: 0, processed: 0 } },
  focus: "lithography", carryingKit: false, completedLots: 0, goodDie: 0, scrap: 0, cash: 82, reputation: 100, alarmTimer: 26, seed: seed >>> 0, mode: "playing",
}; }
export function fabFloorYield(state: Pick<FabFloorState, "goodDie" | "scrap">) { const total = state.goodDie + state.scrap; return total > 0 ? state.goodDie / total : 1; }
export function fabFloorScore(state: Pick<FabFloorState, "goodDie" | "scrap" | "cash" | "reputation" | "lots" | "completedLots">) { const yieldPct = fabFloorYield(state) * 100; return Math.max(0, Math.round(state.goodDie * 8 + state.completedLots * 65 + yieldPct * 5 + state.reputation * 4 + state.cash * 2 - state.lots.length * 18)); }
export function fabFloorPrompt(state: FabFloorState) {
  if (state.mode !== "playing") return "";
  if (distance(state.playerX, state.playerY, fabFloorLayout.release.x, fabFloorLayout.release.y) <= 58) return state.releaseCooldown > 0 ? `FOUP RELEASE READY IN ${state.releaseCooldown.toFixed(1)}s` : "E · RELEASE WAFER LOT";
  if (distance(state.playerX, state.playerY, fabFloorLayout.maintenance.x, fabFloorLayout.maintenance.y) <= 62) return state.carryingKit ? "MAINTENANCE KIT ALREADY CARRIED" : "E · PICK UP MAINTENANCE KIT";
  for (const id of toolOrder) { const center = toolCenter(id); if (distance(state.playerX, state.playerY, center.x, center.y) > 140) continue; const tool = state.tools[id]; if (tool.maintenance > 0) return `${id.toUpperCase()} PM · ${tool.maintenance.toFixed(1)}s`; if (tool.alarm) return state.carryingKit ? `E · SERVICE ${id.toUpperCase()} ALARM` : `${id.toUpperCase()} ALARM · GET MAINTENANCE KIT`; return state.focus === id ? `${id.toUpperCase()} HAS ENGINEERING FOCUS` : `E · ASSIGN ENGINEERING FOCUS TO ${id.toUpperCase()}`; }
  return state.carryingKit ? "CARRYING MAINTENANCE KIT · FIND AN ALARM" : "KEEP WIP FLOWING · WATCH TOOL HEALTH";
}
export function interactFabFloor(state: FabFloorState): { state: FabFloorState; event: FabFloorEvent } {
  if (state.mode !== "playing") return { state, event: "none" };
  if (distance(state.playerX, state.playerY, fabFloorLayout.release.x, fabFloorLayout.release.y) <= 58 && state.releaseCooldown <= 0) { const pressure = Math.max(0, state.lots.length - 4) * 0.012; const lot: FabLot = { id: state.nextLotId, stage: "lithography", progress: 0, quality: clamp(0.985 - pressure, 0.82, 0.99), age: 0 }; return { state: { ...state, lots: [...state.lots, lot], nextLotId: state.nextLotId + 1, releaseCooldown: 2.4, cash: Math.max(0, state.cash - 0.8) }, event: "lot_released" }; }
  if (distance(state.playerX, state.playerY, fabFloorLayout.maintenance.x, fabFloorLayout.maintenance.y) <= 62 && !state.carryingKit) return { state: { ...state, carryingKit: true }, event: "kit_picked" };
  for (const id of toolOrder) { const center = toolCenter(id); if (distance(state.playerX, state.playerY, center.x, center.y) > 140) continue; const tool = state.tools[id]; if (tool.alarm && state.carryingKit && tool.maintenance <= 0) return { state: { ...state, carryingKit: false, tools: { ...state.tools, [id]: { ...tool, alarm: false, maintenance: 5.5 } }, cash: Math.max(0, state.cash - 3) }, event: "maintenance_started" }; if (!tool.alarm && tool.maintenance <= 0 && state.focus !== id) return { state: { ...state, focus: id }, event: "focus_changed" }; }
  return { state, event: "none" };
}
function toolCapacity(state: FabFloorState, id: FabToolId) { const tool = state.tools[id]; if (tool.maintenance > 0 || tool.alarm) return 0; const base = id === "lithography" ? 0.34 : id === "etch" ? 0.38 : 0.42; const focus = state.focus === id ? 0.15 : 0; const health = tool.health < 45 ? 0.5 : tool.health < 70 ? 0.75 : tool.health < 85 ? 0.9 : 1; return (base + focus) * health; }
export function advanceFabFloor(state: FabFloorState, input: { x: number; y: number }, dtRaw: number): { state: FabFloorState; event: FabFloorEvent } {
  if (state.mode !== "playing") return { state, event: "none" };
  const dt = clamp(dtRaw, 0, 0.05); const mag = Math.hypot(input.x, input.y); const nx = mag > 1 ? input.x / mag : input.x; const ny = mag > 1 ? input.y / mag : input.y; const speed = 255; const blend = Math.min(1, dt * 10);
  let vx = state.vx + (nx * speed - state.vx) * blend; let vy = state.vy + (ny * speed - state.vy) * blend; let playerX = clamp(state.playerX + vx * dt, 24, FAB_FLOOR_WORLD.width - 24); let playerY = clamp(state.playerY + vy * dt, 24, FAB_FLOOR_WORLD.height - 24); let event: FabFloorEvent = "none";
  const blockers = [...Object.values(fabFloorLayout.tools), ...fabFloorLayout.corridors]; if (blockers.some((rect) => circleRect(playerX, playerY, FAB_PLAYER_RADIUS, rect))) { playerX = state.playerX; playerY = state.playerY; vx *= -0.08; vy *= -0.08; event = "collision"; }
  const tools: FabFloorState["tools"] = { lithography: { ...state.tools.lithography }, etch: { ...state.tools.etch }, metrology: { ...state.tools.metrology } };
  for (const id of toolOrder) { const tool = tools[id]; if (tool.maintenance > 0) { const maintenance = Math.max(0, tool.maintenance - dt); tools[id] = maintenance <= 0 ? { ...tool, maintenance: 0, health: 99, alarm: false } : { ...tool, maintenance }; } }
  let lots = state.lots.map((lot) => ({ ...lot, age: lot.age + dt })); let completedLots = state.completedLots; let goodDie = state.goodDie; let scrap = state.scrap; let cash = state.cash; let reputation = state.reputation;
  for (const id of toolOrder) {
    let budget = toolCapacity({ ...state, tools }, id) * dt;
    lots = lots.map((lot) => { if (lot.stage !== id || budget <= 0) return lot; const step = Math.min(budget, 1 - lot.progress); budget -= step; const healthPenalty = Math.max(0, 80 - tools[id].health) * 0.0008; const agePenalty = Math.max(0, lot.age - 28) * 0.0006; return { ...lot, progress: lot.progress + step, quality: clamp(lot.quality - (healthPenalty + agePenalty) * dt, 0.68, 0.995) }; });
    let processedCount = 0; lots = lots.map((lot) => { if (lot.stage !== id || lot.progress < 0.999) return lot; processedCount += 1; if (id === "lithography") return { ...lot, stage: "etch" as const, progress: 0 }; if (id === "etch") return { ...lot, stage: "metrology" as const, progress: 0 }; return lot; }); if (processedCount > 0) tools[id] = { ...tools[id], processed: tools[id].processed + processedCount };
  }
  const finished = lots.filter((lot) => lot.stage === "metrology" && lot.progress >= 0.999); if (finished.length) { for (const lot of finished) { const die = 100 * lot.quality; goodDie += die; scrap += 100 - die; cash = clamp(cash + die * 0.015, 0, 100); completedLots += 1; } lots = lots.filter((lot) => !(lot.stage === "metrology" && lot.progress >= 0.999)); event = "lot_completed"; }
  for (const id of toolOrder) { const queue = lots.filter((lot) => lot.stage === id).length; const wear = (0.055 + queue * 0.012 + (state.focus === id ? -0.018 : 0)) * dt; if (tools[id].maintenance <= 0) tools[id] = { ...tools[id], health: clamp(tools[id].health - wear, 0, 100) }; }
  let seed = state.seed; let alarmTimer = state.alarmTimer - dt; if (alarmTimer <= 0) { const roll = random(seed); seed = roll.seed; const candidates = toolOrder.filter((id) => tools[id].maintenance <= 0 && !tools[id].alarm); const id = candidates[Math.floor(roll.value * Math.max(1, candidates.length))]; if (id) { tools[id] = { ...tools[id], alarm: true, health: clamp(tools[id].health - 12, 0, 100) }; event = "alarm"; } const wait = random(seed); seed = wait.seed; alarmTimer = 28 + wait.value * 20; }
  const activeAlarms = toolOrder.filter((id) => tools[id].alarm).length; reputation = clamp(reputation - activeAlarms * 0.18 * dt - Math.max(0, lots.length - 10) * 0.08 * dt, 0, 100); const timeLeft = Math.max(0, state.timeLeft - dt); const mode = timeLeft <= 0 ? "complete" as const : reputation <= 0 ? "failed" as const : "playing" as const; if (mode !== "playing") event = "shift_complete";
  return { state: { ...state, playerX, playerY, vx, vy, timeLeft, elapsed: state.elapsed + dt, releaseCooldown: Math.max(0, state.releaseCooldown - dt), lots, tools, completedLots, goodDie, scrap, cash, reputation, alarmTimer, seed, mode }, event };
}
