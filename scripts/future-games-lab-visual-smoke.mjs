import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.FUTURE_GAMES_LAB_URL ?? "http://127.0.0.1:3010/lab/future-games";
const artifactDir = process.env.FUTURE_GAMES_LAB_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9227";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const games = [
  ["Traffic Control", "traffic-control"],
  ["Switchyard Daily", "switchyard-daily"],
  ["Market Maker", "market-maker"],
  ["Supply Chain Shock", "supply-chain-shock"],
  ["Chip Fab", "chip-fab"],
  ["Power Grid Dispatcher", "power-grid-dispatcher"],
];

await mkdir(artifactDir, { recursive: true });

async function waitForValue(fn, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(100);
  }
  throw new Error("Timed out waiting for visual QA browser state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "future-games-visual-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,960",
  "--remote-debugging-port=9227",
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
    const timer = setTimeout(() => reject(new Error("Timed out opening visual QA CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open visual QA CDP websocket")); }, { once: true });
  });

  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result ?? {});
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

  async function setViewport(width, height) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
      screenWidth: width,
      screenHeight: height,
    });
    await sleep(120);
  }

  async function capture(slug, width, height) {
    await setViewport(width, height);
    await evaluate("window.scrollTo(0, 0); true");
    await sleep(100);
    const shot = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    const suffix = width <= 430 ? "mobile" : "desktop";
    await writeFile(path.join(artifactDir, `future-games-${slug}-${suffix}.png`), Buffer.from(shot.data, "base64"));
  }

  async function activate(title) {
    const clicked = await evaluate(`(() => {
      const button = Array.from(document.querySelectorAll('nav button')).find((node) => node.textContent?.includes(${JSON.stringify(title)}));
      if (!button) return false;
      button.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`Could not activate ${title}`);
    await sleep(220);
  }

  await send("Runtime.enable");
  await send("Page.enable");

  for (const [title, slug] of games) {
    await activate(title);
    await capture(slug, 1280, 960);
    await capture(slug, 390, 844);
    await send("Emulation.clearDeviceMetricsOverride");
    await sleep(120);
  }

  console.log(JSON.stringify({ targetUrl, screenshotPairs: games.length }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
