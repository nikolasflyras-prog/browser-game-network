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
  await waitForExpression(`document.querySelector('[data-fab-node]')?.dataset.fabNode === '28nm-planar'`, 7000, "Fab Floor mature-node campaign");
  await waitForExpression(`Boolean(document.querySelector('[data-fab-contract]')?.dataset.fabContract)`, 7000, "Fab Floor customer contract");

  const initialContract = await browser.evaluate(`document.querySelector('[data-fab-contract]')?.dataset.fabContract ?? null`);
  const fabStart = await browser.position("fab");

  // Start real WIP physically from FOUP release.
  await moveTo("fab", 120, 370, { order: "yx", tolerance: 17, maxPasses: 6 });
  await pressE();
  await waitForExpression(`Number(document.querySelector('[data-fab-lots]')?.dataset.fabLots ?? '0') >= 1`, 7000, "release first wafer lot");

  // Use the open aisle beneath the process tools. Going straight across at y≈380 clips the
  // lithography tool's collision radius; this route mirrors how a player actually navigates the fab.
  await moveTo("fab", 745, 425, { order: "yx", tolerance: 18, maxPasses: 6, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-fab-focus]')?.dataset.fabFocus === 'etch'`, 7000, "assign etch focus");

  // Convert a diagnosed bottleneck into structural capacity by buying CapEx for the focused etch group.
  await moveTo("fab", 185, 425, { order: "xy", tolerance: 18, maxPasses: 6, fast: true });
  await moveTo("fab", 125, 120, { order: "xy", tolerance: 18, maxPasses: 6, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-fab-upgrade-etch]')?.dataset.fabUpgradeEtch === '1'`, 7000, "buy etch CapEx upgrade");

  // Cross the lower service aisle, then approach Operations from the right side so the player
  // does not clip the metrology tool while hiring an equipment technician.
  await moveTo("fab", 185, 425, { order: "yx", tolerance: 18, maxPasses: 6, fast: true });
  await moveTo("fab", 1130, 425, { order: "xy", tolerance: 18, maxPasses: 7, fast: true });
  await moveTo("fab", 1130, 120, { order: "yx", tolerance: 18, maxPasses: 6, fast: true });
  await moveTo("fab", 1090, 120, { order: "xy", tolerance: 18, maxPasses: 5, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-fab-technicians]')?.dataset.fabTechnicians === '1'`, 7000, "hire equipment technician");

  // Release the second lot required by the first customer qualification order.
  await moveTo("fab", 1130, 425, { order: "yx", tolerance: 18, maxPasses: 6, fast: true });
  await moveTo("fab", 185, 425, { order: "xy", tolerance: 18, maxPasses: 7, fast: true });
  await moveTo("fab", 120, 370, { order: "yx", tolerance: 17, maxPasses: 5, fast: true });
  await pressE();
  await waitForExpression(`Number(document.querySelector('[data-fab-completed]')?.dataset.fabCompleted ?? '0') + Number(document.querySelector('[data-fab-lots]')?.dataset.fabLots ?? '0') >= 2`, 7000, "release second wafer lot");

  // Keep a maintenance kit on hand while the order runs. The customer deadline continues even
  // while equipment is down, so this proves the original physical-maintenance loop still exists.
  await moveTo("fab", 1080, 620, { order: "xy", tolerance: 18, maxPasses: 7, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-fab-kit]')?.dataset.fabKit === 'true'`, 7000, "pick maintenance kit");

  await waitForExpression(`Number(document.querySelector('[data-fab-completed]')?.dataset.fabCompleted ?? '0') >= 2`, 26000, "two wafer lots clear fab line");
  await waitForExpression(`Number(document.querySelector('[data-fab-contracts-won]')?.dataset.fabContractsWon ?? '0') >= 1`, 10000, "win first customer contract");
  await waitForExpression(`document.querySelector('[data-fab-contract]')?.dataset.fabContract !== ${JSON.stringify(initialContract)}`, 7000, "advance to next customer contract");

  await captureScreenshot(path.join(artifactDir, "fab-floor-desktop.png"));
  await setMobile();
  await captureScreenshot(path.join(artifactDir, "fab-floor-mobile.png"));
  await clearMobile();

  await clickButton("Pause");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`, 6000, "Fab Floor pause");
  await clickButton("Resume");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`, 6000, "Fab Floor resume");

  const fabBusinessState = await browser.evaluate(`(() => ({
    node: document.querySelector('[data-fab-node]')?.dataset.fabNode ?? null,
    contractsWon: Number(document.querySelector('[data-fab-contracts-won]')?.dataset.fabContractsWon ?? '0'),
    technicians: Number(document.querySelector('[data-fab-technicians]')?.dataset.fabTechnicians ?? '0'),
    etchUpgrade: Number(document.querySelector('[data-fab-upgrade-etch]')?.dataset.fabUpgradeEtch ?? '0'),
    completed: Number(document.querySelector('[data-fab-completed]')?.dataset.fabCompleted ?? '0')
  }))()`);
  if (fabBusinessState.contractsWon < 1 || fabBusinessState.technicians < 1 || fabBusinessState.etchUpgrade < 1 || fabBusinessState.completed < 2) {
    throw new Error(`Fab Floor business loop incomplete: ${JSON.stringify(fabBusinessState)}`);
  }

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
    fabFloor: {
      realMovement: true,
      start: fabStart,
      twoLotRelease: true,
      engineeringFocus: true,
      capexUpgrade: true,
      equipmentTechnician: true,
      customerContractWon: true,
      maintenanceKit: true,
      completedLots: true,
      node: fabBusinessState.node,
      desktopMobile: true,
      pauseResume: true,
    },
    dataCenterArchitect: { sevenRackTopology: true, adjacencyReady: true, liveWorkload: true, desktopMobile: true, pauseResume: true },
    boundedMobileCamera: true,
  }));
} finally {
  await close();
}
