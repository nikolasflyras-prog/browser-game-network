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
  if (found.status === 0 && found.stdout.trim()) {
    chromePath = found.stdout.trim();
    break;
  }
}
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

const profileDir = await mkdtemp(path.join(os.tmpdir(), "power-grid-public-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,1000",
  "--remote-debugging-port=9234",
  `--user-data-dir=${profileDir}`,
  targetUrl,
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

  async function waitForExpression(expression, timeout = 8000) {
    return waitForValue(() => evaluate(expression), timeout);
  }

  async function buttonPoint(label) {
    return evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}));
      if (!button) return null;
      button.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = button.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + Math.min(rect.height / 2, 28),
        ariaDisabled: button.getAttribute('aria-disabled'),
        text: button.textContent ?? '',
      };
    })()`);
  }

  async function realClick(label, expectAdvance = true) {
    const beforeStep = await evaluate(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.getAttribute('data-grid-step')`);
    const point = await waitForValue(() => buttonPoint(label));
    if (expectAdvance && point.ariaDisabled === "true") throw new Error(`Power Grid control unexpectedly disabled: ${label}`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
    if (expectAdvance) {
      await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.getAttribute('data-grid-step') !== ${JSON.stringify(beforeStep)}`);
    } else {
      await sleep(150);
    }
  }

  async function readSignal(name) {
    return evaluate(`(() => {
      const node = document.querySelector('[data-grid-signal=${JSON.stringify(name)}]');
      return { state: node?.getAttribute('data-state') ?? null, text: node?.textContent ?? '' };
    })()`);
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
  await waitForExpression(`(() => {
    const section = document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Discharge batteries'));
    return Boolean(button && Object.keys(button).some((key) => key.startsWith('__reactProps$') || key.startsWith('__reactFiber$')));
  })()`);
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridStep === '0'`);
  await evaluate(`localStorage.removeItem('bgn:power-grid-dispatcher:best-score'); true`);

  const initialStorage = await readSignal("storage");
  if (initialStorage.state !== "controlled" || !initialStorage.text.includes("FLEXIBLE") || !initialStorage.text.includes("Wind ✓") || !initialStorage.text.includes("Heatwave ✓")) {
    throw new Error(`Unexpected initial storage flexibility: ${JSON.stringify(initialStorage)}`);
  }

  await realClick("Discharge batteries");
  await realClick("Use storage");
  const depleted = await readSignal("storage");
  if (depleted.state !== "high" || !depleted.text.includes("DEPLETED") || !depleted.text.includes("Wind ×") || !depleted.text.includes("Heatwave ×")) {
    throw new Error(`Early storage use did not surface depleted flexibility: ${JSON.stringify(depleted)}`);
  }
  const depletedContext = await evaluate(`document.querySelector('[data-grid-context]')?.textContent ?? ''`);
  if (!depletedContext.includes("depleted the flexibility needed for the mixed heatwave response")) {
    throw new Error(`Power Grid depleted-storage lesson missing: ${depletedContext}`);
  }
  const blocked = await buttonPoint("Mix storage + demand response");
  if (!blocked || blocked.ariaDisabled !== "true" || !blocked.text.includes("Earlier battery use left too little stored energy")) {
    throw new Error(`Heatwave mixed response should be blocked after storage depletion: ${JSON.stringify(blocked)}`);
  }
  await realClick("Mix storage + demand response", false);
  const blockedNotice = await evaluate(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.textContent ?? ''`);
  if (!blockedNotice.includes("Earlier battery use left too little stored energy")) throw new Error("Unavailable heatwave response did not explain the depleted storage constraint");

  await realClick("Use emergency pricing");
  await realClick("Targeted load reduction");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridComplete === 'true'`);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Power Grid Dispatcher result"]'))`);

  const storedBest = await evaluate(`localStorage.getItem('bgn:power-grid-dispatcher:best-score')`);
  if (!storedBest) throw new Error("Power Grid best score was not persisted");
  const parsedBest = JSON.parse(storedBest);
  if (parsedBest?.version !== 1 || typeof parsedBest?.value !== "number" || parsedBest.value <= 0) throw new Error(`Unexpected Power Grid best-score record: ${storedBest}`);

  await realClick("Run another grid", false);
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridStep === '0'`);
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridComplete === 'false'`);

  await realClick("Call demand response");
  await realClick("Start peakers");
  const preserved = await readSignal("storage");
  if (preserved.state !== "controlled" || !preserved.text.includes("FLEXIBLE") || !preserved.text.includes("Heatwave ✓")) {
    throw new Error(`Preserved-storage path lost flexibility unexpectedly: ${JSON.stringify(preserved)}`);
  }
  const mixed = await buttonPoint("Mix storage + demand response");
  if (!mixed || mixed.ariaDisabled === "true") throw new Error(`Preserved-storage path failed to keep mixed heatwave response available: ${JSON.stringify(mixed)}`);
  await realClick("Mix storage + demand response");
  await realClick("Targeted load reduction");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridComplete === 'true'`);

  const finalState = await evaluate(`({
    step: document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridStep ?? null,
    complete: document.querySelector('section[aria-label="Power Grid Dispatcher simulation"]')?.dataset.gridComplete ?? null,
    resultText: document.querySelector('[aria-label="Power Grid Dispatcher result"]')?.textContent ?? '',
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
  })`);
  if (!finalState.resultText.includes("Final score") || !finalState.resultText.includes("Reliability penalty")) throw new Error(`Power Grid result summary missing: ${JSON.stringify(finalState)}`);
  if (finalState.frameworkError) throw new Error("Framework error UI detected during Power Grid smoke test");

  await capture("power-grid-result-desktop.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await capture("power-grid-result-mobile.png");
  await send("Emulation.clearDeviceMetricsOverride");

  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    earlyStoragePathLockedHeatwaveMix: true,
    preservedStoragePathKeptHeatwaveMix: true,
    finiteOptionalityLessonVerified: true,
    bestPersisted: true,
    resultCaptures: 2,
    restartVerified: true,
    finalState,
  }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
