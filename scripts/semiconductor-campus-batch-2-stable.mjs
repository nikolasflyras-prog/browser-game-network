import path from "node:path";
import { openSpatialBrowser } from "./spatial-cdp.mjs";

const baseUrl = process.env.SEMI_BATCH2_BASE_URL ?? "http://127.0.0.1:3013";
const artifactDir = process.env.SEMI_BATCH2_ARTIFACT_DIR ?? "artifacts/browser";
const browser = await openSpatialBrowser({ url: `${baseUrl}/games/chip-architect`, port: 9233, profilePrefix: "semiconductor-campus-batch2-stable" });
const { waitForExpression, moveTo, pressE, clickButton, navigate, captureScreenshot, setMobile, clearMobile, runtimeErrors, close } = browser;

async function placeArchitectBlock(componentX, componentY, componentId, slotX, slotY, expectedSlots, orderToComponent = "xy", orderToSlot = "xy") {
  await moveTo("arch", componentX, componentY, { order: orderToComponent, tolerance: 15, maxPasses: 6 });
  await pressE();
  await waitForExpression(`document.querySelector('[data-arch-carried]')?.dataset.archCarried === ${JSON.stringify(componentId)}`, 9000, `pick up ${componentId}`);
  await moveTo("arch", slotX, slotY, { order: orderToSlot, tolerance: 15, maxPasses: 6 });
  await pressE();
  await waitForExpression(`document.querySelector('[data-arch-slots]')?.dataset.archSlots === ${JSON.stringify(String(expectedSlots))}`, 9000, `place ${componentId}`);
  await waitForExpression(`document.querySelector('[data-arch-carried]')?.dataset.archCarried === ''`, 9000, `release ${componentId}`);
}

