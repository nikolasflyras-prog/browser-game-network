import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.PROGRESSION_BASE_URL ?? "http://127.0.0.1:3016";
const artifactDir = process.env.PROGRESSION_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9236";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(artifactDir, { recursive: true });

async function waitForValue(fn, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for player progression browser state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "player-progression-smoke-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1360,980",
  "--remote-debugging-port=9236",
  `--user-data-dir=${profileDir}`,
  `${baseUrl}/games/market-maker`,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const result = await fetch(`${debugBase}/json/list`);
    if (!result.ok) return null;
    return (await result.json()).find((entry) => entry.type === "page" && entry.url.includes("/games/market-maker"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening progression CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open progression CDP websocket")); }, { once: true });
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

  async function waitForExpression(expression, timeout = 15000) {
    return waitForValue(() => evaluate(expression), timeout);
  }

  async function navigate(url) {
    await send("Page.navigate", { url });
    await waitForExpression(`document.readyState === 'complete'`);
    await sleep(350);
  }

  async function readProgression() {
    return evaluate(`(() => {
      const raw = localStorage.getItem('bgn:player-progression:v1');
      return raw ? JSON.parse(raw) : null;
    })()`);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Market Maker game"] canvas'))`);
  const first = await waitForValue(async () => {
    const state = await readProgression();
    return state?.playedGames?.includes('market-maker') && state.xp >= 5 ? state : null;
  });

  await navigate(`${baseUrl}/games/orbit-relay`);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Orbit Relay game"] canvas'))`);
  const second = await waitForValue(async () => {
    const state = await readProgression();
    return state?.playedGames?.includes('orbit-relay') && state?.daily?.uniqueGames?.length >= 2 && state.xp >= 10 ? state : null;
  });

  await navigate(`${baseUrl}/progress`);
  await waitForExpression(`document.body.innerText.includes('Daily goals') && document.body.innerText.includes('Mastery')`);
  await waitForExpression(`document.body.innerText.includes('Market Maker') && document.body.innerText.includes('Orbit Relay')`);
  await waitForExpression(`document.body.innerText.includes('Play two different games')`);

  const progressState = await readProgression();
  if (!progressState) throw new Error("Progression storage missing on progress hub");
  if (progressState.playedGames.length < 2) throw new Error(`Cross-game exploration did not persist: ${JSON.stringify(progressState)}`);
  if (progressState.daily.uniqueGames.length < 2) throw new Error(`Daily cross-training goal did not update: ${JSON.stringify(progressState.daily)}`);
  if (!progressState.achievements.includes("first-run")) throw new Error("First Run badge did not unlock");
  if (progressState.streak < 1) throw new Error("Daily streak did not start");

  const desktopShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifactDir, "progress-dashboard-desktop.png"), Buffer.from(desktopShot.data, "base64"));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(450);
  await waitForExpression(`document.body.innerText.includes('Progress')`);
  const mobileShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifactDir, "progress-dashboard-mobile.png"), Buffer.from(mobileShot.data, "base64"));

  const frameworkError = await evaluate(`Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error')`);
  if (frameworkError) throw new Error("Framework error UI detected during progression smoke");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    firstGameXp: first.xp,
    secondGameXp: second.xp,
    gamesExplored: progressState.playedGames.length,
    dailyUniqueGames: progressState.daily.uniqueGames.length,
    streak: progressState.streak,
    badges: progressState.achievements,
    desktopMobileCaptured: true,
    persistenceVerified: true,
  }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
