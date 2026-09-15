import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.MARKET_MAKER_URL ?? "http://127.0.0.1:3000/games/market-maker";
const artifactDir = process.env.MARKET_MAKER_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9228";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(artifactDir, { recursive: true });

const response = await fetch(targetUrl);
if (!response.ok) throw new Error(`Market Maker route returned ${response.status}`);
const html = await response.text();
if (!html.includes("Market Maker")) throw new Error("Market Maker title missing");
if (!html.includes("Bid-ask spread")) throw new Error("Market Maker learning content missing");

async function waitForValue(fn, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Market Maker browser state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "market-maker-smoke-"));
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
    const result = await fetch(`${debugBase}/json/list`);
    if (!result.ok) return null;
    return (await result.json()).find((entry) => entry.type === "page" && entry.url.includes("/games/market-maker"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening Market Maker CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Market Maker CDP websocket")); }, { once: true });
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
    if (message.method === "Runtime.exceptionThrown") {
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
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
    return result.result?.value;
  }

  async function waitForExpression(expression, timeout = 10000) {
    return waitForValue(() => evaluate(expression), timeout);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Market Maker simulation"]'))`);
  await waitForExpression(`(() => {
    const section = document.querySelector('section[aria-label="Market Maker simulation"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Make market at'));
    return Boolean(button && Object.keys(button).some((key) => key.startsWith('__reactProps$') || key.startsWith('__reactFiber$')));
  })()`);

  await evaluate(`localStorage.removeItem('bgn:market-maker:best-score'); true`);

  for (let round = 0; round < 16; round += 1) {
    const expectedRound = round + 1;
    const acted = await evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Market Maker simulation"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Make market at'));
      if (!button) return false;
      button.click();
      return true;
    })()`);
    if (!acted) throw new Error(`Market Maker stopped before round ${expectedRound}`);

    if (expectedRound < 16) {
      await waitForExpression(`document.querySelector('section[aria-label="Market Maker simulation"]')?.textContent?.includes(${JSON.stringify(`Round${expectedRound}/16`)})`);
    } else {
      await waitForExpression(`document.querySelector('section[aria-label="Market Maker result"]')?.textContent?.includes('Final score')`);
    }
  }

  await waitForExpression(`Boolean(localStorage.getItem('bgn:market-maker:best-score'))`);

  const finalState = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Market Maker simulation"]');
    const result = document.querySelector('section[aria-label="Market Maker result"]');
    return {
      text: result?.textContent ?? '',
      bestStorage: localStorage.getItem('bgn:market-maker:best-score'),
      makeMarketVisible: Array.from(section?.querySelectorAll('button') ?? []).some((node) => node.textContent?.includes('Make market at')),
      frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
    };
  })()`);

  for (const label of ["customer fills", "peak inventory", "risk penalty"]) {
    if (!finalState.text.toLowerCase().includes(label)) throw new Error(`Market Maker result missing ${label}`);
  }
  if (!finalState.bestStorage) throw new Error("Market Maker best score was not persisted");
  if (finalState.makeMarketVisible) throw new Error("Market Maker still showed the quote action after completion");
  if (finalState.frameworkError) throw new Error("Framework error UI detected on Market Maker");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  const desktopShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifactDir, "market-maker-result-desktop.png"), Buffer.from(desktopShot.data, "base64"));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate(`document.querySelector('section[aria-label="Market Maker result"]')?.scrollIntoView({ block: 'start' }); true`);
  await sleep(100);
  const mobileShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifactDir, "market-maker-result-mobile.png"), Buffer.from(mobileShot.data, "base64"));

  const restarted = await evaluate(`(() => {
    const button = Array.from(document.querySelectorAll('section[aria-label="Market Maker result"] button')).find((node) => node.textContent?.includes('Deal another market'));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!restarted) throw new Error("Market Maker restart control missing");
  await waitForExpression(`Array.from(document.querySelectorAll('section[aria-label="Market Maker simulation"] button')).some((node) => node.textContent?.includes('Make market at'))`);
  await waitForExpression(`!document.querySelector('section[aria-label="Market Maker result"]')`);

  console.log(JSON.stringify({ targetUrl, roundsCompleted: 16, bestPersisted: true, resultCaptures: 2, restartVerified: true }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
