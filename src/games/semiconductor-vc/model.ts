export type SemiVcMode = "playing" | "complete" | "gameover";
export type SemiVcEvent =
  | "none"
  | "collision"
  | "founder_arrived"
  | "founder_missed"
  | "deal_picked_up"
  | "diligence_complete"
  | "deal_passed"
  | "investment_made"
  | "staff_hired"
  | "portfolio_alert"
  | "follow_on"
  | "follow_on_declined"
  | "exit_realized"
  | "news"
  | "complete"
  | "game_over";

export type SemiTheme = "eda" | "ai" | "power" | "rf" | "packaging" | "memory" | "equipment" | "photonics";
export type PortfolioAlertKind = "up_round" | "bridge" | "down_round" | "design_win" | "customer_slip";

export type SemiCompany = {
  id: string;
  name: string;
  founder: string;
  sector: string;
  theme: SemiTheme;
  pitch: string;
  round: "Pre-seed" | "Seed" | "Series A";
  raiseAmount: number;
  preMoney: number;
  processNode: string;
  designStage: string;
  foundry: string;
  designWins: number;
  nreToDate: number;
  customerConcentrationPct: number;
  patents: number;
  quality: number;
  greenFlag?: string;
  redFlag?: string;
  hiddenInsight: string;
};

export type FounderVisit = {
  companyId: string;
  x: number;
  y: number;
  timeLeft: number;
};

export type VentureHolding = {
  companyId: string;
  invested: number;
  ownershipPct: number;
  mark: number;
  supportBoost: number;
};

export type SemiVcState = {
  playerX: number;
  playerY: number;
  vx: number;
  vy: number;
  timeLeft: number;
  elapsed: number;
  dryPowder: number;
  distributions: number;
  reserveSpent: number;
  operatingBudget: number;
  reputation: number;
  staff: number;
  activeDealId: string | null;
  activeDealDiligenced: boolean;
  incoming: FounderVisit[];
  holdings: VentureHolding[];
  nextDealIndex: number;
  dealSpawnTimer: number;
  analystCooldown: number;
  newsTimer: number;
  newsLabel: string | null;
  newsTheme: SemiTheme | "all" | null;
  newsEffect: number;
  newsTimeLeft: number;
  portfolioTimer: number;
  portfolioAlertCompanyId: string | null;
  portfolioAlertKind: PortfolioAlertKind | null;
  portfolioAlertHeadline: string | null;
  portfolioAlertTimeLeft: number;
  seed: number;
  investments: number;
  exits: number;
  passes: number;
  missedDeals: number;
  mode: SemiVcMode;
};

export type SemiVcInput = { x: number; y: number };

export const SEMI_VC_WORLD = { width: 1100, height: 700 } as const;
export const SEMI_VC_SESSION_SECONDS = 300;
export const SEMI_VC_FUND_SIZE = 10_000_000;
export const SEMI_VC_OPERATING_BUDGET = 1_000_000;
export const SEMI_VC_PLAYER_RADIUS = 15;
export const SEMI_VC_FOLLOW_ON_CHECK = 250_000;
export const SEMI_VC_BOARD_SUPPORT_COST = 75_000;
export const SEMI_VC_EXIT_MULTIPLE = 1.22;

