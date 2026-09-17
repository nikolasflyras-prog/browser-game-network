import path from "node:path";
import { openSpatialBrowser } from "./spatial-cdp.mjs";

const baseUrl = process.env.HEDGE_FUND_BASE_URL ?? "http://127.0.0.1:3015";
const artifactDir = process.env.HEDGE_FUND_ARTIFACT_DIR ?? "artifacts/browser";
const browser = await openSpatialBrowser({
  url: `${baseUrl}/games/hedge-fund-floor`,
  port: 9235,
  profilePrefix: "hedge-fund-floor",
});
const {
  waitForExpression,
  keyHold,
  pressE,
  clickButton,
  captureScreenshot,
  setMobile,
  clearMobile,
  runtimeErrors,
  close,
} = browser;

const lastEventIs = (event) =>
  `document.querySelector('.game-canvas-mount')?.dataset.gameLastEvent === ${JSON.stringify(event)}`;

try {
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Hedge Fund HQ game"] canvas'))`, 16000, "Hedge Fund HQ canvas");
  await waitForExpression(lastEventIs("hedge_fund_started"), 12000, "fund runtime started");

  // The player starts at 110,710. Route into the research function and build a thesis.
  await keyHold("ArrowRight", 600, 80);
  await keyHold("ArrowUp", 1600, 80);
  await keyHold("ArrowLeft", 350, 120);
  await pressE();
  await waitForExpression(lastEventIs("hedge_fund_research_started"), 5000, "research starts after physical arrival");
  await waitForExpression(lastEventIs("hedge_fund_research_complete"), 12000, "research dossier completes");

  // Take the researched thesis into portfolio construction and put $5M of simulated NAV to work.
  await keyHold("ArrowUp", 220, 70);
  await keyHold("ArrowRight", 1750, 120);
  await pressE();
  await waitForExpression(lastEventIs("hedge_fund_trade_long"), 5000, "long thesis enters the portfolio");
  await waitForExpression(`(() => { const raw=document.querySelector('.game-canvas-mount')?.dataset.gameLastProperties; if(!raw) return false; const p=JSON.parse(raw); return Number(p.trades) >= 1 && Number(p.gross_exposure) > 0; })()`, 5000, "position changes gross exposure");

  // Move to risk and neutralize broad market beta without closing the stock-specific idea.
  await keyHold("ArrowRight", 1000, 120);
  await pressE();
  await waitForExpression(lastEventIs("hedge_fund_hedge_set"), 5000, "beta hedge set from risk function");
  await waitForExpression(`(() => { const raw=document.querySelector('.game-canvas-mount')?.dataset.gameLastProperties; if(!raw) return false; const p=JSON.parse(raw); return Math.abs(Number(p.beta_exposure)) < 0.02; })()`, 5000, "beta exposure reduced by hedge");

  // Firm building is spatial too: cross to recruiting and spend operating budget on an analyst.
  await keyHold("ArrowDown", 1550, 80);
  await keyHold("ArrowLeft", 2300, 120);
  await pressE();
  await waitForExpression(lastEventIs("hedge_fund_staff_hired"), 5000, "analyst hired after physical route");

  await captureScreenshot(path.join(artifactDir, "hedge-fund-floor-desktop.png"));
  await setMobile();
  await captureScreenshot(path.join(artifactDir, "hedge-fund-floor-mobile.png"));
  await clearMobile();

  await clickButton("Pause");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`, 6000, "fund pause");
  await clickButton("Resume");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`, 6000, "fund resume");

  await clickButton("Restart");
  await waitForExpression(lastEventIs("hedge_fund_started"), 7000, "fund restart");

  const finalState = await browser.evaluate(`(() => ({
    canvas: Boolean(document.querySelector('[aria-label="Hedge Fund HQ game"] canvas')),
    status: document.querySelector('.game-status')?.textContent ?? '',
    lastEvent: document.querySelector('.game-canvas-mount')?.dataset.gameLastEvent ?? null,
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error')
  }))()`);

  if (!finalState.canvas || finalState.frameworkError || finalState.lastEvent !== "hedge_fund_started") {
    throw new Error(`Final Hedge Fund HQ runtime invalid: ${JSON.stringify(finalState)}`);
  }
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl: `${baseUrl}/games/hedge-fund-floor`,
    realKeyboardMovement: true,
    researchRoute: true,
    livePosition: true,
    betaHedge: true,
    staffHire: true,
    desktopMobile: true,
    pauseResume: true,
    restart: true,
  }));
} finally {
  await close();
}
