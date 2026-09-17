export type FundAssetId = "aurora" | "memora" | "gridline" | "photonix" | "cloudforge" | "medisense";
export type FundSector = "ai" | "memory" | "energy" | "photonics" | "software" | "healthcare";
export type FundStaffRole = "analyst" | "trader" | "risk";
export type FundMode = "playing" | "complete" | "gameover";
export type FundEvent =
  | "none"
  | "collision"
  | "research_started"
  | "research_complete"
  | "trade_long"
  | "trade_short"
  | "idea_passed"
  | "hedge_set"
  | "hedge_cleared"
  | "staff_hired"
  | "hire_blocked"
  | "lp_update"
  | "news"
  | "risk_alert"
  | "complete"
  | "game_over";

export type FundAsset = {
  id: FundAssetId;
  ticker: string;
  name: string;
  sector: FundSector;
  beta: number;
  basePrice: number;
  volatility: number;
  alpha: number;
  thesis: string;
  bullCase: string;
  bearCase: string;
};

export type FundPosition = {
  assetId: FundAssetId;
  shares: number;
  avgPrice: number;
};

export type FundStaff = {
  analyst: number;
  trader: number;
  risk: number;
};

export type HedgeFundState = {
  playerX: number;
  playerY: number;
  vx: number;
  vy: number;
  timeLeft: number;
  elapsed: number;
  cash: number;
  initialNav: number;
  highWaterNav: number;
  maxDrawdown: number;
  prices: Record<FundAssetId, number>;
  indexPrice: number;
  positions: FundPosition[];
  hedgeShares: number;
  hedgeActive: boolean;
  activeIdeaId: FundAssetId | null;
  researchTimer: number;
  researchSignal: number | null;
  researchConfidence: number;
  researchCount: number;
  nextResearchIndex: number;
  newsTimer: number;
  newsLabel: string | null;
  newsSector: FundSector | "all" | null;
  newsTimeLeft: number;
  operatingBudget: number;
  staff: FundStaff;
  reputation: number;
  riskBreaches: number;
  lpUpdates: number;
  trades: number;
  seed: number;
  mode: FundMode;
};

export type FundStats = {
  nav: number;
  pnl: number;
  grossExposure: number;
  netExposure: number;
  betaExposure: number;
  hedgeNotional: number;
  longNotional: number;
  shortNotional: number;
  drawdown: number;
};

export const FUND_WORLD = { width: 1240, height: 760 } as const;
export const FUND_SESSION_SECONDS = 360;
export const FUND_STARTING_NAV = 100_000_000;
export const FUND_ORDER_NOTIONAL = 5_000_000;
export const FUND_PLAYER_RADIUS = 15;

export const fundAssets: readonly FundAsset[] = [
  {
    id: "aurora",
    ticker: "AURA",
    name: "Aurora Compute",
    sector: "ai",
    beta: 1.45,
    basePrice: 112,
    volatility: 0.34,
    alpha: 0.32,
    thesis: "AI accelerator vendor with improving software attach and a second hyperscaler design win.",
    bullCase: "Volume ramp arrives earlier than consensus and gross margin expands with software mix.",
    bearCase: "Customer concentration and a delayed next-gen tape-out create an air pocket in revenue.",
  },
  {
    id: "memora",
    ticker: "MEMR",
    name: "Memora Systems",
    sector: "memory",
    beta: 1.18,
    basePrice: 74,
    volatility: 0.29,
    alpha: 0.12,
    thesis: "Memory-controller supplier levered to HBM and CXL adoption across AI servers.",
    bullCase: "HBM content per accelerator keeps rising and CXL qualification converts into production orders.",
    bearCase: "Memory pricing rolls over before mix gains offset the cycle.",
  },
  {
    id: "gridline",
    ticker: "GRID",
    name: "Gridline Power",
    sector: "energy",
    beta: 0.72,
    basePrice: 58,
    volatility: 0.21,
    alpha: -0.08,
    thesis: "Power-equipment manufacturer exposed to data-center grid upgrades and utility capex.",
    bullCase: "Transformer backlog and data-center interconnect demand support multi-year pricing power.",
    bearCase: "Working-capital needs rise while utilities push project timing to the right.",
  },
  {
    id: "photonix",
    ticker: "PHNX",
    name: "Photonix Networks",
    sector: "photonics",
    beta: 1.27,
    basePrice: 91,
    volatility: 0.31,
    alpha: 0.24,
    thesis: "Optical interconnect supplier positioned for 1.6T and early co-packaged optics deployments.",
    bullCase: "800G-to-1.6T transition compresses faster than expected and attach rates rise.",
    bearCase: "Qualification slips and an aggressive competitor forces module pricing lower.",
  },
  {
    id: "cloudforge",
    ticker: "CLDF",
    name: "CloudForge Software",
    sector: "software",
    beta: 1.08,
    basePrice: 136,
    volatility: 0.25,
    alpha: -0.18,
    thesis: "Infrastructure software consolidator with strong recurring revenue but slowing net retention.",
    bullCase: "AI workloads create a new expansion cycle and sales efficiency rebounds.",
    bearCase: "Seat compression and cloud optimization keep net retention below expectations.",
  },
  {
    id: "medisense",
    ticker: "MEDS",
    name: "MediSense Devices",
    sector: "healthcare",
    beta: 0.62,
    basePrice: 49,
    volatility: 0.23,
    alpha: 0.04,
    thesis: "Medical-device supplier with a new monitoring platform entering a large installed base.",
    bullCase: "Hospital adoption accelerates and service revenue lifts margins.",
    bearCase: "Reimbursement friction slows placements and pushes profitability out.",
  },
] as const;

