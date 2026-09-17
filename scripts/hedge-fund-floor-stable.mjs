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
  moveTo,
  pressE,
  clickButton,
  captureScreenshot,
  setMobile,
  clearMobile,
  runtimeErrors,
  close,
} = browser;

try {
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Hedge Fund Floor game"] canvas'))`, 16000, "Hedge Fund Floor canvas");
  await waitForExpression(`Boolean(document.querySelector('[data-fund-x]'))`, 12000, "fund player state");
  await waitForExpression(`document.querySelector('[data-fund-mode]')?.dataset.fundMode === 'playing'`, 12000, "fund playing state");

  const start = await browser.position("fund");

  // Research a company by physically walking to the research pod.
  await moveTo("fund", 170, 315, { order: "yx", tolerance: 18, maxPasses: 7, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-fund-idea]')?.dataset.fundIdea !== ''`, 7000, "research dossier opened");
  await waitForExpression(`Number(document.querySelector('[data-fund-research]')?.dataset.fundResearch ?? '99') <= 0`, 12000, "research dossier completes");

  // Carry the researched idea to the long pad and put real capital to work.
  await moveTo("fund", 610, 255, { order: "yx", tolerance: 18, maxPasses: 7, fast: true });
  await pressE();
  await waitForExpression(`Number(document.querySelector('[data-fund-trades]')?.dataset.fundTrades ?? '0') >= 1`, 7000, "long position executed");
  await waitForExpression(`Number(document.querySelector('[data-fund-gross]')?.dataset.fundGross ?? '0') > 0`, 7000, "gross exposure rises");

  // Walk to risk and neutralize the stock book's broad market beta.
  await moveTo("fund", 885, 260, { order: "yx", tolerance: 18, maxPasses: 7, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-fund-hedge]')?.dataset.fundHedge === 'true'`, 7000, "beta hedge set");

  // Spend operating budget on an analyst and prove staffing is a physical decision.
  await moveTo("fund", 280, 650, { order: "xy", tolerance: 18, maxPasses: 8, fast: true });
  await pressE();
  await waitForExpression(`Number(document.querySelector('[data-fund-analysts]')?.dataset.fundAnalysts ?? '0') >= 1`, 7000, "analyst hired");

  await captureScreenshot(path.join(artifactDir, "hedge-fund-floor-desktop.png"));
  await setMobile();
  await captureScreenshot(path.join(artifactDir, "hedge-fund-floor-mobile.png"));
  await clearMobile();

  await clickButton("Pause");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`, 6000, "fund pause");
  await clickButton("Resume");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`, 6000, "fund resume");

  await clickButton("Restart");
  await waitForExpression(`Number(document.querySelector('[data-fund-trades]')?.dataset.fundTrades ?? '-1') === 0`, 7000, "fund restart");
  await waitForExpression(`document.querySelector('[data-fund-hedge]')?.dataset.fundHedge === 'false'`, 7000, "hedge cleared on restart");

  const finalState = await browser.evaluate(`(() => ({
    canvas: Boolean(document.querySelector('[aria-label="Hedge Fund Floor game"] canvas')),
    mode: document.querySelector('[data-fund-mode]')?.dataset.fundMode ?? null,
    x: Number(document.querySelector('[data-fund-x]')?.dataset.fundX ?? 'NaN'),
    y: Number(document.querySelector('[data-fund-y]')?.dataset.fundY ?? 'NaN'),
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error')
  }))()`);

  if (!finalState.canvas || finalState.frameworkError || !Number.isFinite(finalState.x) || !Number.isFinite(finalState.y)) {
    throw new Error(`Final Hedge Fund Floor runtime invalid: ${JSON.stringify(finalState)}`);
  }
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl: `${baseUrl}/games/hedge-fund-floor`,
    start,
    realMovement: true,
    researchRoute: true,
    liveTrade: true,
    betaHedge: true,
    staffHire: true,
    desktopMobile: true,
    pauseResume: true,
    restart: true,
  }));
} finally {
  await close();
}
