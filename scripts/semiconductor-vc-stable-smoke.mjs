import path from "node:path";
import { openSpatialBrowser } from "./spatial-cdp.mjs";

const targetUrl = process.env.SEMI_VC_URL ?? "http://127.0.0.1:3012/games/semiconductor-vc";
const artifactDir = process.env.SEMI_VC_ARTIFACT_DIR ?? "artifacts/browser";

const browser = await openSpatialBrowser({ url: targetUrl, port: 9232, profilePrefix: "semiconductor-vc-stable" });
const { waitForExpression, position, moveAxis, pressE, clickButton, captureScreenshot, setMobile, runtimeErrors, close } = browser;

try {
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Sand Hill VC game"] canvas'))`, 16000, "Sand Hill VC canvas");
  await waitForExpression(`Boolean(document.querySelector('[data-semi-x]'))`, 16000, "Sand Hill VC player state");
  await waitForExpression(`document.querySelector('[data-semi-mode]')?.dataset.semiMode === 'playing'`, 12000, "Sand Hill VC playing state");

  const startPosition = await position("semi");

  const founderPosition = await moveAxis("semi", "x", 180, { tolerance: 22, maxSteps: 55 });
  if (!(founderPosition.x < startPosition.x - 250)) throw new Error(`Dealer did not traverse the office to the founder: ${JSON.stringify({ startPosition, founderPosition })}`);
  await pressE();
  await waitForExpression(`document.querySelector('[data-semi-active]')?.dataset.semiActive === 'latchwave'`, 12000, "founder deal pickup");

  const diligencePosition = await moveAxis("semi", "x", 420, { tolerance: 22, maxSteps: 45 });
  await pressE();
  await waitForExpression(`document.querySelector('[data-semi-diligenced]')?.dataset.semiDiligenced === 'true'`, 12000, "technical diligence completion");

  const icPosition = await moveAxis("semi", "x", 760, { tolerance: 22, maxSteps: 50 });
  await pressE();
  await waitForExpression(`Number(document.querySelector('[data-semi-investments]')?.dataset.semiInvestments ?? '0') >= 1`, 12000, "investment committee decision");
  await waitForExpression(`Number(document.querySelector('[data-semi-holdings]')?.dataset.semiHoldings ?? '0') >= 1`, 12000, "portfolio holding creation");
  await waitForExpression(`document.querySelector('[data-semi-active]')?.dataset.semiActive === ''`, 12000, "deal file cleared after IC");

  await clickButton("Pause");
  await waitForExpression(`document.querySelector('.game-status')?.textContent?.trim() === 'Paused'`, 6000, "paused status");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`, 6000, "resume control");
  await clickButton("Resume");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`, 6000, "pause control after resume");
  await waitForExpression(`document.querySelector('[data-semi-mode]')?.dataset.semiMode === 'playing'`, 6000, "running state after resume");

  await captureScreenshot(path.join(artifactDir, "semiconductor-vc-desktop.png"));
  await setMobile();
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Sand Hill VC game"] canvas'))`, 6000, "mobile Sand Hill VC canvas");
  await captureScreenshot(path.join(artifactDir, "semiconductor-vc-mobile.png"));

  await clickButton("Restart");
  await waitForExpression(`document.querySelector('[data-semi-active]')?.dataset.semiActive === ''`, 7000, "deal reset");
  await waitForExpression(`document.querySelector('[data-semi-investments]')?.dataset.semiInvestments === '0'`, 7000, "investment reset");
  await waitForExpression(`document.querySelector('[data-semi-mode]')?.dataset.semiMode === 'playing'`, 7000, "playing state after restart");

  const finalState = await browser.evaluate(`(() => ({ canvas:Boolean(document.querySelector('[aria-label="Sand Hill VC game"] canvas')), frameworkError:Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error') }))()`);
  if (!finalState.canvas || finalState.frameworkError) throw new Error(`Semiconductor VC runtime invalid: ${JSON.stringify(finalState)}`);
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    realMovementVerified: true,
    founderMeetingVerified: true,
    diligenceRouteVerified: true,
    investmentCommitteeVerified: true,
    movementPath: { startPosition, founderPosition, diligencePosition, icPosition },
    pauseResumeVerified: true,
    desktopMobileCaptured: true,
    restartVerified: true,
  }));
} finally {
  await close();
}
