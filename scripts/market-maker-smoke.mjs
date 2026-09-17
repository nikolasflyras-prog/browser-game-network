import path from "node:path";
import { openSpatialBrowser } from "./spatial-cdp.mjs";

const targetUrl = process.env.MARKET_MAKER_URL ?? "http://127.0.0.1:3000/games/market-maker";
const artifactDir = process.env.MARKET_MAKER_ARTIFACT_DIR ?? "artifacts/browser";
const browser = await openSpatialBrowser({
  url: targetUrl,
  port: 9228,
  profilePrefix: "market-maker-arcade",
});

const {
  evaluate,
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

const mount = `document.querySelector('section[aria-label="Market Maker game"] .game-canvas-mount')`;

try {
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Market Maker game"] .game-canvas-mount canvas'))`, 16000, "Market Maker canvas");
  await waitForExpression(`${mount}?.dataset.marketArcade === 'true'`, 12000, "Market Maker spatial runtime");

  const initial = await evaluate(`(() => ({
    x: Number(${mount}?.dataset.marketPlayerX ?? '0'),
    y: Number(${mount}?.dataset.marketPlayerY ?? '0'),
    completed: Number(${mount}?.dataset.marketCompleted ?? '-1')
  }))()`);
  if (initial.x < 450 || initial.x > 550 || initial.completed !== 0) {
    throw new Error(`Unexpected Market Maker initial state: ${JSON.stringify(initial)}`);
  }

  // Pick up the seeded client ticket at the middle client desk. This uses real arrow-key movement.
  await moveTo("market-player", 185, 320, { tolerance: 25, maxPasses: 4, fast: true });
  await pressE();
  await waitForExpression(`Boolean(${mount}?.dataset.marketCarried)`, 6000, "client ticket pickup");

  // Route around the central desk islands to ALPHA rather than trying to cut through furniture.
  await moveTo("market-player", 185, 70, { tolerance: 24, maxPasses: 4, fast: true });
  await moveTo("market-player", 805, 70, { tolerance: 24, maxPasses: 4, fast: true });
  await moveTo("market-player", 805, 145, { tolerance: 24, maxPasses: 4, fast: true });
  await pressE();
  await waitForExpression(`!${mount}?.dataset.marketCarried && Number(${mount}?.dataset.marketCompleted ?? '0') >= 1`, 7000, "venue execution");

  const afterFill = await evaluate(`(() => ({
    completed: Number(${mount}?.dataset.marketCompleted ?? '0'),
    inventory: Number(${mount}?.dataset.marketInventory ?? '0'),
    x: Number(${mount}?.dataset.marketPlayerX ?? '0'),
    y: Number(${mount}?.dataset.marketPlayerY ?? '0')
  }))()`);
  if (afterFill.completed < 1 || Math.abs(afterFill.inventory) < 1) {
    throw new Error(`Market Maker fill did not change dealer state: ${JSON.stringify(afterFill)}`);
  }

  await clickButton("Pause");
  await waitForExpression(`document.querySelector('section[aria-label="Market Maker game"] .game-status')?.textContent === 'Paused'`, 6000, "Market Maker pause");
  await clickButton("Resume");
  await waitForExpression(`document.querySelector('section[aria-label="Market Maker game"] .game-status')?.textContent?.includes('resumed')`, 6000, "Market Maker resume");

  await captureScreenshot(path.join(artifactDir, "market-maker-arcade-desktop.png"));
  await setMobile();
  await captureScreenshot(path.join(artifactDir, "market-maker-arcade-mobile.png"));
  await clearMobile();

  await clickButton("Restart");
  await waitForExpression(`Number(${mount}?.dataset.marketCompleted ?? '-1') === 0 && Number(${mount}?.dataset.marketPlayerX ?? '0') > 450`, 7000, "Market Maker restart");

  const finalState = await evaluate(`(() => ({
    arcade: ${mount}?.dataset.marketArcade,
    completed: ${mount}?.dataset.marketCompleted,
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error')
  }))()`);
  if (finalState.arcade !== "true" || finalState.completed !== "0" || finalState.frameworkError) {
    throw new Error(`Market Maker final state invalid: ${JSON.stringify(finalState)}`);
  }
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    realKeyboardMovement: true,
    clientPickup: true,
    obstacleSafeVenueRoute: true,
    venueExecution: true,
    inventoryChanged: true,
    desktopMobile: true,
    pauseResume: true,
    restart: true,
  }));
} finally {
  await close();
}