export const fundLayout = {
  research: { x: 170, y: 315 },
  news: { x: 450, y: 95 },
  tradePads: [
    { id: "long", label: "LONG $5M", x: 610, y: 255 },
    { id: "short", label: "SHORT $5M", x: 610, y: 365 },
    { id: "pass", label: "PASS", x: 610, y: 475 },
  ],
  riskPads: [
    { id: "hedge", label: "SET BETA HEDGE", x: 885, y: 260 },
    { id: "clear", label: "CLEAR HEDGE", x: 885, y: 390 },
  ],
  hirePads: [
    { id: "analyst", label: "HIRE ANALYST", x: 280, y: 650 },
    { id: "trader", label: "HIRE TRADER", x: 500, y: 650 },
    { id: "risk", label: "HIRE RISK", x: 720, y: 650 },
  ],
  lp: { x: 1085, y: 540 },
  obstacles: [
    { x: 70, y: 100, width: 160, height: 92 },
    { x: 285, y: 110, width: 155, height: 90 },
    { x: 500, y: 105, width: 155, height: 90 },
    { x: 780, y: 105, width: 165, height: 90 },
    { x: 1010, y: 110, width: 150, height: 90 },
    { x: 70, y: 525, width: 150, height: 90 },
    { x: 1010, y: 315, width: 150, height: 92 },
  ],
} as const;

const newsEvents: readonly { label: string; sector: FundSector | "all"; shock: number; indexShock: number }[] = [
  { label: "Hyperscaler capex guidance moves higher", sector: "ai", shock: 0.032, indexShock: 0.006 },
  { label: "HBM spot pricing softens", sector: "memory", shock: -0.028, indexShock: -0.002 },
  { label: "Grid interconnect approvals accelerate", sector: "energy", shock: 0.027, indexShock: 0.001 },
  { label: "1.6T optical qualification pulls forward", sector: "photonics", shock: 0.035, indexShock: 0.004 },
  { label: "Enterprise software budgets tighten", sector: "software", shock: -0.031, indexShock: -0.004 },
  { label: "Hospital capital budgets expand", sector: "healthcare", shock: 0.024, indexShock: 0.001 },
  { label: "Rates jump after a hot inflation print", sector: "all", shock: -0.018, indexShock: -0.017 },
  { label: "Risk assets rally after dovish policy language", sector: "all", shock: 0.016, indexShock: 0.014 },
  { label: "AI export restrictions widen", sector: "ai", shock: -0.038, indexShock: -0.009 },
  { label: "Data-center power bottleneck worsens", sector: "energy", shock: 0.021, indexShock: -0.003 },
] as const;

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

export function fundAssetById(id: FundAssetId | null) {
  return id ? fundAssets.find((asset) => asset.id === id) ?? null : null;
}

function createPrices(): Record<FundAssetId, number> {
  return Object.fromEntries(fundAssets.map((asset) => [asset.id, asset.basePrice])) as Record<FundAssetId, number>;
}

