import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.CHIP_FAB_URL ?? "http://127.0.0.1:3005/games/chip-fab";
const artifactDir = process.env.CHIP_FAB_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9233";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(artifactDir, { recursive: true });

async function waitForValue(fn, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Chip Fab browser state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "chip-fab-public-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,1000",
  "--remote-debugging-port=9233",
  `--user-data-dir=${profileDir}`,
  targetUrl,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const response = await fetch(`${debugBase}/json/list`);
    if (!response.ok) return null;
    return (await response.json()).find((entry) => entry.type === "page" && entry.url.includes("/games/chip-fab"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening Chip Fab CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Chip Fab CDP websocket")); }, { once: true });
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
      const section = document.querySelector('section[aria-label="Chip Fab simulation"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}));
      if (!button) return null;
      button.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = button.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return { x: rect.left + rect.width / 2, y: rect.top + Math.min(rect.height / 2, 28), text: button.textContent ?? '' };
    })()`);
  }

  async function realClick(label, expectAdvance = true) {
    const beforeStep = await evaluate(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.getAttribute('data-fab-step')`);
    const point = await waitForValue(() => buttonPoint(label));
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
    if (expectAdvance) {
      await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.getAttribute('data-fab-step') !== ${JSON.stringify(beforeStep)}`);
    } else {
      await sleep(150);
    }
  }

  async function readSignal(name) {
    return evaluate(`(() => {
      const node = document.querySelector('[data-fab-signal=${JSON.stringify(name)}]');
      return { state: node?.getAttribute('data-state') ?? null, text: node?.textContent ?? '' };
    })()`);
  }

  async function capture(name) {
    await evaluate(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.scrollIntoView({ block: 'start' }); true`);
    await sleep(100);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(path.join(artifactDir, name), Buffer.from(shot.data, "base64"));
  }

  async function reachBottleneck() {
    await realClick("Controlled ramp");
    await realClick("Increase sampling");
    await waitForExpression(`document.querySelector('[data-fab-context]')?.textContent?.includes('Bottleneck utilization is not the same as fab output')`);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Chip Fab simulation"]'))`);
  await waitForExpression(`(() => {
    const section = document.querySelector('section[aria-label="Chip Fab simulation"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Controlled ramp'));
    return Boolean(button && Object.keys(button).some((key) => key.startsWith('__reactProps$') || key.startsWith('__reactFiber$')));
  })()`);
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabStep === '0'`);
  await evaluate(`localStorage.removeItem('bgn:chip-fab:best-score'); true`);

  const initialOutput = await readSignal("good-output");
  if (!initialOutput.text.includes("30")) throw new Error(`Unexpected initial Chip Fab good output: ${JSON.stringify(initialOutput)}`);

  await reachBottleneck();
  await realClick("Run flat-out");
  const flatOutput = await readSignal("good-output");
  const flatCongestion = await readSignal("congestion");
  const flatRisk = await readSignal("process-risk");
  if (!flatOutput.text.includes("41")) throw new Error(`Unexpected flat-out good output: ${JSON.stringify(flatOutput)}`);
  if (flatCongestion.state !== "high" || !flatCongestion.text.includes("HIGH")) throw new Error(`Flat-out path did not surface high cycle-time pressure: ${JSON.stringify(flatCongestion)}`);
  if (flatRisk.state !== "watch") throw new Error(`Unexpected flat-out process risk: ${JSON.stringify(flatRisk)}`);
  const deltaVisible = await evaluate(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.textContent?.includes('What your last decision changed')`);
  if (!deltaVisible) throw new Error("Chip Fab metric-delta explanation missing after bottleneck decision");

  await realClick("Shorten maintenance");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabComplete === 'true'`);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Chip Fab result"]'))`);
  const storedBest = await evaluate(`localStorage.getItem('bgn:chip-fab:best-score')`);
  if (!storedBest) throw new Error("Chip Fab best score was not persisted");
  const parsedBest = JSON.parse(storedBest);
  if (parsedBest?.version !== 1 || typeof parsedBest?.value !== "number" || parsedBest.value <= 0) throw new Error(`Unexpected Chip Fab best-score record: ${storedBest}`);

  await capture("chip-fab-result-desktop.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await capture("chip-fab-result-mobile.png");
  await send("Emulation.clearDeviceMetricsOverride");

  await realClick("Run another fab", false);
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabStep === '0'`);
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabComplete === 'false'`);

  await reachBottleneck();
  await realClick("Improve scheduling");
  const scheduledOutput = await readSignal("good-output");
  const scheduledCongestion = await readSignal("congestion");
  if (!scheduledOutput.text.includes("47")) throw new Error(`Unexpected scheduling good output: ${JSON.stringify(scheduledOutput)}`);
  if (scheduledCongestion.state !== "controlled" || !scheduledCongestion.text.includes("CONTROLLED")) throw new Error(`Scheduling did not reduce cycle-time pressure: ${JSON.stringify(scheduledCongestion)}`);
  if (47 <= 41) throw new Error("Chip Fab lesson comparison is invalid");
  await realClick("Shorten maintenance");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabComplete === 'true'`);

  const finalState = await evaluate(`({
    step: document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabStep ?? null,
    complete: document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabComplete ?? null,
    resultText: document.querySelector('[aria-label="Chip Fab result"]')?.textContent ?? '',
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
  })`);
  if (!finalState.resultText.includes("Final score") || !finalState.resultText.includes("Good output")) throw new Error(`Chip Fab result summary missing: ${JSON.stringify(finalState)}`);
  if (finalState.frameworkError) throw new Error("Framework error UI detected during Chip Fab smoke test");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    flatOut: { goodOutput: 41, congestion: "high", processRisk: "watch" },
    improveScheduling: { goodOutput: 47, congestion: "controlled" },
    utilizationLessonVerified: true,
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