export const semiVcCompanies: readonly SemiCompany[] = [
  {
    id: "latchwave",
    name: "Latchwave Design",
    founder: "Dana Whitfield",
    sector: "EDA Software",
    theme: "eda",
    pitch: "Analog and mixed-signal verification software that catches silicon-killing bugs before tape-out.",
    round: "Seed",
    raiseAmount: 3_000_000,
    preMoney: 12_000_000,
    processNode: "N/A (software)",
    designStage: "Commercial",
    foundry: "Foundry-agnostic",
    designWins: 4,
    nreToDate: 900_000,
    customerConcentrationPct: 20,
    patents: 3,
    quality: 0.78,
    greenFlag: "Two major analog design houses are already paying customers.",
    hiddenInsight: "Reference call: a customer said Latchwave caught a tape-out bug its internal flow had missed twice.",
  },
  {
    id: "emberlogic",
    name: "Emberlogic AI",
    founder: "Raj Iyer",
    sector: "AI Accelerators",
    theme: "ai",
    pitch: "A data-center inference accelerator optimized for lower cost per generated token.",
    round: "Series A",
    raiseAmount: 14_000_000,
    preMoney: 50_000_000,
    processNode: "5nm",
    designStage: "Engineering samples",
    foundry: "TSMC",
    designWins: 2,
    nreToDate: 9_000_000,
    customerConcentrationPct: 65,
    patents: 4,
    quality: 0.68,
    greenFlag: "Two hyperscaler qualification programs are active.",
    hiddenInsight: "One qualification team quietly paused after a competing accelerator posted a stronger benchmark.",
  },
  {
    id: "voltcrest",
    name: "Voltcrest Semiconductor",
    founder: "Elena Petrova",
    sector: "Power Semiconductors",
    theme: "power",
    pitch: "GaN-on-SiC power devices for high-efficiency EV fast charging.",
    round: "Seed",
    raiseAmount: 6_000_000,
    preMoney: 22_000_000,
    processNode: "180nm GaN-on-SiC",
    designStage: "Qualification",
    foundry: "In-house fab",
    designWins: 3,
    nreToDate: 5_500_000,
    customerConcentrationPct: 55,
    patents: 6,
    quality: 0.73,
    greenFlag: "A top-10 charging OEM has confirmed a design-in.",
    hiddenInsight: "The lead customer is still dual-sourcing; the design-in is real but not exclusive.",
  },
  {
    id: "skyferro",
    name: "Skyferro RF",
    founder: "Marcus Lindqvist",
    sector: "RF / Wireless",
    theme: "rf",
    pitch: "mmWave RF front-end chips for 5G and early 6G infrastructure.",
    round: "Pre-seed",
    raiseAmount: 2_000_000,
    preMoney: 9_000_000,
    processNode: "22nm RF-SOI",
    designStage: "Tape-out",
    foundry: "GlobalFoundries",
    designWins: 1,
    nreToDate: 3_200_000,
    customerConcentrationPct: 80,
    patents: 1,
    quality: 0.42,
    redFlag: "Lead RF engineer left mid-tape-out, delaying the program by two quarters.",
    hiddenInsight: "The departed engineer joined a direct competitor and took critical integration knowledge with them.",
  },
  {
    id: "latticebridge",
    name: "Latticebridge Packaging",
    founder: "Priya Subramaniam",
    sector: "Advanced Packaging / Chiplets",
    theme: "packaging",
    pitch: "Chiplet interconnect IP and packaging services that mix dies from multiple process nodes.",
    round: "Series A",
    raiseAmount: 10_000_000,
    preMoney: 38_000_000,
    processNode: "Multi-node",
    designStage: "Qualification",
    foundry: "OSAT + foundry ecosystem",
    designWins: 5,
    nreToDate: 7_000_000,
    customerConcentrationPct: 30,
    patents: 9,
    quality: 0.84,
    greenFlag: "Two AI-chip customers plan to reuse the interposer IP in next-generation products.",
    hiddenInsight: "Both reference customers confirmed expansion plans beyond the initial package.",
  },
  {
    id: "heliomem",
    name: "HelioMem Systems",
    founder: "Mei Chen",
    sector: "Memory Controllers / CXL",
    theme: "memory",
    pitch: "CXL memory-expansion controllers that pool capacity across AI servers.",
    round: "Seed",
    raiseAmount: 5_000_000,
    preMoney: 18_000_000,
    processNode: "12nm",
    designStage: "Engineering samples",
    foundry: "Samsung",
    designWins: 3,
    nreToDate: 4_400_000,
    customerConcentrationPct: 48,
    patents: 5,
    quality: 0.76,
    greenFlag: "Three server OEMs are validating the controller.",
    hiddenInsight: "The strongest design win requires a firmware feature that is still six months from production quality.",
  },
  {
    id: "forgesight",
    name: "ForgeSight Metrology",
    founder: "Noah Alvarez",
    sector: "Fab Equipment / Metrology",
    theme: "equipment",
    pitch: "Inline optical metrology for advanced-node process control and faster excursion detection.",
    round: "Seed",
    raiseAmount: 7_000_000,
    preMoney: 24_000_000,
    processNode: "Supports 7nm to 2nm",
    designStage: "Customer qualification",
    foundry: "Equipment supplier",
    designWins: 2,
    nreToDate: 6_200_000,
    customerConcentrationPct: 70,
    patents: 8,
    quality: 0.71,
    greenFlag: "A major foundry has installed two evaluation systems.",
    hiddenInsight: "The evaluation data is strong, but one calibration step still requires manual intervention by the founding CTO.",
  },
  {
    id: "photonmesa",
    name: "PhotonMesa Interconnect",
    founder: "Amara Okafor",
    sector: "Silicon Photonics",
    theme: "photonics",
    pitch: "Co-packaged optical I/O for scaling accelerator clusters beyond electrical reach.",
    round: "Series A",
    raiseAmount: 12_000_000,
    preMoney: 44_000_000,
    processNode: "45nm SOI photonics",
    designStage: "Engineering samples",
    foundry: "GlobalFoundries",
    designWins: 2,
    nreToDate: 10_500_000,
    customerConcentrationPct: 58,
    patents: 11,
    quality: 0.74,
    greenFlag: "Two switch-silicon partners are integrating evaluation modules.",
    hiddenInsight: "The photonics works, but packaging yield is currently below the threshold needed for attractive unit economics.",
  },
] as const;

