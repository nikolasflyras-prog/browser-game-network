import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.SEMI_VC_URL ?? "http://127.0.0.1:3012/games/semiconductor-vc";
const artifactDir = process.env.SEMI_VC_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9232";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(artifactDir, { recursive: true });

const response = await fetch(targetUrl);
if (!response.ok) throw new Error(`Semiconductor VC route returned ${response.status}`);
const html = await response.text();
if (!html.includes("Sand Hill VC")) throw new Error("Sand Hill VC title missing");
if (!html.includes("Foundry concentration")) throw new Error("Semiconductor VC learning guide missing");

async function waitForValue(fn, timeout = 16000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Semiconductor VC browser state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "semiconductor-vc-smoke-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1360,980",
  "--remote-debugging-port=9232",
  `--user-data-dir=${profileDir}`,
  targetUrl,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const result = await fetch(`${debugBase}/json/list`);
    if (!result.ok) return null;
    return (await result.json()).find((entry) => entry.type === "page" && entry.url.includes("/games/semiconductor-vc"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening Semiconductor VC CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Semiconductor VC CDP websocket")); }, { once: true });
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

  async function waitForExpression(expression, timeout = 12000) {
    return waitForValue(() => evaluate(expression), timeout);
  }

  async function keyHold(code, key, ms) {
    const virtualKeys = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
    await send("Input.dispatchKeyEvent", { type: "keyDown", code, key, windowsVirtualKeyCode: virtualKeys[key] ?? key.charCodeAt(0) });
    await sleep(ms);
    await send("Input.dispatchKeyEvent", { type: "keyUp", code, key, windowsVirtualKeyCode: virtualKeys[key] ?? key.charCodeAt(0) });
    await sleep(180);
  }

  async function pressE() {
    await send("Input.dispatchKeyEvent", { type: "keyDown", code: "KeyE", key: "e", windowsVirtualKeyCode: 69 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", code: "KeyE", key: "e", windowsVirtualKeyCode: 69 });
    await sleep(180);
  }

  async function clickButton(text) {
    await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === ${JSON.stringify(text)})`);
    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === ${JSON.stringify(text)})?.click(); true`);
    await sleep(180);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Sand Hill VC game"] canvas'))`);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Sand Hill VC game"] .game-status')?.textContent?.includes('Semiconductor VC office'))`);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Sand Hill VC game"] [data-semi-x]'))`);

  const startX = await evaluate(`Number(document.querySelector('[data-semi-x]')?.dataset.semiX ?? '0')`);
  await keyHold("ArrowLeft", "ArrowLeft", 1680);
  const founderX = await evaluate(`Number(document.querySelector('[data-semi-x]')?.dataset.semiX ?? '0')`);
  if (!(founderX < startX - 250)) throw new Error(`Dealer did not move across office: ${startX} -> ${founderX}`);

  await pressE();
  await waitForExpression(`document.querySelector('[data-semi-active]')?.dataset.semiActive === 'latchwave'`);

  await keyHold("ArrowRight", "ArrowRight", 1040);
  await pressE();
  await waitForExpression(`document.querySelector('[data-semi-diligenced]')?.dataset.semiDiligenced === 'true'`);

  await keyHold("ArrowRight", "ArrowRight", 1430);
  await pressE();
  await waitForExpression(`Number(document.querySelector('[data-semi-investments]')?.dataset.semiInvestments ?? '0') >= 1`);
  await waitForExpression(`Number(document.querySelector('[data-semi-holdings]')?.dataset.semiHoldings ?? '0') >= 1`);
  await waitForExpression(`document.querySelector('[data-semi-active]')?.dataset.semiActive === ''`);

  await clickButton("Pause");
  await waitForExpression(`document.querySelector('.game-status')?.textContent?.trim() === 'Paused'`);
  await clickButton("Resume");
  await waitForExpression(`document.querySelector('.game-status')?.textContent?.includes('resumed')`);

  const desktopShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifactDir, "semiconductor-vc-desktop.png"), Buffer.from(desktopShot.data, "base64"));

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(500);
  await waitForExpression(`Boolean(document.querySelector('[aria-label="Sand Hill VC game"] canvas'))`);
  const mobileShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(path.join(artifactDir, "semiconductor-vc-mobile.png"), Buffer.from(mobileShot.data, "base64"));

  await clickButton("Restart");
  await waitForExpression(`document.querySelector('[data-semi-active]')?.dataset.semiActive === ''`);
  await waitForExpression(`document.querySelector('[data-semi-investments]')?.dataset.semiInvestments === '0'`);

  const finalState = await evaluate(`(() => ({
    canvas: Boolean(document.querySelector('[aria-label="Sand Hill VC game"] canvas')),
    mode: document.querySelector('[data-semi-mode]')?.dataset.semiMode ?? null,
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error')
  }))()`);
  if (!finalState.canvas || finalState.frameworkError) throw new Error(`Semiconductor VC runtime invalid: ${JSON.stringify(finalState)}`);
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    realMovementVerified: true,
    founderMeetingVerified: true,
    diligenceRouteVerified: true,
    investmentCommitteeVerified: true,
    pauseResumeVerified: true,
    desktopMobileCaptured: true,
    restartVerified: true,
  }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
