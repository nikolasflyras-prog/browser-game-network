import path from "node:path";
import { openSpatialBrowser } from "./spatial-cdp.mjs";

const baseUrl = process.env.SEMI_BATCH3_BASE_URL ?? "http://127.0.0.1:3014";
const artifactDir = process.env.SEMI_BATCH3_ARTIFACT_DIR ?? "artifacts/browser";
const browser = await openSpatialBrowser({ url: `${baseUrl}/games/fab-floor`, port: 9234, profilePrefix: "semiconductor-campus-batch3" });
const { waitForExpression, moveTo, pressE, clickButton, navigate, captureScreenshot, setMobile, clearMobile, runtimeErrors, close, sleep } = browser;

async function installRack(stagingY, rackId, slotX, slotY, expectedSlots) {
  // Every trip to staging goes through the central service aisle. Several staging rows sit
  // behind the left-side equipment blocks, so a direct horizontal move can correctly collide.
  // The smoke should prove real navigation rather than asking the movement harness to phase
  // through furniture.
  await moveTo("dc", 230, 350, { order: "yx", tolerance: 18, maxPasses: 6, fast: true });
  await moveTo("dc", 110, stagingY, { order: "xy", tolerance: 17, maxPasses: 6, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-dc-carried]')?.dataset.dcCarried === ${JSON.stringify(rackId)}`, 7000, `pick up ${rackId}`);
  await moveTo("dc", 230, 350, { order: "yx", tolerance: 18, maxPasses: 5, fast: true });
  await moveTo("dc", slotX, slotY, { order: "xy", tolerance: 17, maxPasses: 6, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-dc-slots]')?.dataset.dcSlots === ${JSON.stringify(String(expectedSlots))}`, 7000, `install ${rackId}`);
  await waitForExpression(`document.querySelector('[data-dc-carried]')?.dataset.dcCarried === ''`, 7000, `release ${rackId}`);
}

try {
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Fab Floor game"] canvas'))`, 16000, "Fab Floor canvas");
  await waitForExpression(`Boolean(document.querySelector('[data-fab-x]'))`, 16000, "Fab Floor player state");
  await waitForExpression(`document.querySelector('[data-fab-mode]')?.dataset.fabMode === 'playing'`, 12000, "Fab Floor playing state");

  const fabStart = await browser.position("fab");
  await moveTo("fab", 120, 370, { order: "yx", tolerance: 17, maxPasses: 6 });
  await pressE();
  await waitForExpression(`Number(document.querySelector('[data-fab-lots]')?.dataset.fabLots ?? '0') >= 1`, 7000, "release wafer lot");

  // Use the open aisle beneath the process tools. Going straight across at y≈380 clips the
  // lithography tool's collision radius; this route mirrors how a player actually navigates the fab.
  await moveTo("fab", 745, 425, { order: "yx", tolerance: 18, maxPasses: 6, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-fab-focus]')?.dataset.fabFocus === 'etch'`, 7000, "assign etch focus");

  await moveTo("fab", 1080, 620, { order: "xy", tolerance: 18, maxPasses: 6, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-fab-kit]')?.dataset.fabKit === 'true'`, 7000, "pick maintenance kit");
  await waitForExpression(`Number(document.querySelector('[data-fab-completed]')?.dataset.fabCompleted ?? '0') >= 1`, 18000, "wafer lot clears fab line");

  await captureScreenshot(path.join(artifactDir, "fab-floor-desktop.png"));
  await setMobile();
  await captureScreenshot(path.join(artifactDir, "fab-floor-mobile.png"));
  await clearMobile();

  await clickButton("Pause");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`, 6000, "Fab Floor pause");
  await clickButton("Resume");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`, 6000, "Fab Floor resume");

  await navigate(`${baseUrl}/games/data-center-architect`);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Data Center Architect game"] canvas'))`, 16000, "Data Center Architect canvas");
  await waitForExpression(`Boolean(document.querySelector('[data-dc-x]'))`, 16000, "Data Center Architect player state");
  await waitForExpression(`document.querySelector('[data-dc-mode]')?.dataset.dcMode === 'playing'`, 12000, "Data Center Architect playing state");

  await installRack(130, "compute", 500, 225, 1);
  await installRack(250, "network", 650, 225, 2);
  await installRack(130, "compute", 800, 225, 3);
  await installRack(490, "cooling", 500, 430, 4);
  await installRack(610, "storage", 650, 430, 5);
  await installRack(370, "power", 800, 430, 6);
  await installRack(370, "power", 950, 225, 7);
  await waitForExpression(`document.querySelector('[data-dc-ready]')?.dataset.dcReady === 'true'`, 7000, "data hall meets workload SLA");

  await moveTo("dc", 1160, 215, { order: "xy", tolerance: 18, maxPasses: 6, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-dc-running]')?.dataset.dcRunning === 'true'`, 7000, "launch training workload");
  await sleep(1800);
  await waitForExpression(`document.querySelector('[data-dc-mode]')?.dataset.dcMode === 'playing'`, 4000, "workload remains live");

  await captureScreenshot(path.join(artifactDir, "data-center-architect-desktop.png"));
  await setMobile();
  await captureScreenshot(path.join(artifactDir, "data-center-architect-mobile.png"));
  await clearMobile();

  await clickButton("Pause");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`, 6000, "Data Center pause");
  await clickButton("Resume");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`, 6000, "Data Center resume");
  await waitForExpression(`document.querySelector('[data-dc-running]')?.dataset.dcRunning === 'true'`, 5000, "workload resumes");

  const finalState = await browser.evaluate(`(() => ({
    canvas: Boolean(document.querySelector('[aria-label="Data Center Architect game"] canvas')),
    mode: document.querySelector('[data-dc-mode]')?.dataset.dcMode ?? null,
    slots: document.querySelector('[data-dc-slots]')?.dataset.dcSlots ?? null,
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error')
  }))()`);
  if (!finalState.canvas || finalState.frameworkError) throw new Error(`Final Data Center runtime invalid: ${JSON.stringify(finalState)}`);
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    fabFloor: { realMovement: true, start: fabStart, lotRelease: true, engineeringFocus: true, maintenanceKit: true, completedLot: true, desktopMobile: true, pauseResume: true },
    dataCenterArchitect: { sevenRackTopology: true, adjacencyReady: true, liveWorkload: true, desktopMobile: true, pauseResume: true },
    boundedMobileCamera: true,
  }));
} finally {
  await close();
}