export const semiVcLayout = {
  pitchSpots: [
    { x: 180, y: 350 },
    { x: 180, y: 205 },
    { x: 180, y: 500 },
  ],
  diligence: { x: 420, y: 350 },
  hire: { x: 525, y: 585 },
  icPads: [
    { id: "pass", label: "PASS", x: 760, y: 260, check: 0 },
    { id: "500k", label: "$500K", x: 760, y: 350, check: 500_000 },
    { id: "1m", label: "$1M", x: 760, y: 440, check: 1_000_000 },
  ],
  portfolioPads: [
    { id: "decline", label: "DECLINE", x: 915, y: 545 },
    { id: "support", label: "SUPPORT", x: 915, y: 625 },
  ],
  exit: { x: 1035, y: 585 },
  news: { x: 545, y: 95 },
  obstacles: [
    { x: 70, y: 90, width: 120, height: 88 },
    { x: 70, y: 535, width: 120, height: 88 },
    { x: 310, y: 110, width: 145, height: 92 },
    { x: 500, y: 110, width: 145, height: 92 },
    { x: 310, y: 500, width: 145, height: 92 },
    { x: 650, y: 95, width: 145, height: 90 },
    { x: 845, y: 95, width: 145, height: 90 },
    { x: 845, y: 300, width: 145, height: 90 },
  ],
} as const;

const newsEvents: readonly { label: string; theme: SemiTheme | "all"; effect: number }[] = [
  { label: "Hyperscaler accelerator orders move forward", theme: "ai", effect: 0.0018 },
  { label: "Advanced-packaging capacity tightens", theme: "packaging", effect: 0.0016 },
  { label: "EV charging forecast cut", theme: "power", effect: -0.0017 },
  { label: "RF infrastructure capex slips", theme: "rf", effect: -0.0015 },
  { label: "EDA budgets rise with design complexity", theme: "eda", effect: 0.0012 },
  { label: "Memory pooling adoption accelerates", theme: "memory", effect: 0.0015 },
  { label: "Leading-edge fab cycle lengthens", theme: "all", effect: -0.0007 },
  { label: "AI cluster optical roadmap pulls in", theme: "photonics", effect: 0.0018 },
  { label: "Foundry process-control spending expands", theme: "equipment", effect: 0.0014 },
] as const;

const portfolioKinds: readonly PortfolioAlertKind[] = ["up_round", "bridge", "down_round", "design_win", "customer_slip"];

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

function companyById(id: string | null) {
  return id ? semiVcCompanies.find((company) => company.id === id) ?? null : null;
}

function circleRectCollision(x: number, y: number, radius: number, rect: { x: number; y: number; width: number; height: number }) {
  const nearestX = clamp(x, rect.x, rect.x + rect.width);
  const nearestY = clamp(y, rect.y, rect.y + rect.height);
  return Math.hypot(x - nearestX, y - nearestY) < radius;
}

function portfolioHeadline(kind: PortfolioAlertKind, company: SemiCompany) {
  switch (kind) {
    case "up_round": return `${company.name}: outside lead offers a higher-priced round`;
    case "bridge": return `${company.name}: runway bridge needed before the next milestone`;
    case "down_round": return `${company.name}: insider down round proposed after a schedule slip`;
    case "design_win": return `${company.name}: major design win needs board-level execution support`;
    case "customer_slip": return `${company.name}: lead customer qualification slipped`;
  }
}

