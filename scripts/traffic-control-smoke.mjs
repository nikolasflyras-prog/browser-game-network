import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.TRAFFIC_CONTROL_URL ?? "http://127.0.0.1:3007/games/traffic-control";
const artifactDir = process.env.TRAFFIC_CONTROL_ARTIFACT_DIR ?? "artifacts/browser";
const debugBase = "http://127.0.0.1:9235";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(artifactDir, { recursive: true });

async function waitForValue(fn, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Traffic Control browser state");
}

let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
  const found = spawnSync("which", [candidate], { encoding: "utf8" });
  if (found.status === 0 && found.stdout.trim()) { chromePath = found.stdout.trim(); break; }
}
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

const profileDir = await mkdtemp(path.join(os.tmpdir(), "traffic-control-public-"));
const chrome = spawn(chromePath, [
  "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars",
  "--window-size=1280,900", "--remote-debugging-port=9235", `--user-data-dir=${profileDir}`, targetUrl,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const response = await fetch(`${debugBase}/json/list`);
    if (!response.ok) return null;
    return (await response.json()).find((entry) => entry.type === "page" && entry.url.includes("/games/traffic-control"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening Traffic Control CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Traffic Control CDP websocket")); }, { once: true });
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

  async function waitForExpression(expression, timeout = 10000) {
    return waitForValue(() => evaluate(expression), timeout);
  }

  async function canvasPoint() {
    return waitForValue(() => evaluate(`(() => {
      const canvas = document.querySelector('section[aria-label="Traffic Control game"] canvas');
      if (!canvas) return null;
      canvas.scrollIntoView({ block: 'center', inline: 'center' });
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: rect.width, height: rect.height };
    })()`));
  }

  async function pointerTap() {
    const point = await canvasPoint();
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
    return point;
  }

  async function pressSpace() {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 });
  }

  async function clickToolbar(text) {
    const ok = await evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Traffic Control game"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.trim() === ${JSON.stringify(text)});
      if (!button || button.disabled) return false;
      button.click();
      return true;
    })()`);
    if (!ok) throw new Error(`Traffic Control toolbar control missing: ${text}`);
  }

  async function capture(name) {
    await evaluate(`document.querySelector('section[aria-label="Traffic Control game"]')?.scrollIntoView({ block: 'start' }); true`);
    await sleep(120);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(path.join(artifactDir, name), Buffer.from(shot.data, "base64"));
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('section[aria-label="Traffic Control game"] canvas'))`, 12000);
  await waitForExpression(`document.querySelector('.game-status')?.textContent?.includes('Keep both approaches moving')`, 12000);
  await evaluate(`localStorage.removeItem('bgn:traffic-control:high-score'); true`);

  const initialPoint = await canvasPoint();
  if (initialPoint.width < 250 || initialPoint.height < 250) throw new Error(`Traffic Control playfield too small: ${JSON.stringify(initialPoint)}`);
  await capture("traffic-control-active-desktop.png");

  await pointerTap();
  await waitForExpression(`document.querySelector('.game-status')?.textContent === 'Signal change requested'`);

  await clickToolbar("Pause");
  await waitForExpression(`document.querySelector('.game-status')?.textContent === 'Paused'`);
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Resume')`);
  await clickToolbar("Resume");
  await waitForExpression(`document.querySelector('.game-status')?.textContent === 'Traffic Control resumed'`);

  await clickToolbar("Sound on");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Sound off')`);
  await clickToolbar("Sound off");
  await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Sound on')`);

  await clickToolbar("Restart");
  await waitForExpression(`document.querySelector('.game-status')?.textContent?.includes('Keep both approaches moving')`);

  await waitForExpression(`document.querySelector('.game-status')?.textContent?.startsWith('Gridlock')`, 20000);
  const storedBest = await evaluate(`localStorage.getItem('bgn:traffic-control:high-score')`);
  if (!storedBest) throw new Error("Traffic Control did not persist a high score after gridlock");
  const parsedBest = JSON.parse(storedBest);
  if (parsedBest?.version !== 1 || typeof parsedBest?.value !== "number" || parsedBest.value <= 0) {
    throw new Error(`Unexpected Traffic Control high-score record: ${storedBest}`);
  }

  await capture("traffic-control-gridlock-desktop.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await capture("traffic-control-gridlock-mobile.png");
  const mobileCanvas = await canvasPoint();
  if (mobileCanvas.width > 390 || mobileCanvas.width < 250) throw new Error(`Traffic Control mobile canvas width is invalid: ${JSON.stringify(mobileCanvas)}`);
  await send("Emulation.clearDeviceMetricsOverride");

  await pointerTap();
  await waitForExpression(`document.querySelector('.game-status')?.textContent?.includes('Keep both approaches moving')`);
  await pressSpace();
  await waitForExpression(`document.querySelector('.game-status')?.textContent === 'Signal change requested'`);

  const finalState = await evaluate(`({
    status: document.querySelector('.game-status')?.textContent ?? '',
    hasCanvas: Boolean(document.querySelector('section[aria-label="Traffic Control game"] canvas')),
    storage: localStorage.getItem('bgn:traffic-control:high-score'),
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
  })`);
  if (!finalState.hasCanvas || finalState.frameworkError) throw new Error(`Traffic Control final browser state invalid: ${JSON.stringify(finalState)}`);
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    pointerSwitchVerified: true,
    keyboardSwitchVerified: true,
    pauseResumeVerified: true,
    soundToggleVerified: true,
    toolbarRestartVerified: true,
    gridlockVerified: true,
    highScorePersisted: true,
    screenshots: 3,
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
