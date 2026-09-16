import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForValue(fn, timeout = 16000, label = "browser state") {
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

function findChrome() {
  for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    const found = spawnSync("which", [candidate], { encoding: "utf8" });
    if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  }
  throw new Error("No Chrome/Chromium binary found on runner");
}

export async function openSpatialBrowser({ url, port, profilePrefix = "spatial-game-qa" }) {
  const chromePath = findChrome();
  const debugBase = `http://127.0.0.1:${port}`;
  const profileDir = await mkdtemp(path.join(os.tmpdir(), `${profilePrefix}-`));
  const chrome = spawn(chromePath, [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--window-size=1360,980",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    url,
  ], { stdio: "ignore" });

  let socket;
  try {
    await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok, 16000, "Chrome debugging endpoint");
    const page = await waitForValue(async () => {
      const response = await fetch(`${debugBase}/json/list`);
      if (!response.ok) return null;
      return (await response.json()).find((entry) => entry.type === "page");
    }, 16000, "Chrome page target");

    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out opening CDP websocket")), 5000);
      socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open CDP websocket")); }, { once: true });
    });
  } catch (error) {
    if (chrome.exitCode === null) chrome.kill("SIGTERM");
    await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    throw error;
  }

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

  async function waitForExpression(expression, timeout = 14000, label = expression) {
    return waitForValue(() => evaluate(expression), timeout, label);
  }

  const virtualKeys = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
  async function releaseMovementKeys() {
    for (const key of Object.keys(virtualKeys)) {
      await send("Input.dispatchKeyEvent", { type: "keyUp", code: key, key, windowsVirtualKeyCode: virtualKeys[key] });
    }
  }

  async function keyHold(key, ms = 140) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", code: key, key, windowsVirtualKeyCode: virtualKeys[key] });
    await sleep(ms);
    await send("Input.dispatchKeyEvent", { type: "keyUp", code: key, key, windowsVirtualKeyCode: virtualKeys[key] });
    await sleep(95);
  }

  async function pressE() {
    await send("Input.dispatchKeyEvent", { type: "keyDown", code: "KeyE", key: "e", windowsVirtualKeyCode: 69 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", code: "KeyE", key: "e", windowsVirtualKeyCode: 69 });
    await sleep(180);
  }

  async function position(prefix) {
    return evaluate(`(() => { const n=document.querySelector('[data-${prefix}-x]'); return { x:Number(n?.getAttribute('data-${prefix}-x') ?? '0'), y:Number(n?.getAttribute('data-${prefix}-y') ?? '0') }; })()`);
  }

  async function moveAxis(prefix, axis, target, { tolerance = 16, maxSteps = 70 } = {}) {
    let stagnant = 0;
    for (let step = 0; step < maxSteps; step += 1) {
      let current = await position(prefix);
      let value = axis === "x" ? current.x : current.y;
      let diff = target - value;
      if (Math.abs(diff) <= tolerance) {
        await releaseMovementKeys();
        await sleep(170);
        current = await position(prefix);
        value = axis === "x" ? current.x : current.y;
        diff = target - value;
        if (Math.abs(diff) <= tolerance) return current;
      }

      const positive = diff > 0;
      const key = axis === "x" ? (positive ? "ArrowRight" : "ArrowLeft") : (positive ? "ArrowDown" : "ArrowUp");
      const magnitude = Math.abs(diff);
      const holdMs = magnitude > 170 ? 180 : magnitude > 85 ? 125 : 70;
      await keyHold(key, holdMs);
      const next = await position(prefix);
      const nextValue = axis === "x" ? next.x : next.y;
      stagnant = Math.abs(nextValue - value) < 1.2 ? stagnant + 1 : 0;
      if (stagnant >= 3) throw new Error(`${prefix} movement blocked on ${axis} toward ${target}: ${JSON.stringify({ current, next })}`);
    }
    throw new Error(`${prefix} failed to reach ${axis}=${target}: ${JSON.stringify(await position(prefix))}`);
  }

  async function moveTo(prefix, x, y, { order = "xy", tolerance = 16, maxPasses = 5 } = {}) {
    let nextOrder = order;
    for (let pass = 0; pass < maxPasses; pass += 1) {
      if (nextOrder === "xy") {
        await moveAxis(prefix, "x", x, { tolerance });
        await moveAxis(prefix, "y", y, { tolerance });
      } else {
        await moveAxis(prefix, "y", y, { tolerance });
        await moveAxis(prefix, "x", x, { tolerance });
      }
      await releaseMovementKeys();
      await sleep(170);
      const current = await position(prefix);
      if (Math.hypot(current.x - x, current.y - y) <= tolerance * 1.45) return current;
      nextOrder = nextOrder === "xy" ? "yx" : "xy";
    }
    throw new Error(`${prefix} failed to settle at ${x},${y}: ${JSON.stringify(await position(prefix))}`);
  }

  async function clickButton(text) {
    await waitForExpression(`Array.from(document.querySelectorAll('button')).some((button) => button.textContent?.trim() === ${JSON.stringify(text)})`, 12000, `button ${text}`);
    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === ${JSON.stringify(text)})?.click(); true`);
    await sleep(180);
  }

  async function navigate(nextUrl) {
    await send("Page.navigate", { url: nextUrl });
    await waitForExpression(`document.readyState === 'complete'`, 16000, `navigation ${nextUrl}`);
    await sleep(550);
  }

  async function captureScreenshot(filePath) {
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(filePath, Buffer.from(shot.data, "base64"));
  }

  async function setMobile(width = 390, height = 844) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true });
    await sleep(550);
  }

  async function clearMobile() {
    await send("Emulation.clearDeviceMetricsOverride");
    await sleep(350);
  }

  async function close() {
    socket?.close();
    if (chrome.exitCode === null) {
      chrome.kill("SIGTERM");
      await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
    }
    await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }

  await send("Runtime.enable");
  await send("Page.enable");

  return { send, evaluate, waitForExpression, position, moveAxis, moveTo, pressE, clickButton, navigate, captureScreenshot, setMobile, clearMobile, runtimeErrors, close, sleep };
}
