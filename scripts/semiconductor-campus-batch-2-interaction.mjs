import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.SEMI_BATCH2_BASE_URL ?? "http://127.0.0.1:3013";
const artifactDir = process.env.SEMI_BATCH2_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9233";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await mkdir(artifactDir, { recursive: true });

async function waitForValue(fn, timeout = 18000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for semiconductor campus batch 2 browser state");
}

let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
  const found = spawnSync("which", [candidate], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) { chromePath = found.stdout.trim(); break; }
}
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

const profileDir = await mkdtemp(path.join(os.tmpdir(), "semiconductor-campus-batch2-"));
const chrome = spawn(chromePath, ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars", "--window-size=1360,980", "--remote-debugging-port=9233", `--user-data-dir=${profileDir}`, `${baseUrl}/games/chip-architect`], { stdio: "ignore" });
let socket;

try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const result = await fetch(`${debugBase}/json/list`); if (!result.ok) return null;
    return (await result.json()).find((entry) => entry.type === "page");
  });
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open CDP websocket")); }, { once: true });
  });

  let sequence = 0; const pending = new Map(); const runtimeErrors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); if (message.error) reject(new Error(message.error.message)); else resolve(message.result ?? {}); return; }
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params?.exceptionDetails?.text ?? "Runtime exception");
  });
  function send(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }); }
  async function evaluate(expression) { const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed"); return result.result?.value; }
  async function waitForExpression(expression, timeout = 14000) { return waitForValue(() => evaluate(expression), timeout); }
  const virtualKeys = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
  async function keyHold(key, ms = 250) { await send("Input.dispatchKeyEvent", { type: "keyDown", code: key, key, windowsVirtualKeyCode: virtualKeys[key] }); await sleep(ms); await send("Input.dispatchKeyEvent", { type: "keyUp", code: key, key, windowsVirtualKeyCode: virtualKeys[key] }); await sleep(75); }
  async function pressE() { await send("Input.dispatchKeyEvent", { type: "keyDown", code: "KeyE", key: "e", windowsVirtualKeyCode: 69 }); await send("Input.dispatchKeyEvent", { type: "keyUp", code: "KeyE", key: "e", windowsVirtualKeyCode: 69 }); await sleep(150); }
  async function clickButton(text) { await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === ${JSON.stringify(text)})`); await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === ${JSON.stringify(text)})?.click(); true`); await sleep(160); }
  async function position(prefix) { return evaluate(`(() => { const n=document.querySelector('[data-${prefix}-x]'); return {x:Number(n?.dataset.${prefix}X ?? '0'), y:Number(n?.dataset.${prefix}Y ?? '0')}; })()`); }
  async function moveAxis(prefix, axis, target, tolerance = 42, maxSteps = 36) {
    let current = await position(prefix);
    for (let i = 0; i < maxSteps; i += 1) {
      const value = axis === "x" ? current.x : current.y;
      if (Math.abs(value - target) <= tolerance) return current;
      const positive = value < target;
      const key = axis === "x" ? (positive ? "ArrowRight" : "ArrowLeft") : (positive ? "ArrowDown" : "ArrowUp");
      await keyHold(key);
      const next = await position(prefix);
      const nextValue = axis === "x" ? next.x : next.y;
      if (Math.abs(nextValue - value) < 1.5) throw new Error(`${prefix} stopped moving on ${axis} toward ${target}: ${JSON.stringify({ current, next })}`);
      current = next;
    }
    throw new Error(`${prefix} failed to reach ${axis}=${target}: ${JSON.stringify(current)}`);
  }
  async function moveXY(prefix, x, y, order = "xy") { if (order === "xy") { await moveAxis(prefix, "x", x); await moveAxis(prefix, "y", y); } else { await moveAxis(prefix, "y", y); await moveAxis(prefix, "x", x); } return position(prefix); }
  async function navigate(url) { await send("Page.navigate", { url }); await waitForExpression(`document.readyState === 'complete'`); await sleep(450); }

  await send("Runtime.enable"); await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Chip Architect game"] canvas'))`);
  await waitForExpression(`Boolean(document.querySelector('[data-arch-x]'))`);

  await moveXY("arch", 105, 245, "xy"); await pressE(); await waitForExpression(`document.querySelector('[data-arch-carried]')?.dataset.archCarried === 'vector-array'`);
  await moveXY("arch", 555, 290, "xy"); await pressE(); await waitForExpression(`document.querySelector('[data-arch-slots]')?.dataset.archSlots === '1'`);
  await moveXY("arch", 245, 245, "xy"); await pressE(); await moveXY("arch", 705, 290, "xy"); await pressE(); await waitForExpression(`document.querySelector('[data-arch-slots]')?.dataset.archSlots === '2'`);
  await moveXY("arch", 105, 520, "yx"); await pressE(); await moveXY("arch", 555, 440, "xy"); await pressE(); await waitForExpression(`document.querySelector('[data-arch-slots]')?.dataset.archSlots === '3'`);
  await moveXY("arch", 245, 615, "xy"); await pressE(); await moveXY("arch", 705, 440, "yx"); await pressE(); await waitForExpression(`document.querySelector('[data-arch-slots]')?.dataset.archSlots === '4'`);
  await moveXY("arch", 945, 245, "xy"); await pressE(); await waitForExpression(`document.querySelector('[data-arch-verified]')?.dataset.archVerified === 'true'`); await waitForExpression(`document.querySelector('[data-arch-ready]')?.dataset.archReady === 'true'`);
  await moveXY("arch", 1090, 350, "xy"); await pressE(); await waitForExpression(`Number(document.querySelector('[data-arch-tapeouts]')?.dataset.archTapeouts ?? '0') >= 1`);
  await clickButton("Pause"); await waitForExpression(`document.querySelector('.game-status')?.textContent?.trim() === 'Paused'`); await clickButton("Resume");
  const architectShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); await writeFile(path.join(artifactDir, "chip-architect-desktop.png"), Buffer.from(architectShot.data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await sleep(450);
  const architectMobile = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); await writeFile(path.join(artifactDir, "chip-architect-mobile.png"), Buffer.from(architectMobile.data, "base64"));

  await send("Emulation.clearDeviceMetricsOverride"); await navigate(`${baseUrl}/games/packaging-lab`); await waitForExpression(`Boolean(document.querySelector('[aria-label="Packaging Lab game"] canvas'))`); await waitForExpression(`Boolean(document.querySelector('[data-pkg-x]'))`);
  async function packagePlace(componentX, componentY, componentId, slotX, slotY, expectedSlots) {
    await moveXY("pkg", 320, 350, "yx"); await moveXY("pkg", componentX, componentY, "xy"); await pressE(); await waitForExpression(`document.querySelector('[data-pkg-carried]')?.dataset.pkgCarried === ${JSON.stringify(componentId)}`);
    await moveXY("pkg", 320, 350, "yx"); await moveXY("pkg", slotX, slotY, "xy"); await pressE(); await waitForExpression(`document.querySelector('[data-pkg-slots]')?.dataset.pkgSlots === ${JSON.stringify(String(expectedSlots))}`);
  }
  await packagePlace(105, 150, "xpu-hot", 520, 285, 1);
  await packagePlace(105, 555, "hbm4", 650, 285, 2);
  await packagePlace(255, 455, "optical-engine", 780, 285, 3);
  await packagePlace(255, 555, "heat-spreader", 520, 425, 4);
  await packagePlace(105, 250, "xpu-efficient", 650, 425, 5);
  await packagePlace(105, 455, "hbm3e", 780, 425, 6);
  await waitForExpression(`document.querySelector('[data-pkg-meets-spec]')?.dataset.pkgMeetsSpec === 'true'`);
  await moveXY("pkg", 955, 245, "xy"); await pressE(); await waitForExpression(`document.querySelector('[data-pkg-pending]')?.dataset.pkgPending === 'true'`); await waitForExpression(`document.querySelector('[data-pkg-pass]')?.dataset.pkgPass === 'true'`, 12000);
  await moveXY("pkg", 1090, 350, "xy"); await pressE(); await waitForExpression(`Number(document.querySelector('[data-pkg-shipped]')?.dataset.pkgShipped ?? '0') >= 1`);
  await clickButton("Pause"); await waitForExpression(`document.querySelector('.game-status')?.textContent?.trim() === 'Paused'`); await clickButton("Resume");
  const packageShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); await writeFile(path.join(artifactDir, "packaging-lab-desktop.png"), Buffer.from(packageShot.data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await sleep(450);
  const packageMobile = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }); await writeFile(path.join(artifactDir, "packaging-lab-mobile.png"), Buffer.from(packageMobile.data, "base64"));

  const finalState = await evaluate(`(() => ({ canvas:Boolean(document.querySelector('canvas')), frameworkError:Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error') }))()`);
  if (!finalState.canvas || finalState.frameworkError) throw new Error(`Final packaging runtime invalid: ${JSON.stringify(finalState)}`);
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);
  console.log(JSON.stringify({ chipArchitect: { fullFloorplan: true, verification: true, tapeout: true, pauseResume: true, desktopMobile: true }, packagingLab: { sixSitePackage: true, adjacencySpec: true, inspection: true, shipment: true, pauseResume: true, desktopMobile: true } }));
} finally {
  socket?.close(); if (chrome.exitCode === null) { chrome.kill("SIGTERM"); await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]); }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
