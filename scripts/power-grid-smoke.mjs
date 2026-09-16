import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.POWER_GRID_URL ?? "http://127.0.0.1:3006/games/power-grid-dispatcher";
const artifactDir = process.env.POWER_GRID_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9234";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(artifactDir, { recursive: true });

async function waitForValue(fn, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Power Grid Dispatcher browser state");
}

let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
  const found = spawnSync("which", [candidate], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) { chromePath = found.stdout.trim(); break; }
}
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

const profileDir = await mkdtemp(path.join(os.tmpdir(), "power-grid-live-"));
const chrome = spawn(chromePath, [
  "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars",
  "--window-size=1280,1000", "--remote-debugging-port=9234", `--user-data-dir=${profileDir}`, targetUrl,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const response = await fetch(`${debugBase}/json/list`);
    if (!response.ok) return null;
    return (await response.json()).find((entry) => entry.type === "page" && entry.url.includes("/games/power-grid-dispatcher"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening Power Grid CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Power Grid CDP websocket")); }, { once: true });
  });

  let sequence = 0;
  const pending = new Map();
  const runtimeErrors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result ?? {});
      return;
    }
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params?.exceptionDetails?.text ?? "Runtime exception");
  });

  function send(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? "Runtime.evaluate failed");
    return response.result?.value;
  }

  async function waitForExpression(expression, timeout = 10000) { return waitForValue(() => evaluate(expression), timeout); }

  async function clickButton(label) {
    const point = await waitForValue(() => evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}) || node.getAttribute('aria-label') === ${JSON.stringify(label)});
      if (!button) return null;
      button.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = button.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return { x: rect.left + rect.width / 2, y: rect.top + Math.min(rect.height / 2, 28) };
    })()`));
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  }

  async function capture(name) {
    await evaluate(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.scrollIntoView({ block: 'start' }); true`);
    await sleep(100);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(path.join(artifactDir, name), Buffer.from(shot.data, "base64"));
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]'))`);
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridTick === '0'`);
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((node) => node.textContent?.includes('Start dispatch'))`);
  await evaluate(`localStorage.removeItem('bgn:power-grid-dispatcher:best-score'); true`);

  const initial = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]');
    return { thermal: Number(section?.dataset.gridThermal), storage: Number(section?.dataset.gridStorage), event: section?.dataset.gridEvent };
  })()`);
  if (initial.thermal !== 50 || initial.storage !== 58 || initial.event !== "morning-ramp") throw new Error(`Unexpected initial live-grid state: ${JSON.stringify(initial)}`);

  await clickButton("Start dispatch");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridRunning === 'true'`);
  await waitForExpression(`Number(document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridTick ?? '0') >= 2`, 7000);

  await clickButton("Thermal up");
  await clickButton("Thermal up");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridThermal === '60'`);

  await clickButton("Discharge");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridBattery === 'discharge'`);
  await clickButton("Enable demand response");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridDr === 'true'`);
  await waitForExpression(`Number(document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridStorage ?? '58') < 58`, 5000);

  await waitForExpression(`Number(document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridTick ?? '0') >= 5`, 7000);
  await clickButton("Pause dispatch");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridRunning === 'false'`);
  const pausedTick = await evaluate(`Number(document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridTick ?? '-1')`);
  await sleep(1200);
  const frozenTick = await evaluate(`Number(document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridTick ?? '-1')`);
  if (pausedTick !== frozenTick) throw new Error(`Grid advanced while paused: ${pausedTick} -> ${frozenTick}`);

  await clickButton("Idle");
  await clickButton("Resume dispatch");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridRunning === 'true'`);
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridEvent === 'wind-drop'`, 9000);

  for (let index = 0; index < 4; index += 1) await clickButton("Thermal up");
  await waitForExpression(`Number(document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridThermal ?? '0') >= 80`);
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridComplete === 'true'`, 30000);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Power Grid Dispatcher result"]'))`);
  await waitForExpression(`Boolean(localStorage.getItem('bgn:power-grid-dispatcher:best-score'))`);

  const finalState = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]');
    const result = document.querySelector('[aria-label="Power Grid Dispatcher result"]');
    return {
      tick: section?.dataset.gridTick ?? null,
      complete: section?.dataset.gridComplete ?? null,
      running: section?.dataset.gridRunning ?? null,
      event: section?.dataset.gridEvent ?? null,
      resultText: result?.textContent ?? '',
      bestStorage: localStorage.getItem('bgn:power-grid-dispatcher:best-score'),
      frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
    };
  })()`);

  if (finalState.tick !== "32" || finalState.complete !== "true" || finalState.running !== "false") throw new Error(`Power Grid completion state invalid: ${JSON.stringify(finalState)}`);
  if (finalState.event !== "transmission-outage") throw new Error(`Power Grid never reached transmission-outage regime: ${finalState.event}`);
  for (const label of ["Final score", "energy not served", "storage left", "avg cost index"]) {
    if (!finalState.resultText.toLowerCase().includes(label.toLowerCase())) throw new Error(`Power Grid result missing ${label}`);
  }
  if (!finalState.bestStorage) throw new Error("Power Grid best score was not persisted");
  if (finalState.frameworkError) throw new Error("Framework error UI detected during Power Grid smoke test");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  await capture("power-grid-result-desktop.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await capture("power-grid-result-mobile.png");
  await send("Emulation.clearDeviceMetricsOverride");

  await clickButton("Run another grid");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridTick === '0'`);
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridComplete === 'false'`);
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridThermal === '50'`);

  console.log(JSON.stringify({ targetUrl, continuousDispatchVerified: true, controlChangesVerified: true, pauseVerified: true, eventRegimesVerified: true, bestPersisted: true, resultCaptures: 2, restartVerified: true }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
