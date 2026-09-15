import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.FUTURE_GAMES_LAB_URL ?? "http://127.0.0.1:3010/lab/future-games";
const artifactDir = process.env.FUTURE_GAMES_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9228";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(artifactDir, { recursive: true });

function seedFromDateKey(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextRandom(seed) {
  const next = (seed * 1103515245 + 12345) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

function applyAction(switches, action) {
  if (action === "HOLD") return { ...switches };
  return { ...switches, [action]: !switches[action] };
}

function routeDepot(switches) {
  if (!switches.A) return switches.B ? 1 : 0;
  return switches.C ? 3 : 2;
}

function routeAfterAction(switches, action) {
  return routeDepot(applyAction(switches, action));
}

function generateTarget(switches, seed) {
  const roll = nextRandom(seed);
  const depots = [...new Set(["HOLD", "A", "B", "C"].map((action) => routeAfterAction(switches, action)))].sort();
  const index = Math.min(depots.length - 1, Math.floor(roll.value * depots.length));
  return { seed: roll.seed, target: depots[index] ?? 0 };
}

function solveDaily(dateKey, maxTurns = 10) {
  const actions = [];
  let switches = { A: false, B: false, C: false };
  let generated = generateTarget(switches, seedFromDateKey(dateKey));
  let seed = generated.seed;
  let target = generated.target;

  for (let turn = 0; turn < maxTurns; turn += 1) {
    const action = ["HOLD", "A", "B", "C"].find((candidate) => routeAfterAction(switches, candidate) === target);
    if (!action) throw new Error(`No Switchyard solution action for turn ${turn + 1}`);
    actions.push(action);
    switches = applyAction(switches, action);
    if (turn < maxTurns - 1) {
      generated = generateTarget(switches, seed);
      seed = generated.seed;
      target = generated.target;
    }
  }
  return actions;
}

async function waitForValue(fn, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Switchyard promotion state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "switchyard-promotion-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,960",
  "--remote-debugging-port=9228",
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
    const timer = setTimeout(() => reject(new Error("Timed out opening Switchyard QA websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Switchyard QA websocket")); }, { once: true });
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

  async function activate(title) {
    const clicked = await evaluate(`(() => {
      const button = Array.from(document.querySelectorAll('nav button')).find((node) => node.textContent?.includes(${JSON.stringify(title)}));
      if (!button) return false;
      button.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`Could not activate ${title}`);
    await sleep(160);
  }

  async function dispatchAction(action) {
    const isHold = action === "HOLD";
    const key = isHold ? " " : action.toLowerCase();
    const code = isHold ? "Space" : `Key${action}`;
    const virtualKey = isHold ? 32 : action.charCodeAt(0);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey });
  }

  function eventHistoryExpression() {
    return `(document.querySelector('[data-lab-event-history]')?.getAttribute('data-lab-event-history') ?? '').split(',').filter(Boolean)`;
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await evaluate(`(() => { for (const key of Object.keys(localStorage)) if (key.startsWith('bgn:switchyard-daily:')) localStorage.removeItem(key); return true; })()`);
  await activate("Switchyard Daily");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Switchyard Daily staged runtime"] canvas'))`);

  const todayKey = new Date().toISOString().slice(0, 10);
  const dailyId = `SWY-${todayKey.replaceAll("-", "")}`;
  await waitForExpression(`document.querySelector('[data-switchyard-daily-id]')?.getAttribute('data-switchyard-daily-id') === ${JSON.stringify(dailyId)}`);
  await waitForExpression(`document.querySelector('[data-switchyard-date-key]')?.getAttribute('data-switchyard-date-key') === ${JSON.stringify(todayKey)}`);

  const actions = solveDaily(todayKey);
  for (const action of actions) {
    await dispatchAction(action);
    await sleep(730);
  }

  await waitForExpression(`document.querySelector('[data-switchyard-complete]')?.getAttribute('data-switchyard-complete') === 'true'`, 5000);
  await waitForExpression(`document.querySelector('[data-switchyard-streak]')?.textContent === '1'`, 5000);
  const routeRecord = await evaluate(`document.querySelector('[data-switchyard-route-record]')?.textContent ?? ''`);
  if (!routeRecord.includes("✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓")) throw new Error(`Unexpected Switchyard route record: ${routeRecord}`);
  if (/[🟩🟥]/u.test(routeRecord)) throw new Error("Switchyard route record still depends on color emoji");

  const history = await evaluate(eventHistoryExpression());
  const resolved = history.filter((event) => event === "level_completed").length;
  if (resolved !== 10 || !history.includes("daily_completed") || !history.includes("game_completed")) {
    throw new Error(`Incomplete Switchyard lifecycle: ${history.join(",")}`);
  }

  const stored = await evaluate(`localStorage.getItem(${JSON.stringify(`bgn:switchyard-daily:daily-${todayKey}`)})`);
  if (!stored) throw new Error("Switchyard daily result was not persisted");
  const parsed = JSON.parse(stored);
  if (parsed?.value?.won !== true || parsed?.value?.score !== 1000 || parsed?.value?.strikes !== 0) {
    throw new Error(`Unexpected Switchyard best result: ${stored}`);
  }

  const shared = await evaluate(`(() => { const button = document.querySelector('[data-switchyard-share]'); button?.click(); return Boolean(button); })()`);
  if (!shared) throw new Error("Switchyard share control missing");
  await waitForExpression(`document.querySelector('[data-lab-latest-event]')?.getAttribute('data-lab-latest-event')?.includes(${JSON.stringify(`share_clicked · daily_id=${dailyId}`)})`);

  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifactDir, "future-switchyard-promotion-desktop.png"), Buffer.from(screenshot.data, "base64"));

  await send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await activate("Traffic Control");
  await activate("Switchyard Daily");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Switchyard Daily staged runtime"] canvas'))`);
  const reducedActions = solveDaily(todayKey, 2);
  await dispatchAction(reducedActions[0]);
  await sleep(250);
  await dispatchAction(reducedActions[1]);
  await waitForExpression(`${eventHistoryExpression()}.filter((event) => event === 'level_completed').length === 2`, 1500);

  if (runtimeErrors.length) throw new Error(`Runtime errors detected during Switchyard promotion QA: ${runtimeErrors.join(" | ")}`);
  console.log(JSON.stringify({
    targetUrl,
    dailyId,
    routesCompleted: 10,
    bestPersisted: true,
    shareVerified: true,
    nonColorResultVerified: true,
    reducedMotionVerified: true,
  }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