export function createHedgeFundState(seed = 424242): HedgeFundState {
  return {
    playerX: 110,
    playerY: 710,
    vx: 0,
    vy: 0,
    timeLeft: FUND_SESSION_SECONDS,
    elapsed: 0,
    cash: FUND_STARTING_NAV,
    initialNav: FUND_STARTING_NAV,
    highWaterNav: FUND_STARTING_NAV,
    maxDrawdown: 0,
    prices: createPrices(),
    indexPrice: 100,
    positions: [],
    hedgeShares: 0,
    hedgeActive: false,
    activeIdeaId: null,
    researchTimer: 0,
    researchSignal: null,
    researchConfidence: 0,
    researchCount: 0,
    nextResearchIndex: 0,
    newsTimer: 18,
    newsLabel: null,
    newsSector: null,
    newsTimeLeft: 0,
    operatingBudget: 1_200_000,
    staff: { analyst: 0, trader: 0, risk: 0 },
    reputation: 100,
    riskBreaches: 0,
    lpUpdates: 0,
    trades: 0,
    seed: seed >>> 0,
    mode: "playing",
  };
}

function positionFor(state: HedgeFundState, assetId: FundAssetId) {
  return state.positions.find((position) => position.assetId === assetId) ?? null;
}

function betaDollarExposure(state: HedgeFundState) {
  return state.positions.reduce((sum, position) => {
    const asset = fundAssetById(position.assetId);
    if (!asset) return sum;
    return sum + position.shares * state.prices[position.assetId] * asset.beta;
  }, 0) + state.hedgeShares * state.indexPrice;
}

export function fundStats(state: HedgeFundState): FundStats {
  let longNotional = 0;
  let shortNotional = 0;
  let positionValue = 0;

  for (const position of state.positions) {
    const value = position.shares * state.prices[position.assetId];
    positionValue += value;
    if (value >= 0) longNotional += value;
    else shortNotional += Math.abs(value);
  }

  const hedgeValue = state.hedgeShares * state.indexPrice;
  positionValue += hedgeValue;
  if (hedgeValue >= 0) longNotional += hedgeValue;
  else shortNotional += Math.abs(hedgeValue);

  const nav = state.cash + positionValue;
  const denominator = Math.max(1, nav);
  const drawdown = Math.max(0, (state.highWaterNav - nav) / Math.max(1, state.highWaterNav));
  return {
    nav,
    pnl: nav - state.initialNav,
    grossExposure: (longNotional + shortNotional) / denominator,
    netExposure: (longNotional - shortNotional) / denominator,
    betaExposure: betaDollarExposure(state) / denominator,
    hedgeNotional: Math.abs(hedgeValue),
    longNotional,
    shortNotional,
    drawdown,
  };
}

export function fundScore(state: HedgeFundState) {
  const stats = fundStats(state);
  return Math.max(0, Math.round(
    1200
    + stats.pnl / 25_000
    + state.reputation * 9
    + state.researchCount * 35
    + state.staff.analyst * 55
    + state.staff.trader * 45
    + state.staff.risk * 50
    - state.riskBreaches * 22
    - state.maxDrawdown * 4000,
  ));
}

function updatePosition(positions: FundPosition[], assetId: FundAssetId, deltaShares: number, price: number) {
  const next = positions.map((position) => ({ ...position }));
  const index = next.findIndex((position) => position.assetId === assetId);
  if (index < 0) {
    if (Math.abs(deltaShares) < 1e-8) return next;
    next.push({ assetId, shares: deltaShares, avgPrice: price });
    return next;
  }

  const existing = next[index];
  const oldShares = existing.shares;
  const newShares = oldShares + deltaShares;
  if (Math.abs(newShares) < 1e-8) {
    next.splice(index, 1);
    return next;
  }

  if (Math.sign(oldShares) === Math.sign(deltaShares)) {
    const weighted = Math.abs(oldShares) * existing.avgPrice + Math.abs(deltaShares) * price;
    existing.avgPrice = weighted / Math.abs(newShares);
  } else if (Math.sign(oldShares) !== Math.sign(newShares)) {
    existing.avgPrice = price;
  }
  existing.shares = newShares;
  return next;
}

