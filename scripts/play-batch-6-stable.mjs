import { openSpatialBrowser, sleep } from "./spatial-cdp.mjs";

const baseUrl = process.env.PLAY_BATCH_6_BASE_URL ?? "http://127.0.0.1:3011";

async function hold(browser, key, code, ms) {
  const virtualKeys = { ArrowLeft: 37, ArrowRight: 39, " ": 32 };
  await browser.send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: virtualKeys[key] ?? 0 });
  await sleep(ms);
  await browser.send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: virtualKeys[key] ?? 0 });
  await sleep(140);
}

async function exercise({ slug, title, port, kind }) {
  const browser = await openSpatialBrowser({ url: `${baseUrl}/games/${slug}`, port, profilePrefix: `play-batch6-${slug}` });
  const sectionSelector = `section[aria-label="${title} game"]`;
  const mountSelector = `${sectionSelector} .game-canvas-mount`;
  try {
    await browser.waitForExpression(`Boolean(document.querySelector(${JSON.stringify(`${sectionSelector} canvas`)}))`, 16000, `${title} canvas`);
    const dataName = kind === "courier" ? "courierX" : "magnetX";
    const dataAttr = kind === "courier" ? "data-courier-x" : "data-magnet-x";
    await browser.waitForExpression(`document.querySelector(${JSON.stringify(mountSelector)})?.hasAttribute(${JSON.stringify(dataAttr)}) === true`, 16000, `${title} runtime state`);

    const initialX = Number(await browser.evaluate(`document.querySelector(${JSON.stringify(mountSelector)})?.dataset.${dataName} ?? '0'`));
    const initialEnergy = kind === "magnet"
      ? Number(await browser.evaluate(`document.querySelector(${JSON.stringify(mountSelector)})?.dataset.magnetEnergy ?? '0'`))
      : null;

    if (kind === "magnet") {
      await browser.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
      await browser.send("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
      await sleep(650);
      await browser.send("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
      await browser.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
      await sleep(160);
    } else {
      await hold(browser, "ArrowRight", "ArrowRight", 650);
    }

    await browser.waitForExpression(`Number(document.querySelector(${JSON.stringify(mountSelector)})?.dataset.${dataName} ?? '0') > ${initialX + 10}`, 8000, `${title} real movement`);
    if (kind === "magnet") {
      await browser.waitForExpression(`Number(document.querySelector(${JSON.stringify(mountSelector)})?.dataset.magnetEnergy ?? '100') < ${initialEnergy - 2}`, 8000, "Magnet Field energy drain");
    }

    await browser.clickButton("Pause");
    await browser.waitForExpression(`Array.from(document.querySelectorAll(${JSON.stringify(`${sectionSelector} button`)})).some((button) => button.textContent?.trim() === 'Resume')`, 6000, `${title} Resume control`);
    const pausedX = Number(await browser.evaluate(`document.querySelector(${JSON.stringify(mountSelector)})?.dataset.${dataName} ?? '0'`));
    await hold(browser, "ArrowLeft", "ArrowLeft", 420);
    const pausedAfterInputX = Number(await browser.evaluate(`document.querySelector(${JSON.stringify(mountSelector)})?.dataset.${dataName} ?? '0'`));
    if (Math.abs(pausedAfterInputX - pausedX) > 1.5) {
      throw new Error(`${title} moved while paused: ${JSON.stringify({ pausedX, pausedAfterInputX })}`);
    }

    await browser.clickButton("Resume");
    await browser.waitForExpression(`Array.from(document.querySelectorAll(${JSON.stringify(`${sectionSelector} button`)})).some((button) => button.textContent?.trim() === 'Pause')`, 6000, `${title} Pause control after resume`);
    await hold(browser, "ArrowLeft", "ArrowLeft", 360);
    await browser.waitForExpression(`Number(document.querySelector(${JSON.stringify(mountSelector)})?.dataset.${dataName} ?? '0') < ${pausedX - 4}`, 6000, `${title} movement after resume`);

    await browser.clickButton("Restart");
    if (kind === "courier") {
      await browser.waitForExpression(`document.querySelector(${JSON.stringify(mountSelector)})?.dataset.courierPhase === 'delivery'`, 7000, "Courier Loop restart state");
    } else {
      await browser.waitForExpression(`Number(document.querySelector(${JSON.stringify(mountSelector)})?.dataset.magnetEnergy ?? '0') >= 99`, 7000, "Magnet Field restart energy");
    }

    const finalState = await browser.evaluate(`(() => ({
      canvas: Boolean(document.querySelector(${JSON.stringify(`${sectionSelector} canvas`)})),
      x: Number(document.querySelector(${JSON.stringify(mountSelector)})?.dataset.${dataName} ?? '0'),
      frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error')
    }))()`);
    if (!finalState.canvas || finalState.frameworkError) throw new Error(`${title} browser state invalid: ${JSON.stringify(finalState)}`);
    if (browser.runtimeErrors.length) throw new Error(`${title} runtime errors: ${browser.runtimeErrors.join(" | ")}`);

    return { initialX, pausedX, finalState, realMovement: true, pauseStopsSimulation: true, resumeRestartsSimulation: true };
  } finally {
    await browser.close();
  }
}

const courierLoop = await exercise({ slug: "courier-loop", title: "Courier Loop", port: 9243, kind: "courier" });
const magnetField = await exercise({ slug: "magnet-field", title: "Magnet Field", port: 9244, kind: "magnet" });
console.log(JSON.stringify({ courierLoop, magnetField, realMovementVerified: true, fieldEnergyVerified: true, sharedControlsVerified: true, pausedSimulationVerified: true }));
