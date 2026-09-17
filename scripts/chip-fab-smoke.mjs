import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.CHIP_FAB_URL ?? "http://127.0.0.1:3005/games/chip-fab";
const artifactDir = process.env.CHIP_FAB_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9233";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(artifactDir, { recursive: true });

async function waitForValue(fn, timeout = 10000, label = "Chip Fab browser state") {
  const deadline = Date.now() + timeout;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(80);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ""}`);
}

let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
  const found = spawnSync("which", [candidate], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) { chromePath = found.stdout.trim(); break; }
}
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

const profileDir = await mkdtemp(path.join(os.tmpdir(), "chip-fab-live-"));
const chrome = spawn(chromePath, ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars", "--window-size=1280,1000", "--remote-debugging-port=9233", `--user-data-dir=${profileDir}`, targetUrl], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok, 12000, "Chrome debugging endpoint");
  const page = await waitForValue(async () => {
    const response = await fetch(`${debugBase}/json/list`);
    if (!response.ok) return null;
    return (await response.json()).find((entry) => entry.type === "page" && entry.url.includes("/games/chip-fab"));
  }, 12000, "Chip Fab page target");
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
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result ?? {});
      return;
    }
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params?.exceptionDetails?.text ?? "Runtime exception");
  });

  function send(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  }
  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? "Runtime.evaluate failed");
    return response.result?.value;
  }
  async function waitForExpression(expression, timeout = 10000, label = "Chip Fab browser state") { return waitForValue(() => evaluate(expression), timeout, label); }
  async function clickButton(label) {
    await waitForValue(() => evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Chip Fab simulation"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.trim() === ${JSON.stringify(label)});
      if (!button || button.disabled) return false;
      button.scrollIntoView({ block: 'center', inline: 'center' });
      button.click();
      return true;
    })()`), 10000, `Chip Fab button ${label}`);
    await sleep(120);
  }
  async function clickButtonUntil(label, expression, timeout = 10000, stateLabel = label) {
    await waitForValue(async () => {
      if (await evaluate(expression)) return true;
      const clicked = await evaluate(`(() => {
        const section = document.querySelector('section[aria-label="Chip Fab simulation"]');
        const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.trim() === ${JSON.stringify(label)});
        if (!button || button.disabled) return false;
        button.scrollIntoView({ block: 'center', inline: 'center' });
        button.click();
        return true;
      })()`);
      if (!clicked) return false;
      await sleep(140);
      return evaluate(expression);
    }, timeout, stateLabel);
  }
  async function capture(name) {
    await evaluate(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.scrollIntoView({ block: 'start' }); true`);
    await sleep(100);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(path.join(artifactDir, name), Buffer.from(shot.data, "base64"));
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Chip Fab simulation"]'))`, 10000, "Chip Fab simulation mount");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabTick === '0'`, 10000, "initial fab tick");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((node) => node.textContent?.trim() === 'Start fab')`, 10000, "Start fab control");
  await evaluate(`localStorage.removeItem('bgn:chip-fab:best-score'); true`);

  await clickButtonUntil("Push", `document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabStartMode === 'push'`, 10000, "Push wafer-start mode");
  await clickButtonUntil("Focus Lithography", `document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabFocus === 'lithography'`, 10000, "Lithography focus");
  await clickButtonUntil("Start fab", `document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabRunning === 'true'`, 10000, "fab running");
  await waitForExpression(`Number(document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabTick ?? '0') >= 3`, 6000, "fab tick 3");
  await waitForExpression(`Number(document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabWip ?? '0') > 0`, 10000, "positive WIP");

  await clickButton("PM Lithography");
  await waitForExpression(`Number(document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabLithoMaint ?? '0') > 0`, 10000, "Lithography PM start");
  await waitForExpression(`Number(document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabLithoMaint ?? '0') === 0`, 6000, "Lithography PM completion");

  await waitForExpression(`Number(document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabTick ?? '0') >= 6`, 6000, "fab tick 6");
  await clickButton("Pause fab");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabRunning === 'false'`, 10000, "fab pause");
  const pausedTick = await evaluate(`Number(document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabTick ?? '-1')`);
  await sleep(1100);
  const frozenTick = await evaluate(`Number(document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabTick ?? '-1')`);
  if (pausedTick !== frozenTick) throw new Error(`Chip Fab advanced while paused: ${pausedTick} -> ${frozenTick}`);

  await clickButton("Steady");
  await clickButton("Resume fab");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabEvent === 'metrology-drift'`, 8000, "metrology drift event");
  await clickButton("Focus Metrology");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabFocus === 'metrology'`, 10000, "Metrology focus");
  await clickButton("PM Metrology");

  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabEvent === 'lithography-bottleneck'`, 10000, "lithography bottleneck event");
  await clickButton("Focus Lithography");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabEvent === 'maintenance-risk'`, 10000, "maintenance risk event");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabComplete === 'true'`, 16000, "fab completion");
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Chip Fab result"]'))`, 10000, "Chip Fab result panel");
  await waitForExpression(`Boolean(localStorage.getItem('bgn:chip-fab:best-score'))`, 10000, "persisted Chip Fab best score");

  const finalState = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Chip Fab simulation"]');
    const result = document.querySelector('[aria-label="Chip Fab result"]');
    return {
      tick: section?.dataset.fabTick ?? null,
      complete: section?.dataset.fabComplete ?? null,
      running: section?.dataset.fabRunning ?? null,
      resultText: result?.textContent ?? '',
      frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
    };
  })()`);
  if (finalState.tick !== "32" || finalState.complete !== "true" || finalState.running !== "false") throw new Error(`Chip Fab completion state invalid: ${JSON.stringify(finalState)}`);
  for (const label of ["Final score", "good die", "yield", "ending WIP", "scrap"]) if (!finalState.resultText.toLowerCase().includes(label.toLowerCase())) throw new Error(`Chip Fab result missing ${label}`);
  if (finalState.frameworkError) throw new Error("Framework error UI detected during Chip Fab smoke test");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  await capture("chip-fab-result-desktop.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await capture("chip-fab-result-mobile.png");
  await send("Emulation.clearDeviceMetricsOverride");

  await clickButton("Run another fab");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabTick === '0'`, 10000, "Chip Fab restart tick");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabStartMode === 'steady'`, 10000, "Chip Fab restart start mode");
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab simulation"]')?.dataset.fabComplete === 'false'`, 10000, "Chip Fab restart incomplete state");

  console.log(JSON.stringify({ targetUrl, continuousFlowVerified: true, wipVerified: true, maintenanceVerified: true, crewFocusVerified: true, eventRegimesVerified: true, pauseVerified: true, bestPersisted: true, resultCaptures: 2, restartVerified: true }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) { chrome.kill("SIGTERM"); await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]); }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