function executeTrade(state: HedgeFundState, side: "long" | "short") {
  if (!state.activeIdeaId) return { state, event: "none" as FundEvent };
  const stats = fundStats(state);
  if (stats.grossExposure >= 1.6) return { state, event: "none" as FundEvent };
  const assetId = state.activeIdeaId;
  const price = state.prices[assetId];
  const notional = FUND_ORDER_NOTIONAL;
  const shares = (notional / price) * (side === "long" ? 1 : -1);
  const feeRate = Math.max(0.00025, 0.0008 - state.staff.trader * 0.0002);
  const fee = notional * feeRate;
  const cashDelta = side === "long" ? -notional - fee : notional - fee;
  return {
    state: {
      ...state,
      cash: state.cash + cashDelta,
      positions: updatePosition(state.positions, assetId, shares, price),
      activeIdeaId: null,
      researchSignal: null,
      researchConfidence: 0,
      trades: state.trades + 1,
    },
    event: side === "long" ? "trade_long" as FundEvent : "trade_short" as FundEvent,
  };
}

function setBetaHedge(state: HedgeFundState) {
  const currentStats = fundStats(state);
  const currentHedgeValue = state.hedgeShares * state.indexPrice;
  const betaDollarBeforeHedge = currentStats.betaExposure * Math.max(1, currentStats.nav) - currentHedgeValue;
  const desiredValue = -betaDollarBeforeHedge;
  const desiredShares = desiredValue / state.indexPrice;
  const deltaShares = desiredShares - state.hedgeShares;
  const tradeValue = deltaShares * state.indexPrice;
  const feeRate = Math.max(0.00015, 0.0005 - state.staff.trader * 0.0001);
  const fee = Math.abs(tradeValue) * feeRate;
  return {
    ...state,
    cash: state.cash - tradeValue - fee,
    hedgeShares: desiredShares,
    hedgeActive: true,
  };
}

function clearBetaHedge(state: HedgeFundState) {
  const tradeValue = -state.hedgeShares * state.indexPrice;
  const feeRate = Math.max(0.00015, 0.0005 - state.staff.trader * 0.0001);
  const fee = Math.abs(tradeValue) * feeRate;
  return {
    ...state,
    cash: state.cash - tradeValue - fee,
    hedgeShares: 0,
    hedgeActive: false,
  };
}

function near(point: { x: number; y: number }, state: HedgeFundState, radius = 58) {
  return distance(state.playerX, state.playerY, point.x, point.y) <= radius;
}

export function fundPrompt(state: HedgeFundState) {
  if (state.mode !== "playing") return "";
  const idea = fundAssetById(state.activeIdeaId);

  if (near(fundLayout.research, state, 62)) {
    if (state.researchTimer > 0) return `RESEARCH RUNNING · ${Math.ceil(state.researchTimer)}s`;
    if (idea) return `${idea.ticker} DOSSIER READY · TAKE IT TO THE TRADING DESK`;
    return "E · START NEXT RESEARCH DOSSIER";
  }

  for (const pad of fundLayout.tradePads) {
    if (!near(pad, state, 55)) continue;
    if (!idea) return "NO ACTIVE IDEA · RESEARCH A NAME FIRST";
    if (pad.id === "long") return `E · LONG ${idea.ticker} $5M`;
    if (pad.id === "short") return `E · SHORT ${idea.ticker} $5M`;
    return `E · PASS ${idea.ticker}`;
  }

  for (const pad of fundLayout.riskPads) {
    if (!near(pad, state, 58)) continue;
    return pad.id === "hedge" ? "E · SET / REBALANCE MARKET BETA HEDGE" : "E · CLEAR MARKET HEDGE";
  }

  for (const pad of fundLayout.hirePads) {
    if (!near(pad, state, 58)) continue;
    const role = pad.id as FundStaffRole;
    return state.staff[role] >= 2 ? `${role.toUpperCase()} TEAM FULL` : `E · ${pad.label} · $200K`;
  }

  if (near(fundLayout.lp, state, 62)) return "E · UPDATE LPs ON RISK + PERFORMANCE";
  if (near(fundLayout.news, state, 65)) return state.newsLabel ? state.newsLabel.toUpperCase() : "LIVE NEWS TERMINAL";
  return idea ? `${idea.ticker} IDEA ACTIVE · CHOOSE LONG, SHORT, OR PASS` : "RESEARCH → TRADE → HEDGE → MANAGE THE FUND";
}