function spawnFounder(state: SemiVcState): SemiVcState {
  if (state.nextDealIndex >= semiVcCompanies.length || state.incoming.length >= semiVcLayout.pitchSpots.length) {
    return { ...state, dealSpawnTimer: 8 };
  }
  const company = semiVcCompanies[state.nextDealIndex];
  const spot = semiVcLayout.pitchSpots[state.nextDealIndex % semiVcLayout.pitchSpots.length];
  const roll = random(state.seed);
  return {
    ...state,
    seed: roll.seed,
    incoming: [...state.incoming, { companyId: company.id, x: spot.x, y: spot.y, timeLeft: 22 + roll.value * 8 }],
    nextDealIndex: state.nextDealIndex + 1,
    dealSpawnTimer: 18 + roll.value * 8,
  };
}

function markHoldings(state: SemiVcState, dt: number): SemiVcState {
  if (!state.holdings.length) return state;
  let seed = state.seed;
  const holdings = state.holdings.map((holding) => {
    const company = companyById(holding.companyId);
    if (!company) return holding;
    const noiseRoll = random(seed);
    seed = noiseRoll.seed;
    const noise = (noiseRoll.value - 0.5) * 0.0017;
    const qualityDrift = (company.quality - 0.56) * 0.00085;
    const newsDrift = state.newsTheme === "all" || state.newsTheme === company.theme ? state.newsEffect : 0;
    const support = holding.supportBoost * 0.00012;
    const multiplier = 1 + (qualityDrift + newsDrift + noise + support) * dt;
    return {
      ...holding,
      mark: clamp(holding.mark * multiplier, holding.invested * 0.2, holding.invested * 5),
      supportBoost: Math.max(0, holding.supportBoost - dt * 0.002),
    };
  });
  return { ...state, seed, holdings };
}

export function semiVcFundNav(state: Pick<SemiVcState, "dryPowder" | "holdings">) {
  return state.dryPowder + state.holdings.reduce((total, holding) => total + holding.mark, 0);
}

export function semiVcTvpi(state: Pick<SemiVcState, "dryPowder" | "holdings" | "distributions">) {
  return (semiVcFundNav(state) + state.distributions) / SEMI_VC_FUND_SIZE;
}

export function semiVcDpi(state: Pick<SemiVcState, "distributions">) {
  return state.distributions / SEMI_VC_FUND_SIZE;
}

export function semiVcMoic(state: Pick<SemiVcState, "dryPowder" | "holdings" | "distributions">) {
  return semiVcTvpi(state);
}

export function semiVcQuarter(state: Pick<SemiVcState, "elapsed">) {
  return Math.min(4, Math.floor(state.elapsed / (SEMI_VC_SESSION_SECONDS / 4)) + 1);
}

export function semiVcExitCandidate(state: Pick<SemiVcState, "holdings">) {
  return state.holdings
    .filter((holding) => holding.invested > 0 && holding.mark / holding.invested >= SEMI_VC_EXIT_MULTIPLE)
    .sort((a, b) => (b.mark / b.invested) - (a.mark / a.invested))[0] ?? null;
}

export function semiVcPortfolioDecision(state: Pick<SemiVcState, "portfolioAlertKind" | "operatingBudget" | "dryPowder">) {
  const kind = state.portfolioAlertKind;
  if (!kind) return null;
  const boardSupport = kind === "design_win" || kind === "customer_slip";
  const amount = boardSupport ? SEMI_VC_BOARD_SUPPORT_COST : SEMI_VC_FOLLOW_ON_CHECK;
  const source = boardSupport ? "operatingBudget" as const : "dryPowder" as const;
  const available = source === "operatingBudget" ? state.operatingBudget >= amount : state.dryPowder >= amount;
  return {
    kind,
    amount,
    source,
    available,
    supportLabel: boardSupport ? `BOARD SUPPORT · $${Math.round(amount / 1000)}K OPS` : `FOLLOW-ON · $${Math.round(amount / 1000)}K`,
  };
}

