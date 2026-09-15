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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "supply-chain-public-"));
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

  async function waitForExpression(expression, timeout = 8000) {
    return waitForValue(() => evaluate(expression), timeout);
  }

  async function buttonPoint(label) {
    return evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Supply Chain Shock simulation"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}));
      if (!button) return null;
      button.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = button.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + Math.min(rect.height / 2, 28),
        disabled: button.getAttribute('aria-disabled'),
        text: button.textContent ?? '',
      };
    })()`);
  }

  async function realClick(label, expectAdvance = true) {
    const beforeStep = await evaluate(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.getAttribute('data-supply-step')`);
    const point = await waitForValue(() => buttonPoint(label));
    if (expectAdvance && point.disabled === "true") throw new Error(`Supply Chain control unexpectedly disabled: ${label}`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
    if (expectAdvance) {
      await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.getAttribute('data-supply-step') !== ${JSON.stringify(beforeStep)}`);
    } else {
      await sleep(150);
    }
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
  await waitForExpression(`(() => {
    const section = document.querySelector('section[aria-label="Supply Chain Shock simulation"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Qualify a second supplier'));
    return Boolean(button && Object.keys(button).some((key) => key.startsWith('__reactProps$') || key.startsWith('__reactFiber$')));
  })()`);
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.dataset.supplyStep === '0'`);

  await evaluate(`localStorage.removeItem('bgn:supply-chain-shock:best-score'); true`);

  await realClick("Qualify a second supplier");
  const prepared = await evaluate(`(() => {
    const node = document.querySelector('[data-supply-capability="alternate-capacity"]');
    return { status: node?.getAttribute('data-status'), text: node?.textContent ?? '' };
  })()`);
  if (prepared.status !== "ready" || !prepared.text.includes("READY")) {
    throw new Error(`Prepared capacity did not become ready: ${JSON.stringify(prepared)}`);
  }
  const deltaVisible = await evaluate(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.textContent?.includes('What your last decision changed')`);
  if (!deltaVisible) throw new Error("Supply Chain metric-delta explanation missing after decision");

  await realClick("Prioritize key customers");
  await realClick("Cap new orders");
  const backup = await buttonPoint("Activate alternate capacity");
  if (!backup || backup.disabled === "true") throw new Error("Prepared path failed to unlock alternate capacity");
  await realClick("Activate alternate capacity");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.getAttribute('data-supply-complete') === 'true'`);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Supply Chain Shock result"]'))`);

  const storedBest = await evaluate(`localStorage.getItem('bgn:supply-chain-shock:best-score')`);
  if (!storedBest) throw new Error("Supply Chain best score was not persisted");
  const parsedBest = JSON.parse(storedBest);
  if (parsedBest?.version !== 1 || typeof parsedBest?.value !== "number" || parsedBest.value <= 0) {
    throw new Error(`Unexpected Supply Chain best score record: ${storedBest}`);
  }
  await capture("supply-chain-result-desktop.png");

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await capture("supply-chain-result-mobile.png");
  await send("Emulation.clearDeviceMetricsOverride");

  await realClick("Run another network", false);
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.getAttribute('data-supply-step') === '0'`);
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.getAttribute('data-supply-complete') === 'false'`);

  await realClick("Wait for evidence");
  const unprepared = await evaluate(`(() => {
    const node = document.querySelector('[data-supply-capability="alternate-capacity"]');
    return { status: node?.getAttribute('data-status'), text: node?.textContent ?? '' };
  })()`);
  if (unprepared.status !== "pending" || !unprepared.text.includes("NOT READY")) {
    throw new Error(`Unprepared path incorrectly shows backup readiness: ${JSON.stringify(unprepared)}`);
  }
  await realClick("Prioritize key customers");
  await realClick("Cap new orders");
  const blocked = await buttonPoint("Activate alternate capacity");
  if (!blocked || blocked.disabled !== "true" || !blocked.text.includes("qualified alternate capacity")) {
    throw new Error(`Unprepared path did not expose locked alternate capacity: ${JSON.stringify(blocked)}`);
  }
  await realClick("Activate alternate capacity", false);
  const blockedNotice = await evaluate(`document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.textContent ?? ''`);
  if (!blockedNotice.includes("do not have enough qualified alternate capacity")) {
    throw new Error("Unavailable backup response did not explain why preparation mattered");
  }

  const finalState = await evaluate(`({
    step: document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.getAttribute('data-supply-step'),
    complete: document.querySelector('section[aria-label="Supply Chain Shock simulation"]')?.getAttribute('data-supply-complete'),
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
  })`);
  if (finalState.frameworkError) throw new Error("Framework error UI detected during Supply Chain Shock smoke test");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    preparedPathUnlockedBackup: true,
    unpreparedPathBlockedBackup: true,
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