export function interactFund(state: HedgeFundState): { state: HedgeFundState; event: FundEvent } {
  if (state.mode !== "playing") return { state, event: "none" };

  if (near(fundLayout.research, state, 62)) {
    if (state.researchTimer > 0 || state.activeIdeaId) return { state, event: "none" };
    const asset = fundAssets[state.nextResearchIndex % fundAssets.length];
    const researchDuration = Math.max(3.2, 7.5 - state.staff.analyst * 1.5);
    return {
      state: {
        ...state,
        activeIdeaId: asset.id,
        researchTimer: researchDuration,
        researchSignal: null,
        researchConfidence: 0,
        nextResearchIndex: (state.nextResearchIndex + 1) % fundAssets.length,
      },
      event: "research_started",
    };
  }

  for (const pad of fundLayout.tradePads) {
    if (!near(pad, state, 55)) continue;
    if (!state.activeIdeaId || state.researchTimer > 0) return { state, event: "none" };
    if (pad.id === "long") return executeTrade(state, "long");
    if (pad.id === "short") return executeTrade(state, "short");
    return {
      state: { ...state, activeIdeaId: null, researchSignal: null, researchConfidence: 0 },
      event: "idea_passed",
    };
  }

  for (const pad of fundLayout.riskPads) {
    if (!near(pad, state, 58)) continue;
    if (pad.id === "hedge") return { state: setBetaHedge(state), event: "hedge_set" };
    if (!state.hedgeActive && Math.abs(state.hedgeShares) < 1e-8) return { state, event: "none" };
    return { state: clearBetaHedge(state), event: "hedge_cleared" };
  }

  for (const pad of fundLayout.hirePads) {
    if (!near(pad, state, 58)) continue;
    const role = pad.id as FundStaffRole;
    if (state.staff[role] >= 2 || state.operatingBudget < 200_000) return { state, event: "hire_blocked" };
    return {
      state: {
        ...state,
        operatingBudget: state.operatingBudget - 200_000,
        staff: { ...state.staff, [role]: state.staff[role] + 1 },
      },
      event: "staff_hired",
    };
  }

  if (near(fundLayout.lp, state, 62)) {
    const stats = fundStats(state);
    const cleanRisk = stats.grossExposure <= 1.5 && Math.abs(stats.betaExposure) <= 0.55 && stats.drawdown <= 0.06;
    const performanceBonus = stats.pnl >= 0 ? 4 : -3;
    return {
      state: {
        ...state,
        reputation: clamp(state.reputation + performanceBonus + (cleanRisk ? 3 : -4), 0, 100),
        lpUpdates: state.lpUpdates + 1,
      },
      event: "lp_update",
    };
  }

  return { state, event: "none" };
}

function evolveMarket(state: HedgeFundState, dt: number) {
  let seed = state.seed;
  const indexRoll = random(seed);
  seed = indexRoll.seed;
  const indexReturn = ((indexRoll.value - 0.5) * 0.0032) * Math.sqrt(Math.max(dt, 0.001));
  let indexPrice = Math.max(10, state.indexPrice * (1 + indexReturn));
  const prices = { ...state.prices };

  for (const asset of fundAssets) {
    const roll = random(seed);
    seed = roll.seed;
    const idiosyncratic = (roll.value - 0.5) * asset.volatility * 0.0065 * Math.sqrt(Math.max(dt, 0.001));
    const alphaDrift = asset.alpha * 0.000055 * dt;
    const marketMove = indexReturn * asset.beta;
    prices[asset.id] = Math.max(3, prices[asset.id] * (1 + marketMove + idiosyncratic + alphaDrift));
  }

  let newsTimer = state.newsTimer - dt;
  let newsLabel = state.newsLabel;
  let newsSector = state.newsSector;
  let newsTimeLeft = Math.max(0, state.newsTimeLeft - dt);
  let event: FundEvent = "none";

  if (newsTimer <= 0) {
    const roll = random(seed);
    seed = roll.seed;
    const item = newsEvents[Math.min(newsEvents.length - 1, Math.floor(roll.value * newsEvents.length))];
    indexPrice = Math.max(10, indexPrice * (1 + item.indexShock));
    for (const asset of fundAssets) {
      if (item.sector === "all" || asset.sector === item.sector) {
        prices[asset.id] = Math.max(3, prices[asset.id] * (1 + item.shock));
      } else if (item.sector === "all") {
        prices[asset.id] = Math.max(3, prices[asset.id] * (1 + item.indexShock * asset.beta));
      }
    }
    newsLabel = item.label;
    newsSector = item.sector;
    newsTimeLeft = 8;
    const reset = random(seed);
    seed = reset.seed;
    newsTimer = 19 + reset.value * 15;
    event = "news";
  }

  return { prices, indexPrice, seed, newsTimer, newsLabel, newsSector, newsTimeLeft, event };
}