export function semiVcScore(state: Pick<SemiVcState, "dryPowder" | "holdings" | "distributions" | "reputation" | "staff" | "missedDeals" | "investments" | "passes" | "exits">) {
  const tvpi = semiVcTvpi(state);
  const dpi = semiVcDpi(state);
  return Math.max(0, Math.round(800 + (tvpi - 1) * 1800 + dpi * 850 + state.reputation * 5 + state.staff * 70 + state.investments * 55 + state.exits * 100 + state.passes * 18 - state.missedDeals * 110));
}

export function createSemiVcState(seed = 271828): SemiVcState {
  return {
    playerX: 560,
    playerY: 350,
    vx: 0,
    vy: 0,
    timeLeft: SEMI_VC_SESSION_SECONDS,
    elapsed: 0,
    dryPowder: SEMI_VC_FUND_SIZE,
    distributions: 0,
    reserveSpent: 0,
    operatingBudget: SEMI_VC_OPERATING_BUDGET,
    reputation: 100,
    staff: 1,
    activeDealId: null,
    activeDealDiligenced: false,
    incoming: [{ companyId: semiVcCompanies[0].id, x: semiVcLayout.pitchSpots[0].x, y: semiVcLayout.pitchSpots[0].y, timeLeft: 30 }],
    holdings: [],
    nextDealIndex: 1,
    dealSpawnTimer: 16,
    analystCooldown: 0,
    newsTimer: 24,
    newsLabel: null,
    newsTheme: null,
    newsEffect: 0,
    newsTimeLeft: 0,
    portfolioTimer: 38,
    portfolioAlertCompanyId: null,
    portfolioAlertKind: null,
    portfolioAlertHeadline: null,
    portfolioAlertTimeLeft: 0,
    seed: seed >>> 0,
    investments: 0,
    exits: 0,
    passes: 0,
    missedDeals: 0,
    mode: "playing",
  };
}

export function semiVcActiveCompany(state: SemiVcState) {
  return companyById(state.activeDealId);
}

export function semiVcPrompt(state: SemiVcState) {
  if (state.mode !== "playing") return "";
  const active = semiVcActiveCompany(state);

  if (active) {
    if (distance(state.playerX, state.playerY, semiVcLayout.diligence.x, semiVcLayout.diligence.y) <= 58) {
      if (state.activeDealDiligenced) return "DILIGENCE COMPLETE";
      if (state.analystCooldown > 0) return `ANALYST BUSY · ${Math.ceil(state.analystCooldown)}s`;
      return "E · RUN DILIGENCE";
    }
    for (const pad of semiVcLayout.icPads) {
      if (distance(state.playerX, state.playerY, pad.x, pad.y) <= 54) {
        if (pad.check > state.dryPowder) return "NOT ENOUGH DRY POWDER";
        return pad.check === 0 ? "E · PASS" : `E · INVEST ${pad.label}`;
      }
    }
    return `${active.name.toUpperCase()} · TAKE FILE TO DILIGENCE OR IC`;
  }

  const founder = state.incoming.find((visit) => distance(state.playerX, state.playerY, visit.x, visit.y) <= 50);
  if (founder) {
    const company = companyById(founder.companyId);
    return company ? `E · MEET ${company.name.toUpperCase()}` : "E · MEET FOUNDER";
  }

  if (distance(state.playerX, state.playerY, semiVcLayout.hire.x, semiVcLayout.hire.y) <= 58) {
    if (state.staff >= 3) return "TEAM FULL";
    if (state.operatingBudget < 150_000) return "OPERATING BUDGET TOO LOW";
    return "E · HIRE ANALYST · $150K";
  }

  if (state.portfolioAlertCompanyId) {
    const decision = semiVcPortfolioDecision(state);
    for (const pad of semiVcLayout.portfolioPads) {
      if (distance(state.playerX, state.playerY, pad.x, pad.y) <= 58) {
        if (pad.id === "support" && !decision?.available) return decision?.source === "operatingBudget" ? "OPERATING BUDGET TOO LOW" : "NOT ENOUGH DRY POWDER";
        return pad.id === "support" ? `E · ${decision?.supportLabel ?? "SUPPORT"}` : "E · DECLINE / PRESERVE CAPITAL";
      }
    }
  }

  if (!state.portfolioAlertCompanyId) {
    const exit = semiVcExitCandidate(state);
    if (exit && distance(state.playerX, state.playerY, semiVcLayout.exit.x, semiVcLayout.exit.y) <= 60) {
      const company = companyById(exit.companyId);
      return `E · REALIZE ${company?.name.toUpperCase() ?? "EXIT"} · ${(exit.mark / exit.invested).toFixed(2)}x`;
    }
  }

  return "MOVE · WORK THE OFFICE";
}

