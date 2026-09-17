import path from "node:path";
import { openSpatialBrowser } from "./spatial-cdp.mjs";

const baseUrl = process.env.HEDGE_FUND_BASE_URL ?? "http://127.0.0.1:3015";
const artifactDir = process.env.HEDGE_FUND_ARTIFACT_DIR ?? "artifacts/browser";
const browser = await openSpatialBrowser({
  url: `${baseUrl}/games/hedge-fund-floor`,
  port: 9235,
  profilePrefix: "hedge-fund-hq",
});
const {
  waitForExpression,
  moveTo,
  pressE,
  clickButton,
  captureScreenshot,
  setMobile,
  clearMobile,
  runtimeErrors,
  close,
  evaluate,
} = browser;

const lastEventIs = (event) =>
  `document.querySelector('.game-canvas-mount')?.dataset.gameLastEvent === ${JSON.stringify(event)}`;

try {
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Hedge Fund HQ game"] canvas'))`, 16000, "Hedge Fund HQ canvas");
  await waitForExpression(lastEventIs("hedge_fund_started"), 12000, "fund runtime started");
  await waitForExpression(`Boolean(document.querySelector('[data-fund-regime]'))`, 5000, "fund mandate dataset");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Next mandate')`, 5000, "touch-accessible mandate button");

  const initialRegime = await evaluate(`document.querySelector('[data-fund-regime]')?.getAttribute('data-fund-regime') ?? null`);
  const start = await evaluate(`(() => { const n=document.querySelector('[data-fund-x]'); return { x:Number(n?.getAttribute('data-fund-x') ?? '0'), y:Number(n?.getAttribute('data-fund-y') ?? '0') }; })()`);

  await moveTo("fund", 250, 710, { tolerance: 22, maxPasses: 4, fast: true });
  await moveTo("fund", 250, 315, { tolerance: 22, maxPasses: 4, fast: true });
  await moveTo("fund", 170, 315, { tolerance: 22, maxPasses: 4, fast: true });
  await pressE();
  await waitForExpression(lastEventIs("hedge_fund_research_started"), 5000, "research starts after physical arrival");
  await waitForExpression(lastEventIs("hedge_fund_research_complete"), 12000, "research dossier completes");

  await moveTo("fund", 610, 255, { tolerance: 23, maxPasses: 5, fast: true });
  await pressE();
  await waitForExpression(lastEventIs("hedge_fund_trade_long"), 5000, "long thesis enters the portfolio");
  const unhedged = await waitForExpression(`(() => {
    const raw=document.querySelector('.game-canvas-mount')?.dataset.gameLastProperties;
    if(!raw) return false;
    const p=JSON.parse(raw);
    return Number(p.trades) >= 1 && Number(p.gross_exposure) > 0 && Math.abs(Number(p.beta_exposure)) > 0.02 && typeof p.regime === 'string' ? p : false;
  })()`, 5000, "position creates material beta inside a mandate");

  await moveTo("fund", 885, 260, { tolerance: 23, maxPasses: 5, fast: true });
  await pressE();
  const hedged = await waitForExpression(`(() => {
    const raw=document.querySelector('.game-canvas-mount')?.dataset.gameLastProperties;
    if(!raw) return false;
    const p=JSON.parse(raw);
    return Number(p.trades) >= 1 && Math.abs(Number(p.beta_exposure)) < 0.02 && typeof p.regime === 'string' ? p : false;
  })()`, 7000, "beta exposure reduced by hedge");

  await moveTo("fund", 720, 650, { tolerance: 24, maxPasses: 5, fast: true });
  await moveTo("fund", 280, 650, { tolerance: 24, maxPasses: 5, fast: true });
  await pressE();
  await waitForExpression(lastEventIs("hedge_fund_staff_hired"), 5000, "analyst hired in team operations");

  const staffed = await evaluate(`(() => ({
    x: Number(document.querySelector('[data-fund-x]')?.getAttribute('data-fund-x') ?? '0'),
    y: Number(document.querySelector('[data-fund-y]')?.getAttribute('data-fund-y') ?? '0'),
    positions: Number(document.querySelector('[data-fund-positions]')?.getAttribute('data-fund-positions') ?? '0'),
    regime: document.querySelector('[data-fund-regime]')?.getAttribute('data-fund-regime') ?? null,
    mandateCompliant: document.querySelector('[data-fund-mandate-compliant]')?.getAttribute('data-fund-mandate-compliant') ?? null
  }))()`);
  if (staffed.positions < 1) throw new Error(`Hedge Fund HQ lost its live position: ${JSON.stringify(staffed)}`);

  await captureScreenshot(path.join(artifactDir, "hedge-fund-hq-desktop.png"));

  // Prove replayability is accessible on touch/mobile, not keyboard-only.
  await setMobile();
  await captureScreenshot(path.join(artifactDir, "hedge-fund-hq-mobile.png"));
  await clickButton("Next mandate");
  await waitForExpression(lastEventIs("hedge_fund_started"), 8000, "mobile mandate rotation restarts fund");
  await waitForExpression(`document.querySelector('[data-fund-regime]')?.getAttribute('data-fund-regime') !== ${JSON.stringify(initialRegime)}`, 8000, "mobile mandate button changes regime");
  const rotatedRegime = await evaluate(`document.querySelector('[data-fund-regime]')?.getAttribute('data-fund-regime') ?? null`);
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Next mandate')`, 5000, "mandate button survives runtime remount");
  await clearMobile();

  await clickButton("Pause");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`, 6000, "fund pause");
  await clickButton("Resume");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`, 6000, "fund resume");

  // Shared Restart reruns the current mandate rather than silently changing the strategy.
  await clickButton("Restart");
  await waitForExpression(lastEventIs("hedge_fund_started"), 7000, "fund restart");
  await waitForExpression(`document.querySelector('[data-fund-regime]')?.getAttribute('data-fund-regime') === ${JSON.stringify(rotatedRegime)}`, 7000, "restart preserves current mandate");

  const finalState = await evaluate(`(() => ({
    canvas: Boolean(document.querySelector('[aria-label="Hedge Fund HQ game"] canvas')),
    lastEvent: document.querySelector('.game-canvas-mount')?.dataset.gameLastEvent ?? null,
    positions: Number(document.querySelector('[data-fund-positions]')?.getAttribute('data-fund-positions') ?? '-1'),
    regime: document.querySelector('[data-fund-regime]')?.getAttribute('data-fund-regime') ?? null,
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error')
  }))()`);

  if (!finalState.canvas || finalState.frameworkError || finalState.lastEvent !== "hedge_fund_started" || finalState.positions !== 0 || finalState.regime !== rotatedRegime) {
    throw new Error(`Final Hedge Fund HQ runtime invalid: ${JSON.stringify(finalState)}`);
  }
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl: `${baseUrl}/games/hedge-fund-floor`,
    topDownRoomNavigation: true,
    realKeyboardMovement: true,
    researchLibrary: true,
    portfolioCommittee: true,
    riskRoom: true,
    teamOperations: true,
    livePosition: true,
    betaHedge: true,
    betaBefore: Number(unhedged.beta_exposure),
    betaAfter: Number(hedged.beta_exposure),
    staffHire: true,
    regimeReplayability: true,
    mobileMandateRotation: true,
    initialRegime,
    rotatedRegime,
    desktopMobile: true,
    pauseResume: true,
    restart: true,
    path: { start, staffed },
  }));
} finally {
  await close();
}
