import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.FUTURE_GAMES_LAB_URL ?? "http://127.0.0.1:3010/lab/future-games";
const artifactDir = process.env.FUTURE_GAMES_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9227";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stagedLearnGames = ["Supply Chain Shock", "Chip Fab", "Power Grid Dispatcher"];

await mkdir(artifactDir, { recursive: true });

async function waitForValue(fn, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for staged Learn result state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "future-games-results-"));
const chrome = spawn(chromePath, [
  "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars",
  "--window-size=1280,960", "--remote-debugging-port=9227", `--user-data-dir=${profileDir}`, targetUrl,
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
    const timer = setTimeout(() => reject(new Error("Timed out opening result QA websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open result QA websocket")); }, { once: true });
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
    await waitForExpression(`(document.querySelector('[data-lab-event-history]')?.getAttribute('data-lab-event-history') ?? '').includes('game_started')`);
  }

  function fileSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function capture(title, surface, suffix) {
    await evaluate(`document.querySelector('section[aria-label=${JSON.stringify(surface)}]')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -8); true`);
    await sleep(80);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(path.join(artifactDir, `future-${fileSlug(title)}-result-${suffix}.png`), Buffer.from(shot.data, "base64"));
  }

  async function eventHistory() {
    const raw = await evaluate("document.querySelector('[data-lab-event-history]')?.getAttribute('data-lab-event-history') ?? ''");
    return raw ? raw.split(",") : [];
  }

  async function assertLifecycle(title, resolvedCount) {
    const history = await eventHistory();
    const count = history.filter((event) => event === "level_completed").length;
    if (!history.includes("game_started")) throw new Error(`${title} missing game_started`);
    if (count !== resolvedCount) throw new Error(`${title} expected ${resolvedCount} level_completed events, saw ${count}: ${history.join(",")}`);
    if (!history.includes("game_completed")) throw new Error(`${title} missing game_completed`);
  }

  async function clickRestart(surface, label) {
    const clicked = await evaluate(`(() => {
      const section = document.querySelector('section[aria-label=${JSON.stringify(surface)}]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}));
      button?.click();
      return Boolean(button);
    })()`);
    if (!clicked) throw new Error(`${surface} restart control missing`);
    await waitForExpression(`(document.querySelector('[data-lab-event-history]')?.getAttribute('data-lab-event-history') ?? '').includes('game_restarted')`);
  }

  async function completeScenario(title, suffix) {
    const surface = `${title} staged prototype`;
    await activate(title);
    await waitForExpression(`Boolean(document.querySelector('section[aria-label=${JSON.stringify(surface)}]'))`);

    for (let decision = 0; decision < 4; decision += 1) {
      const acted = await evaluate(`(() => {
        const section = document.querySelector('section[aria-label=${JSON.stringify(surface)}]');
        const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.getAttribute('aria-disabled') !== 'true' && node.textContent?.trim() !== 'Run again');
        button?.click();
        return Boolean(button);
      })()`);
      if (!acted) throw new Error(`${title} has no available choice at decision ${decision + 1}`);
      await sleep(45);
    }

    await waitForExpression(`document.querySelector('section[aria-label=${JSON.stringify(surface)}]')?.textContent?.includes('Operating style')`);
    const resultText = await evaluate(`document.querySelector('section[aria-label=${JSON.stringify(surface)}]')?.textContent ?? ''`);
    if (!resultText.includes("Strongest improvement") && !resultText.includes("Main tradeoff")) {
      throw new Error(`${title} result explanation is missing`);
    }
    await assertLifecycle(title, 4);
    await capture(title, surface, suffix);
    await clickRestart(surface, "Run again");
  }

  await send("Runtime.enable");
  await send("Page.enable");

  for (const title of stagedLearnGames) await completeScenario(title, "desktop");

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const title of stagedLearnGames) await completeScenario(title, "mobile");

  if (runtimeErrors.length) throw new Error(`Runtime errors detected during result QA: ${runtimeErrors.join(" | ")}`);
  console.log(JSON.stringify({
    targetUrl,
    completedLearnGames: stagedLearnGames,
    resultCaptures: stagedLearnGames.length * 2,
    analyticsLifecycleVerified: true,
    promotedLearnGamesExcluded: ["Market Maker"],
  }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