function declinePortfolioAlert(state: SemiVcState): SemiVcState {
  const kind = state.portfolioAlertKind;
  const companyId = state.portfolioAlertCompanyId;
  if (!kind || !companyId) return { ...state, portfolioAlertCompanyId: null, portfolioAlertKind: null, portfolioAlertHeadline: null, portfolioAlertTimeLeft: 0 };

  const holdings = state.holdings.map((holding) => {
    if (holding.companyId !== companyId) return holding;
    if (kind === "up_round") return { ...holding, mark: holding.mark * 1.08, ownershipPct: holding.ownershipPct * 0.82 };
    if (kind === "bridge") return { ...holding, mark: holding.mark * 0.88, ownershipPct: holding.ownershipPct * 0.92 };
    if (kind === "down_round") return { ...holding, mark: holding.mark * 0.72, ownershipPct: holding.ownershipPct * 0.78 };
    if (kind === "design_win") return { ...holding, mark: holding.mark * 1.1 };
    return { ...holding, mark: holding.mark * 0.78 };
  });

  const reputationHit = kind === "design_win" ? 0.5 : kind === "customer_slip" ? 1.5 : 2;
  return {
    ...state,
    holdings,
    portfolioAlertCompanyId: null,
    portfolioAlertKind: null,
    portfolioAlertHeadline: null,
    portfolioAlertTimeLeft: 0,
    reputation: Math.max(0, state.reputation - reputationHit),
  };
}

function supportPortfolioAlert(state: SemiVcState): SemiVcState {
  const kind = state.portfolioAlertKind;
  const companyId = state.portfolioAlertCompanyId;
  const decision = semiVcPortfolioDecision(state);
  if (!kind || !companyId || !decision?.available) return state;

  let dryPowder = state.dryPowder;
  let operatingBudget = state.operatingBudget;
  let reserveSpent = state.reserveSpent;
  if (decision.source === "dryPowder") {
    dryPowder -= decision.amount;
    reserveSpent += decision.amount;
  } else {
    operatingBudget -= decision.amount;
  }

  const holdings = state.holdings.map((holding) => {
    if (holding.companyId !== companyId) return holding;
    if (kind === "design_win") return { ...holding, mark: holding.mark * 1.2, supportBoost: Math.min(1, holding.supportBoost + 0.3) };
    if (kind === "customer_slip") return { ...holding, mark: holding.mark * 0.96, supportBoost: Math.min(1, holding.supportBoost + 0.35) };
    if (kind === "up_round") return { ...holding, invested: holding.invested + decision.amount, mark: holding.mark * 1.08 + decision.amount, ownershipPct: Math.min(100, holding.ownershipPct * 1.01), supportBoost: Math.min(1, holding.supportBoost + 0.25) };
    if (kind === "bridge") return { ...holding, invested: holding.invested + decision.amount, mark: holding.mark + decision.amount * 0.96, ownershipPct: Math.min(100, holding.ownershipPct * 1.03), supportBoost: Math.min(1, holding.supportBoost + 0.35) };
    return { ...holding, invested: holding.invested + decision.amount, mark: holding.mark * 0.88 + decision.amount, ownershipPct: Math.min(100, holding.ownershipPct * 1.12), supportBoost: Math.min(1, holding.supportBoost + 0.4) };
  });

  return {
    ...state,
    holdings,
    dryPowder,
    operatingBudget,
    reserveSpent,
    portfolioAlertCompanyId: null,
    portfolioAlertKind: null,
    portfolioAlertHeadline: null,
    portfolioAlertTimeLeft: 0,
    reputation: Math.min(100, state.reputation + 1.5),
  };
}