export function advanceFund(state: HedgeFundState, input: { x: number; y: number }, rawDelta: number): { state: HedgeFundState; event: FundEvent } {
  if (state.mode !== "playing") return { state, event: "none" };
  const dt = clamp(rawDelta, 0, 0.05);
  const magnitude = Math.hypot(input.x, input.y);
  const nx = magnitude > 1 ? input.x / magnitude : input.x;
  const ny = magnitude > 1 ? input.y / magnitude : input.y;
  const speed = 270;
  const blend = Math.min(1, dt * 10);
  let vx = state.vx + (nx * speed - state.vx) * blend;
  let vy = state.vy + (ny * speed - state.vy) * blend;
  let playerX = clamp(state.playerX + vx * dt, 24, FUND_WORLD.width - 24);
  let playerY = clamp(state.playerY + vy * dt, 24, FUND_WORLD.height - 24);
  let event: FundEvent = "none";

  if (fundLayout.obstacles.some((obstacle) => circleRectCollision(playerX, playerY, FUND_PLAYER_RADIUS, obstacle))) {
    playerX = state.playerX;
    playerY = state.playerY;
    vx *= 0.05;
    vy *= 0.05;
    event = "collision";
  }

  const market = evolveMarket(state, dt);
  if (market.event !== "none") event = market.event;

  const researchTimer = Math.max(0, state.researchTimer - dt);
  let researchSignal = state.researchSignal;
  let researchConfidence = state.researchConfidence;
  let researchCount = state.researchCount;
  let seed = market.seed;

  if (state.activeIdeaId && state.researchTimer > 0 && researchTimer <= 0) {
    const asset = fundAssetById(state.activeIdeaId);
    if (asset) {
      const roll = random(seed);
      seed = roll.seed;
      researchConfidence = clamp(0.58 + state.staff.analyst * 0.14, 0, 0.9);
      const noise = (roll.value - 0.5) * (1 - researchConfidence) * 1.35;
      researchSignal = clamp(asset.alpha + noise, -1, 1);
      researchCount += 1;
      event = "research_complete";
    }
  }

  let nextState: HedgeFundState = {
    ...state,
    playerX,
    playerY,
    vx,
    vy,
    prices: market.prices,
    indexPrice: market.indexPrice,
    seed,
    newsTimer: market.newsTimer,
    newsLabel: market.newsLabel,
    newsSector: market.newsSector,
    newsTimeLeft: market.newsTimeLeft,
    researchTimer,
    researchSignal,
    researchConfidence,
    researchCount,
    elapsed: state.elapsed + dt,
    timeLeft: Math.max(0, state.timeLeft - dt),
  };

  const stats = fundStats(nextState);
  const highWaterNav = Math.max(nextState.highWaterNav, stats.nav);
  const drawdown = Math.max(0, (highWaterNav - stats.nav) / Math.max(1, highWaterNav));
  const maxDrawdown = Math.max(nextState.maxDrawdown, drawdown);
  const riskHot = stats.grossExposure > 1.5 || Math.abs(stats.betaExposure) > 0.65 || drawdown > 0.06;
  const riskPenalty = Math.max(0.18, 0.72 - nextState.staff.risk * 0.18);
  const riskBreaches = nextState.riskBreaches + (riskHot ? dt : 0);
  const reputation = clamp(nextState.reputation - (riskHot ? riskPenalty * dt : 0), 0, 100);

  nextState = { ...nextState, highWaterNav, maxDrawdown, riskBreaches, reputation };
  if (riskHot && event === "none" && Math.floor(state.elapsed) !== Math.floor(nextState.elapsed)) event = "risk_alert";

  let mode: FundMode = "playing";
  if (nextState.timeLeft <= 0) {
    mode = "complete";
    event = "complete";
  } else if (drawdown >= 0.12 || reputation <= 0) {
    mode = "gameover";
    event = "game_over";
  }

  return { state: { ...nextState, mode }, event };
}

export function positionSummary(state: HedgeFundState, assetId: FundAssetId) {
  const position = positionFor(state, assetId);
  if (!position) return null;
  const price = state.prices[assetId];
  const value = position.shares * price;
  const direction = position.shares >= 0 ? "LONG" : "SHORT";
  const pnl = position.shares * (price - position.avgPrice);
  return { direction, value, pnl, shares: position.shares, avgPrice: position.avgPrice, price };
}
