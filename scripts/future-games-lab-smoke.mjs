import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.FUTURE_GAMES_LAB_URL ?? "http://127.0.0.1:3010/lab/future-games";
const artifactDir = process.env.FUTURE_GAMES_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9226";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const labGames = ["Traffic Control", "Switchyard Daily", "Market Maker", "Supply Chain Shock", "Chip Fab", "Power Grid Dispatcher"];

await mkdir(artifactDir, { recursive: true });

const response = await fetch(targetUrl);
if (!response.ok) throw new Error(`Future Games Lab returned ${response.status}`);
const html = await response.text();
if (!html.includes("Future Games Lab")) throw new Error("Future Games Lab title missing");
if (!/name=["']robots["'][^>]*noindex|noindex[^>]*name=["']robots["']/.test(html)) {
  throw new Error("Future Games Lab is missing noindex metadata");
}

function switchyardSeedFromDateKey(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextSwitchyardRandom(seed) {
  const next = (seed * 1103515245 + 12345) >>> 0;
  return { seed: next, value: next / 0xffffffff };
}

function applySwitchyardAction(switches, action) {
  if (action === "HOLD") return { ...switches };
  return { ...switches, [action]: !switches[action] };
}

function routeSwitchyardDepot(switches) {
  if (!switches.A) return switches.B ? 1 : 0;
  return switches.C ? 3 : 2;
}

function routeAfterAction(switches, action) {
  return routeSwitchyardDepot(applySwitchyardAction(switches, action));
}

function generateSwitchyardTarget(switches, seed) {
  const roll = nextSwitchyardRandom(seed);
  const depots = [...new Set(["HOLD", "A", "B", "C"].map((action) => routeAfterAction(switches, action)))].sort();
  const index = Math.min(depots.length - 1, Math.floor(roll.value * depots.length));
  return { seed: roll.seed, target: depots[index] ?? 0 };
}

function solveSwitchyardDaily(dateKey, maxTurns = 10) {
  const actions = [];
  let switches = { A: false, B: false, C: false };
  let generated = generateSwitchyardTarget(switches, switchyardSeedFromDateKey(dateKey));
  let seed = generated.seed;
  let target = generated.target;

  for (let turn = 0; turn < maxTurns; turn += 1) {
    const action = ["HOLD", "A", "B", "C"].find((candidate) => routeAfterAction(switches, candidate) === target);
    if (!action) throw new Error(`No Switchyard solution action for turn ${turn + 1}`);
    actions.push(action);
    switches = applySwitchyardAction(switches, action);
    if (turn < maxTurns - 1) {
      generated = generateSwitchyardTarget(switches, seed);
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
    await sleep(100);
  }
  throw new Error("Timed out waiting for Future Games Lab browser state");
}

let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
  const result = spawnSync("which", [candidate], { encoding: "utf8" });
  if (result.status === 0 && result.stdout.trim()) {
    chromePath = result.stdout.trim();
    break;
  }
}
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

const profileDir = await mkdtemp(path.join(os.tmpdir(), "future-games-lab-smoke-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,960",
  "--remote-debugging-port=9226",
  `--user-data-dir=${profileDir}`,
  targetUrl,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const result = await fetch(`${debugBase}/json/list`);
    if (!result.ok) return null;
    const pages = await result.json();
    return pages.find((entry) => entry.type === "page" && entry.url.includes("/lab/future-games"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening lab CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open lab CDP websocket")); }, { once: true });
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
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
    return result.result?.value;
  }

  async function waitForExpression(expression, timeout = 10000) {
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
    await sleep(180);
  }

  function fileSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function capture(title, suffix) {
    await evaluate(`document.querySelector('nav button[aria-pressed="true"]')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, 115); true`);
    await sleep(100);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(path.join(artifactDir, `future-${fileSlug(title)}-${suffix}.png`), Buffer.from(shot.data, "base64"));
  }

  async function dispatchSwitchyardAction(action) {
    const isHold = action === "HOLD";
    const key = isHold ? " " : action.toLowerCase();
    const code = isHold ? "Space" : `Key${action}`;
    const virtualKey = isHold ? 32 : action.charCodeAt(0);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey });
  }

  await send("Runtime.enable");
  await send("Page.enable");

  for (const title of labGames) {
    const visible = await waitForExpression(`document.body.innerText.includes(${JSON.stringify(title)})`);
    if (!visible) throw new Error(`Missing lab tab: ${title}`);
  }

  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Traffic Control staged runtime"] canvas'))`);
  const trafficRestarted = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Traffic Control staged runtime"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.trim() === 'Restart');
    button?.click();
    return Boolean(button);
  })()`);
  if (!trafficRestarted) throw new Error("Traffic Control restart control missing");
  await capture("Traffic Control", "desktop");

  await evaluate(`(() => { for (const key of Object.keys(localStorage)) if (key.startsWith('bgn:switchyard-daily:')) localStorage.removeItem(key); return true; })()`);
  await activate("Switchyard Daily");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Switchyard Daily staged runtime"] canvas'))`);
  const todayKey = new Date().toISOString().slice(0, 10);
  const switchyardActions = solveSwitchyardDaily(todayKey);
  for (const action of switchyardActions) {
    await dispatchSwitchyardAction(action);
    await sleep(730);
  }
  await waitForExpression(`document.querySelector('[data-switchyard-complete]')?.getAttribute('data-switchyard-complete') === 'true'`, 5000);
  await waitForExpression(`document.querySelector('[data-switchyard-streak]')?.textContent === '1'`, 5000);
  const storedSwitchyard = await evaluate(`localStorage.getItem(${JSON.stringify(`bgn:switchyard-daily:daily-${todayKey}`)})`);
  if (!storedSwitchyard) throw new Error("Switchyard daily result was not persisted");
  const parsedSwitchyard = JSON.parse(storedSwitchyard);
  if (parsedSwitchyard?.value?.won !== true || parsedSwitchyard?.value?.score !== 1000) {
    throw new Error(`Unexpected Switchyard stored result: ${storedSwitchyard}`);
  }
  const clickedShare = await evaluate(`(() => { const button = document.querySelector('[data-switchyard-share]'); button?.click(); return Boolean(button); })()`);
  if (!clickedShare) throw new Error("Switchyard share control missing after completion");
  await capture("Switchyard Daily", "desktop");

  await activate("Market Maker");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Market Maker staged prototype"]'))`);
  const marketActed = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Market Maker staged prototype"]');
    const posture = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.toLowerCase().includes('tight'));
    posture?.click();
    const execute = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Make market'));
    execute?.click();
    return Boolean(posture && execute);
  })()`);
  if (!marketActed) throw new Error("Market Maker decision controls missing");
  await waitForExpression(`document.querySelector('section[aria-label="Market Maker staged prototype"]')?.textContent?.includes('Last round:')`);
  await capture("Market Maker", "desktop");

  for (const title of ["Supply Chain Shock", "Chip Fab", "Power Grid Dispatcher"]) {
    await activate(title);
    const aria = `${title} staged prototype`;
    await waitForExpression(`Boolean(document.querySelector('section[aria-label=${JSON.stringify(aria)}]'))`);
    const acted = await evaluate(`(() => {
      const section = document.querySelector('section[aria-label=${JSON.stringify(aria)}]');
      const choice = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.getAttribute('aria-disabled') !== 'true' && node.textContent?.trim() !== 'Run again');
      choice?.click();
      return Boolean(choice);
    })()`);
    if (!acted) throw new Error(`${title} has no available decision control`);
    await waitForExpression(`document.querySelector('section[aria-label=${JSON.stringify(aria)}]')?.textContent?.includes('What changed:')`);
    await capture(title, "desktop");
  }

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const title of labGames) {
    await activate(title);
    if (title === "Traffic Control" || title === "Switchyard Daily") {
      await waitForExpression(`Boolean(document.querySelector('section[aria-label=${JSON.stringify(`${title} staged runtime`)}] canvas'))`);
    } else {
      await waitForExpression(`Boolean(document.querySelector('section[aria-label=${JSON.stringify(`${title} staged prototype`)}]'))`);
    }
    await capture(title, "mobile");
  }

  const finalState = await evaluate(`({
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
    activeTitle: document.querySelector('nav button[aria-pressed="true"] strong')?.textContent,
    noPublicGameLinks: !Array.from(document.querySelectorAll('a')).some((node) => node.getAttribute('href')?.startsWith('/games/traffic-control')),
  })`);

  if (finalState.frameworkError) throw new Error("Framework error UI detected in Future Games Lab");
  if (!finalState.noPublicGameLinks) throw new Error("Future Games Lab exposed a public candidate game link");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({ targetUrl, finalState, checkedGames: 6, switchyardActions, visualCaptures: 12 }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