export function interactSemiVc(state: SemiVcState): { state: SemiVcState; event: SemiVcEvent } {
  if (state.mode !== "playing") return { state, event: "none" };

  const active = semiVcActiveCompany(state);
  if (active) {
    if (distance(state.playerX, state.playerY, semiVcLayout.diligence.x, semiVcLayout.diligence.y) <= 58) {
      if (state.activeDealDiligenced || state.analystCooldown > 0) return { state, event: "none" };
      const cooldown = Math.max(4.5, 10 - (state.staff - 1) * 2.5);
      return {
        state: { ...state, activeDealDiligenced: true, analystCooldown: cooldown },
        event: "diligence_complete",
      };
    }

    const icPad = semiVcLayout.icPads.find((pad) => distance(state.playerX, state.playerY, pad.x, pad.y) <= 54);
    if (icPad) {
      if (icPad.check === 0) {
        return {
          state: { ...state, activeDealId: null, activeDealDiligenced: false, passes: state.passes + 1, reputation: Math.min(100, state.reputation + 0.5) },
          event: "deal_passed",
        };
      }
      if (icPad.check > state.dryPowder) return { state, event: "none" };
      const postMoney = active.preMoney + active.raiseAmount;
      const ownershipPct = (icPad.check / postMoney) * 100;
      const qualityAdjustment = state.activeDealDiligenced ? 1 + (active.quality - 0.5) * 0.05 : 1;
      const holding: VentureHolding = {
        companyId: active.id,
        invested: icPad.check,
        ownershipPct,
        mark: icPad.check * qualityAdjustment,
        supportBoost: 0,
      };
      return {
        state: {
          ...state,
          dryPowder: state.dryPowder - icPad.check,
          holdings: [...state.holdings, holding],
          activeDealId: null,
          activeDealDiligenced: false,
          investments: state.investments + 1,
          reputation: Math.min(100, state.reputation + 1),
        },
        event: "investment_made",
      };
    }
    return { state, event: "none" };
  }

  const founderIndex = state.incoming.findIndex((visit) => distance(state.playerX, state.playerY, visit.x, visit.y) <= 50);
  if (founderIndex >= 0) {
    const incoming = [...state.incoming];
    const [founder] = incoming.splice(founderIndex, 1);
    if (!founder) return { state, event: "none" };
    return {
      state: { ...state, incoming, activeDealId: founder.companyId, activeDealDiligenced: false },
      event: "deal_picked_up",
    };
  }

  if (distance(state.playerX, state.playerY, semiVcLayout.hire.x, semiVcLayout.hire.y) <= 58 && state.staff < 3 && state.operatingBudget >= 150_000) {
    return {
      state: { ...state, staff: state.staff + 1, operatingBudget: state.operatingBudget - 150_000 },
      event: "staff_hired",
    };
  }

  if (state.portfolioAlertCompanyId) {
    const pad = semiVcLayout.portfolioPads.find((item) => distance(state.playerX, state.playerY, item.x, item.y) <= 58);
    if (pad?.id === "decline") {
      return { state: declinePortfolioAlert(state), event: "follow_on_declined" };
    }
    if (pad?.id === "support") {
      const next = supportPortfolioAlert(state);
      if (next === state) return { state, event: "none" };
      return { state: next, event: "follow_on" };
    }
  }

  if (!state.portfolioAlertCompanyId && distance(state.playerX, state.playerY, semiVcLayout.exit.x, semiVcLayout.exit.y) <= 60) {
    const candidate = semiVcExitCandidate(state);
    if (candidate) {
      return {
        state: {
          ...state,
          holdings: state.holdings.filter((holding) => holding !== candidate),
          distributions: state.distributions + candidate.mark,
          exits: state.exits + 1,
          reputation: Math.min(100, state.reputation + 2),
        },
        event: "exit_realized",
      };
    }
  }

  return { state, event: "none" };
}

