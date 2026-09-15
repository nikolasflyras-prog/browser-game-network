import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.FUTURE_GAMES_LAB_URL ?? "http://127.0.0.1:3010/lab/future-games";
const debugBase = "http://127.0.0.1:9231";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForValue(fn, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Power Grid learning state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "power-grid-learning-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,960",
  "--remote-debugging-port=9231",
  `--user-data-dir=${profileDir}`,
  targetUrl,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const response = await fetch(`${debugBase}/json/list`);
    if (!response.ok) return null;
    return (await response.json()).find((entry) => entry.type === "page" && entry.url.includes("/lab/future-games"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening Power Grid QA websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Power Grid QA websocket")); }, { once: true });
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
    } else if (message.method === "Runtime.exceptionThrown") {
      runtimeErrors.push(message.params?.exceptionDetails?.text ?? "Runtime exception");
    }
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

  async function activate() {
    const clicked = await evaluate(`(() => {
      const button = Array.from(document.querySelectorAll('nav button')).find((node) => node.textContent?.includes('Power Grid Dispatcher'));
      button?.click();
      return Boolean(button);
    })()`);
    if (!clicked) throw new Error("Power Grid Dispatcher tab missing");
    await waitForExpression(`Boolean(document.querySelector('section[aria-label="Power Grid Dispatcher staged prototype"]'))`);
  }

  async function clickChoice(label) {
    const clicked = await evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Power Grid Dispatcher staged prototype"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}));
      if (!button || button.getAttribute('aria-disabled') === 'true') return false;
      button.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`Power Grid choice unavailable: ${label}`);
    await sleep(80);
  }

  async function readSignal(name) {
    return evaluate(`(() => {
      const node = document.querySelector('[data-grid-signal=${JSON.stringify(name)}]');
      return { state: node?.getAttribute('data-state') ?? null, text: node?.textContent ?? '' };
    })()`);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await activate();

  const initialStorage = await readSignal("storage");
  if (initialStorage.state !== "controlled" || !initialStorage.text.includes("FLEXIBLE") || !initialStorage.text.includes("Wind ✓") || !initialStorage.text.includes("Heatwave ✓")) {
    throw new Error(`Unexpected initial storage flexibility: ${JSON.stringify(initialStorage)}`);
  }

  await clickChoice("Discharge batteries");
  await clickChoice("Use storage");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher staged prototype"]')?.textContent?.includes('Heatwave afternoon')`);

  const depleted = await readSignal("storage");
  if (depleted.state !== "high" || !depleted.text.includes("DEPLETED") || !depleted.text.includes("Wind ×") || !depleted.text.includes("Heatwave ×")) {
    throw new Error(`Early storage use did not surface depleted flexibility: ${JSON.stringify(depleted)}`);
  }
  const depletedContext = await evaluate(`document.querySelector('[data-grid-context]')?.textContent ?? ''`);
  if (!depletedContext.includes("depleted the flexibility needed for the mixed heatwave response")) {
    throw new Error(`Power Grid depleted-storage lesson missing: ${depletedContext}`);
  }
  const mixedBlocked = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Power Grid Dispatcher staged prototype"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Mix storage + demand response'));
    return { disabled: button?.getAttribute('aria-disabled') ?? null, text: button?.textContent ?? '' };
  })()`);
  if (mixedBlocked.disabled !== "true" || !mixedBlocked.text.includes("Earlier battery use left too little stored energy")) {
    throw new Error(`Heatwave mixed response should be blocked after storage depletion: ${JSON.stringify(mixedBlocked)}`);
  }

  await clickChoice("Use emergency pricing");
  await clickChoice("Targeted load reduction");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher staged prototype"]')?.textContent?.includes('Operating style')`);
  const restarted = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Power Grid Dispatcher staged prototype"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.trim() === 'Run again');
    button?.click();
    return Boolean(button);
  })()`);
  if (!restarted) throw new Error("Power Grid restart control missing");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher staged prototype"]')?.textContent?.includes('Morning ramp')`);

  await clickChoice("Call demand response");
  await clickChoice("Start peakers");
  await waitForExpression(`document.querySelector('section[aria-label="Power Grid Dispatcher staged prototype"]')?.textContent?.includes('Heatwave afternoon')`);
  const preserved = await readSignal("storage");
  if (preserved.state !== "controlled" || !preserved.text.includes("FLEXIBLE") || !preserved.text.includes("Heatwave ✓")) {
    throw new Error(`Preserved-storage path lost flexibility unexpectedly: ${JSON.stringify(preserved)}`);
  }
  const mixedAvailable = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Power Grid Dispatcher staged prototype"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Mix storage + demand response'));
    return button ? button.getAttribute('aria-disabled') : null;
  })()`);
  if (mixedAvailable === null || mixedAvailable === "true") throw new Error("Preserved-storage path failed to keep mixed heatwave response available");
  await clickChoice("Mix storage + demand response");

  const history = await evaluate(`(document.querySelector('[data-lab-event-history]')?.getAttribute('data-lab-event-history') ?? '').split(',').filter(Boolean)`);
  if (!history.includes("game_restarted") || history.filter((event) => event === "level_completed").length < 7) {
    throw new Error(`Power Grid analytics lifecycle incomplete: ${history.join(",")}`);
  }
  if (runtimeErrors.length) throw new Error(`Runtime errors detected during Power Grid learning QA: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    earlyStoragePathLockedHeatwaveMix: true,
    preservedStoragePathKeptHeatwaveMix: true,
    finiteOptionalityLessonVerified: true,
  }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