async function packageComponent(componentX, componentY, componentId, slotX, slotY, expectedSlots, { viaCenter = false, pickupOrder = "xy", slotOrder = "xy" } = {}) {
  if (viaCenter) await moveTo("pkg", 320, 350, { order: "yx", tolerance: 18, maxPasses: 5, fast: true });
  await moveTo("pkg", componentX, componentY, { order: pickupOrder, tolerance: 16, maxPasses: 5, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-pkg-carried]')?.dataset.pkgCarried === ${JSON.stringify(componentId)}`, 6000, `pick up ${componentId}`);
  if (viaCenter) await moveTo("pkg", 320, 350, { order: "yx", tolerance: 18, maxPasses: 5, fast: true });
  await moveTo("pkg", slotX, slotY, { order: slotOrder, tolerance: 16, maxPasses: 5, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-pkg-slots]')?.dataset.pkgSlots === ${JSON.stringify(String(expectedSlots))}`, 6000, `place ${componentId}`);
  await waitForExpression(`document.querySelector('[data-pkg-carried]')?.dataset.pkgCarried === ''`, 6000, `release ${componentId}`);
}

try {
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Chip Architect game"] canvas'))`, 16000, "Chip Architect canvas");
  await waitForExpression(`Boolean(document.querySelector('[data-arch-x]'))`, 16000, "Chip Architect player state");
  await waitForExpression(`document.querySelector('[data-arch-mode]')?.dataset.archMode === 'playing'`, 12000, "Chip Architect playing state");

  await placeArchitectBlock(105, 245, "vector-array", 555, 290, 1, "xy", "xy");
  await placeArchitectBlock(245, 245, "banked-sram", 705, 290, 2, "xy", "xy");
  await placeArchitectBlock(105, 520, "mesh-noc", 555, 440, 3, "yx", "xy");
  await placeArchitectBlock(245, 615, "serdes-112", 705, 440, 4, "xy", "yx");

  await moveTo("arch", 945, 245, { order: "xy", tolerance: 15, maxPasses: 6 });
  await pressE();
  await waitForExpression(`document.querySelector('[data-arch-verified]')?.dataset.archVerified === 'true'`, 9000, "Chip Architect verification");
  await waitForExpression(`document.querySelector('[data-arch-ready]')?.dataset.archReady === 'true'`, 9000, "Chip Architect PPA readiness");

  await moveTo("arch", 1090, 350, { order: "xy", tolerance: 15, maxPasses: 6 });
  await pressE();
  await waitForExpression(`Number(document.querySelector('[data-arch-tapeouts]')?.dataset.archTapeouts ?? '0') >= 1`, 9000, "Chip Architect tapeout");

  await clickButton("Pause");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`, 6000, "Chip Architect pause control");
  await clickButton("Resume");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`, 6000, "Chip Architect resume control");
  await waitForExpression(`document.querySelector('[data-arch-mode]')?.dataset.archMode === 'playing'`, 6000, "Chip Architect running state");

  await captureScreenshot(path.join(artifactDir, "chip-architect-desktop.png"));
  await setMobile();
  await captureScreenshot(path.join(artifactDir, "chip-architect-mobile.png"));
  await clearMobile();

  await navigate(`${baseUrl}/games/packaging-lab`);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Packaging Lab game"] canvas'))`, 16000, "Packaging Lab canvas");
  await waitForExpression(`Boolean(document.querySelector('[data-pkg-x]'))`, 16000, "Packaging Lab player state");
  await waitForExpression(`document.querySelector('[data-pkg-mode]')?.dataset.pkgMode === 'playing'`, 12000, "Packaging Lab playing state");

  // The first customer window is intentionally 88 seconds. Use long real key holds in open corridors,
  // then let the spatial helper tighten the final approach. This proves the package can be built under
  // the actual game deadline instead of extending or pausing the clock for QA.
  await packageComponent(105, 150, "xpu-hot", 520, 285, 1, { viaCenter: true });
  await packageComponent(105, 555, "hbm4", 650, 285, 2, { viaCenter: true });
  await packageComponent(255, 455, "optical-engine", 780, 285, 3);
  await packageComponent(255, 555, "heat-spreader", 520, 425, 4, { viaCenter: true });
  await packageComponent(105, 250, "xpu-efficient", 650, 425, 5);
  await packageComponent(105, 455, "hbm3e", 780, 425, 6);
  await waitForExpression(`document.querySelector('[data-pkg-meets-spec]')?.dataset.pkgMeetsSpec === 'true'`, 7000, "Packaging Lab specification compliance");

  await moveTo("pkg", 955, 245, { order: "xy", tolerance: 16, maxPasses: 5, fast: true });
  await pressE();
  await waitForExpression(`document.querySelector('[data-pkg-pending]')?.dataset.pkgPending === 'true'`, 6000, "Packaging Lab inspection start");
  await waitForExpression(`document.querySelector('[data-pkg-pass]')?.dataset.pkgPass === 'true'`, 14000, "Packaging Lab inspection pass");

  await captureScreenshot(path.join(artifactDir, "packaging-lab-desktop.png"));
  await setMobile();
  await captureScreenshot(path.join(artifactDir, "packaging-lab-mobile.png"));
  await clearMobile();

  await moveTo("pkg", 1090, 350, { order: "xy", tolerance: 16, maxPasses: 5, fast: true });
  await pressE();
  await waitForExpression(`Number(document.querySelector('[data-pkg-shipped]')?.dataset.pkgShipped ?? '0') >= 1`, 7000, "Packaging Lab shipment");

  await clickButton("Pause");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`, 6000, "Packaging Lab pause control");
  await clickButton("Resume");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause')`, 6000, "Packaging Lab resume control");
  await waitForExpression(`document.querySelector('[data-pkg-mode]')?.dataset.pkgMode === 'playing'`, 6000, "Packaging Lab running state");

  const finalState = await browser.evaluate(`(() => ({ canvas:Boolean(document.querySelector('[aria-label="Packaging Lab game"] canvas')), frameworkError:Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error') }))()`);
  if (!finalState.canvas || finalState.frameworkError) throw new Error(`Final Packaging Lab runtime invalid: ${JSON.stringify(finalState)}`);
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    chipArchitect: { fullFloorplan: true, verification: true, tapeout: true, pauseResume: true, desktopMobile: true },
    packagingLab: { sixSitePackage: true, adjacencySpec: true, inspection: true, shipment: true, pauseResume: true, desktopMobile: true, completedInsideLiveJobWindow: true },
    preciseMovementHarness: true,
  }));
} finally {
  await close();
}
