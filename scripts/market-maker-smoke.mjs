import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.MARKET_MAKER_URL ?? "http://127.0.0.1:3000/games/market-maker";
const artifactDir = process.env.MARKET_MAKER_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9228";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await mkdir(artifactDir, { recursive: true });

const response = await fetch(targetUrl);
if (!response.ok) throw new Error(`Market Maker route returned ${response.status}`);
const html = await response.text();
if (!html.includes("Market Maker")) throw new Error("Market Maker title missing");
if (!html.includes("Bid-ask spread")) throw new Error("Market Maker learning content missing");

async function waitForValue(fn, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Market Maker browser state");
}

let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
  const found = spawnSync("which", [candidate], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) { chromePath = found.stdout.trim(); break; }
}
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

const profileDir = await mkdtemp(path.join(os.tmpdir(), "market-maker-arcade-smoke-"));
const chrome = spawn(chromePath, ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars", "--window-size=1280,960", "--remote-debugging-port=9228", `--user-data-dir=${profileDir}`, targetUrl], { stdio: "ignore" });
let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const result = await fetch(`${debugBase}/json/list`); if (!result.ok) return null;
    return (await result.json()).find((entry) => entry.type === "page" && entry.url.includes("/games/market-maker"));
  });
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening Market Maker CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Market Maker CDP websocket")); }, { once: true });
  });

  let sequence = 0; const pending = new Map(); const runtimeErrors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const item = pending.get(message.id); pending.delete(message.id); if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result ?? {}); return; }
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params?.exceptionDetails?.text ?? "Runtime exception");
  });
  function send(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }); }
  async function evaluate(expression) { const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed"); return result.result?.value; }
  async function waitForExpression(expression, timeout = 10000) { return waitForValue(() => evaluate(expression), timeout); }
  async function key(type, keyName, code, vk) { await send("Input.dispatchKeyEvent", { type, key: keyName, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }); }
  async function hold(keyName, code, vk, expression, timeout = 4000) { await key("keyDown", keyName, code, vk); try { await waitForExpression(expression, timeout); } finally { await key("keyUp", keyName, code, vk); } }
  async function tap(keyName, code, vk) { await key("keyDown", keyName, code, vk); await key("keyUp", keyName, code, vk); }
  async function clickToolbar(text) {
    const point = await waitForValue(() => evaluate(`(() => { const shell = document.querySelector('section[aria-label="Market Maker game"]'); const button = Array.from(shell?.querySelectorAll('button') ?? []).find((node) => node.textContent?.trim() === ${JSON.stringify(text)}); if (!button) return null; const r = button.getBoundingClientRect(); return r.width && r.height ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; })()`));
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  }

  await send("Runtime.enable"); await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Market Maker game"] .game-canvas-mount canvas'))`);
  await waitForExpression(`document.querySelector('section[aria-label="Market Maker game"] .game-canvas-mount')?.dataset.marketArcade === 'true'`);
  const mountSelector = `document.querySelector('section[aria-label="Market Maker game"] .game-canvas-mount')`;
  const initialX = await evaluate(`Number(${mountSelector}?.dataset.marketPlayerX ?? '0')`);
  if (initialX < 450 || initialX > 550) throw new Error(`Unexpected Market Maker start X: ${initialX}`);

  await hold("a", "KeyA", 65, `Number(${mountSelector}?.dataset.marketPlayerX ?? '999') < 225`);
  await tap("e", "KeyE", 69);
  await waitForExpression(`Boolean(${mountSelector}?.dataset.marketCarried)`);
  const carriedOrder = await evaluate(`${mountSelector}?.dataset.marketCarried ?? ''`);
  if (!carriedOrder) throw new Error("Dealer did not pick up the client order");

  await hold("w", "KeyW", 87, `Number(${mountSelector}?.dataset.marketPlayerY ?? '999') < 120`);
  await hold("d", "KeyD", 68, `Number(${mountSelector}?.dataset.marketPlayerX ?? '0') > 770`, 6000);
  await hold("s", "KeyS", 83, `Number(${mountSelector}?.dataset.marketPlayerY ?? '0') > 125`);
  await tap("e", "KeyE", 69);
  await waitForExpression(`!${mountSelector}?.dataset.marketCarried && Number(${mountSelector}?.dataset.marketCompleted ?? '0') >= 1`);

  await clickToolbar("Pause");
  await waitForExpression(`document.querySelector('section[aria-label="Market Maker game"] .game-status')?.textContent === 'Paused'`);
  await clickToolbar("Resume");
  await waitForExpression(`document.querySelector('section[aria-label="Market Maker game"] .game-status')?.textContent?.includes('resumed')`);

  const desktopShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifactDir, "market-maker-arcade-desktop.png"), Buffer.from(desktopShot.data, "base64"));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(180);
  const mobileShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifactDir, "market-maker-arcade-mobile.png"), Buffer.from(mobileShot.data, "base64"));

  await clickToolbar("Restart");
  await waitForExpression(`Number(${mountSelector}?.dataset.marketCompleted ?? '-1') === 0 && Number(${mountSelector}?.dataset.marketPlayerX ?? '0') > 450`);
  const finalState = await evaluate(`(() => { const mount = ${mountSelector}; return { arcade: mount?.dataset.marketArcade, completed: mount?.dataset.marketCompleted, frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error') }; })()`);
  if (finalState.arcade !== "true" || finalState.completed !== "0") throw new Error(`Market Maker restart invalid: ${JSON.stringify(finalState)}`);
  if (finalState.frameworkError) throw new Error("Framework error UI detected on Market Maker");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({ targetUrl, spatialMovementVerified: true, clientPickupVerified: true, venueExecutionVerified: true, pauseResumeVerified: true, responsiveCaptures: 2, restartVerified: true }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) { chrome.kill("SIGTERM"); await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]); }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
