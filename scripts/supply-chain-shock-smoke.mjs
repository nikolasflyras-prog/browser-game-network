import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.SUPPLY_CHAIN_URL ?? "http://127.0.0.1:3004/games/supply-chain-shock";
const artifactDir = process.env.SUPPLY_CHAIN_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9232";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await mkdir(artifactDir, { recursive: true });

async function waitForValue(fn, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Supply Chain Shock browser state");
}

let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
  const found = spawnSync("which", [candidate], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) {
    chromePath = found.stdout.trim();
    break;
  }
}
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

const profileDir = await mkdtemp(path.join(os.tmpdir(), "supply-chain-live-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,1000",
  "--remote-debugging-port=9232",
  `--user-data-dir=${profileDir}`,
  targetUrl,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const response = await fetch(`${debugBase}/json/list`);
    if (!response.ok) return null;
    return (await response.json()).find((entry) => entry.type === "page" && entry.url.includes("/games/supply-chain-shock"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening Supply Chain Shock CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Supply Chain Shock CDP websocket")); }, { once: true });
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

  async function waitForExpression(expression, timeout = 10000) {
    return waitForValue(() => evaluate(expression), timeout);
  }

  async function clickButton(label) {
    const found = await waitForValue(() => evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Supply Chain Shock simulation"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}));
      if (!button) return false;
      button.scrollIntoView({ block: 'center', inline: 'center' });
      return true;
    })()`));
    if (!found) throw new Error(`Supply Chain button not found: ${label}`);

    await sleep(140);

    const point = await waitForValue(() => evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Supply Chain Shock simulation"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}));
      if (!button) return null;
      const rect = button.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      if (!hit || !(hit === button || button.contains(hit))) return null;
      return { x, y };
    })()`));

    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await sleep(100);
  }

  async function capture(name) {
    await evaluate(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.scrollIntoView({ block: 'start' }); true`);
    await sleep(100);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(path.join(artifactDir, name), Buffer.from(shot.data, "base64"));
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Supply Chain Shock simulation"]'))`);
  await evaluate(`document.documentElement.style.scrollBehavior = 'auto'; document.body.style.scrollBehavior = 'auto'; true`);
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyTick === '0'`);
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((node) => node.textContent?.includes('Start network'))`);
  await evaluate(`localStorage.removeItem('bgn:supply-chain-shock:best-score'); true`);

  await clickButton("Buffer");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyOrder === 'buffer'`);
  await clickButton("Split");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplySource === 'split'`);
  await clickButton("Mixed");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyFreight === 'mixed'`);

  await clickButton("Start network");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyRunning === 'true'`);
  await waitForExpression(`Number(document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyTick ?? '0') >= 2`, 6000);
  await waitForExpression(`Number(document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyTransit ?? '0') > 0`);

  await waitForExpression(`Number(document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyTick ?? '0') >= 5`, 6000);
  await clickButton("Pause network");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyRunning === 'false'`);
  const pausedTick = await evaluate(`Number(document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyTick ?? '-1')`);
  await sleep(1200);
  const frozenTick = await evaluate(`Number(document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyTick ?? '-1')`);
  if (pausedTick !== frozenTick) throw new Error(`Supply Chain advanced while paused: ${pausedTick} -> ${frozenTick}`);
  await clickButton("Resume network");

  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyEvent === 'port-delay'`, 8000);
  await clickButton("Air");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyFreight === 'air'`);
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyEvent === 'demand-spike'`, 9000);
  await clickButton("Mixed");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyFreight === 'mixed'`);
  await clickButton("Buffer");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyOrder === 'buffer'`);
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyEvent === 'supplier-failure'`, 9000);
  await clickButton("Backup");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplySource === 'backup'`);

  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyComplete === 'true'`, 15000);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Supply Chain Shock result"]'))`);
  await waitForExpression(`Boolean(localStorage.getItem('bgn:supply-chain-shock:best-score'))`);

  const finalState = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Supply Chain Shock simulation"]');
    const result = document.querySelector('[aria-label="Supply Chain Shock result"]');
    return {
      tick: section?.dataset.supplyTick ?? null,
      complete: section?.dataset.supplyComplete ?? null,
      running: section?.dataset.supplyRunning ?? null,
      resultText: result?.textContent ?? '',
      frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
    };
  })()`);

  if (finalState.tick !== "32" || finalState.complete !== "true" || finalState.running !== "false") throw new Error(`Supply Chain completion state invalid: ${JSON.stringify(finalState)}`);
  for (const label of ["Final score", "service", "ending inventory", "backlog", "expedite spend"]) {
    if (!finalState.resultText.toLowerCase().includes(label.toLowerCase())) throw new Error(`Supply Chain result missing ${label}`);
  }
  if (finalState.frameworkError) throw new Error("Framework error UI detected during Supply Chain Shock smoke test");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  await capture("supply-chain-result-desktop.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await capture("supply-chain-result-mobile.png");
  await send("Emulation.clearDeviceMetricsOverride");

  await clickButton("Run another network");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyTick === '0'`);
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyOrder === 'steady'`);
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyComplete === 'false'`);

  console.log(JSON.stringify({
    targetUrl,
    pipelineVerified: true,
    leadTimeControlsVerified: true,
    disruptionRegimesVerified: true,
    pauseVerified: true,
    bestPersisted: true,
    resultCaptures: 2,
    restartVerified: true,
  }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