export function advanceSemiVc(state: SemiVcState, input: SemiVcInput, deltaSeconds: number): { state: SemiVcState; event: SemiVcEvent } {
  if (state.mode !== "playing") return { state, event: "none" };
  const dt = clamp(deltaSeconds, 0, 0.05);
  const magnitude = Math.hypot(input.x, input.y);
  const nx = magnitude > 1 ? input.x / magnitude : input.x;
  const ny = magnitude > 1 ? input.y / magnitude : input.y;
  const speed = 245;
  const blend = Math.min(1, dt * 9);
  let vx = state.vx + (nx * speed - state.vx) * blend;
  let vy = state.vy + (ny * speed - state.vy) * blend;
  let playerX = clamp(state.playerX + vx * dt, SEMI_VC_PLAYER_RADIUS + 8, SEMI_VC_WORLD.width - SEMI_VC_PLAYER_RADIUS - 8);
  let playerY = clamp(state.playerY + vy * dt, SEMI_VC_PLAYER_RADIUS + 8, SEMI_VC_WORLD.height - SEMI_VC_PLAYER_RADIUS - 8);
  let event: SemiVcEvent = "none";

  if (semiVcLayout.obstacles.some((rect) => circleRectCollision(playerX, playerY, SEMI_VC_PLAYER_RADIUS, rect))) {
    playerX = state.playerX;
    playerY = state.playerY;
    vx *= -0.1;
    vy *= -0.1;
    event = "collision";
  }

  let next: SemiVcState = {
    ...state,
    playerX,
    playerY,
    vx,
    vy,
    elapsed: state.elapsed + dt,
    timeLeft: Math.max(0, state.timeLeft - dt),
    analystCooldown: Math.max(0, state.analystCooldown - dt),
    dealSpawnTimer: state.dealSpawnTimer - dt,
    newsTimer: state.newsTimer - dt,
    newsTimeLeft: Math.max(0, state.newsTimeLeft - dt),
    portfolioTimer: state.portfolioTimer - dt,
    portfolioAlertTimeLeft: Math.max(0, state.portfolioAlertTimeLeft - dt),
  };

  const expired = next.incoming.filter((visit) => visit.timeLeft - dt <= 0).length;
  next = {
    ...next,
    incoming: next.incoming
      .map((visit) => ({ ...visit, timeLeft: visit.timeLeft - dt }))
      .filter((visit) => visit.timeLeft > 0),
  };
  if (expired > 0) {
    next = {
      ...next,
      missedDeals: next.missedDeals + expired,
      reputation: Math.max(0, next.reputation - expired * 5),
    };
    if (event === "none") event = "founder_missed";
  }

  if (next.newsTimeLeft <= 0 && next.newsLabel) {
    next = { ...next, newsLabel: null, newsTheme: null, newsEffect: 0 };
  }

  if (next.dealSpawnTimer <= 0) {
    const before = next.incoming.length;
    next = spawnFounder(next);
    if (next.incoming.length > before && event === "none") event = "founder_arrived";
  }

  if (next.newsTimer <= 0) {
    const roll = random(next.seed);
    const picked = newsEvents[Math.floor(roll.value * newsEvents.length) % newsEvents.length];
    const waitRoll = random(roll.seed);
    next = {
      ...next,
      seed: waitRoll.seed,
      newsLabel: picked.label,
      newsTheme: picked.theme,
      newsEffect: picked.effect,
      newsTimeLeft: 14,
      newsTimer: 30 + waitRoll.value * 16,
    };
    if (event === "none") event = "news";
  }

  next = markHoldings(next, dt);

  if (!next.portfolioAlertCompanyId && next.holdings.length > 0 && next.portfolioTimer <= 0) {
    const holdingRoll = random(next.seed);
    const holding = next.holdings[Math.floor(holdingRoll.value * next.holdings.length) % next.holdings.length];
    const kindRoll = random(holdingRoll.seed);
    const kind = portfolioKinds[Math.floor(kindRoll.value * portfolioKinds.length) % portfolioKinds.length];
    const waitRoll = random(kindRoll.seed);
    const company = companyById(holding.companyId);
    next = {
      ...next,
      seed: waitRoll.seed,
      portfolioAlertCompanyId: holding.companyId,
      portfolioAlertKind: kind,
      portfolioAlertHeadline: company ? portfolioHeadline(kind, company) : "Portfolio company needs a decision",
      portfolioAlertTimeLeft: 28,
      portfolioTimer: 38 + waitRoll.value * 16,
    };
    if (event === "none") event = "portfolio_alert";
  }

  if (next.portfolioAlertCompanyId && next.portfolioAlertTimeLeft <= 0) {
    next = {
      ...declinePortfolioAlert(next),
      portfolioTimer: Math.max(next.portfolioTimer, 18),
    };
    if (event === "none") event = "follow_on_declined";
  }

  if (next.reputation <= 0) {
    next = { ...next, reputation: 0, mode: "gameover", vx: 0, vy: 0 };
    return { state: next, event: "game_over" };
  }

  if (next.timeLeft <= 0) {
    next = { ...next, timeLeft: 0, mode: "complete", vx: 0, vy: 0 };
    return { state: next, event: "complete" };
  }

  return { state: next, event };
}
