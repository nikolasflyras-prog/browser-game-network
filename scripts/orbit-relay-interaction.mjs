import fs from "node:fs";

const debugBase = process.env.CDP_URL ?? "http://127.0.0.1:9222";
const screenshotPath = process.argv[2] ?? "artifacts/browser/orbit-relay-interaction.png";
const targetUrl = process.env.ORBIT_RELAY_URL ?? "http://127.0.0.1:3000/games/orbit-relay";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForValue(fn, { timeout = 7000, interval = 80, label = "condition" } = {}) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(interval);
  }
  throw new Error(`Timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ""}`);
}

const page = await waitForValue(async () => {
  const response = await fetch(`${debugBase}/json/list`);
  if (!response.ok) return null;
  const pages = await response.json();
  return pages.find((entry) => entry.type === "page" && entry.url.includes("/games/orbit-relay"));
}, { timeout: 10000, label: "Orbit Relay CDP page" });

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("Timed out opening CDP websocket")), 5000);
  socket.addEventListener("open", () => {
    clearTimeout(timer);
    resolve();
  }, { once: true });
  socket.addEventListener("error", () => {
    clearTimeout(timer);
    reject(new Error("Failed to open CDP websocket"));
  }, { once: true });
});

let sequence = 0;
const pending = new Map();
const runtimeErrors = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
    else resolve(message.result ?? {});
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    runtimeErrors.push(message.params?.exceptionDetails?.text ?? "Runtime exception");
  }
  if (message.method === "Log.entryAdded" && ["error", "warning"].includes(message.params?.entry?.level)) {
    runtimeErrors.push(`${message.params.entry.level}: ${message.params.entry.text}`);
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
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
  return result.result?.value;
}

async function waitForExpression(expression, label, timeout = 7000) {
  return waitForValue(() => evaluate(expression), { timeout, label });
}

async function pressSpace() {
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: " ",
    code: "Space",
    text: " ",
    unmodifiedText: " ",
    windowsVirtualKeyCode: 32,
    nativeVirtualKeyCode: 32,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
    nativeVirtualKeyCode: 32,
  });
}

async function clickButton(text) {
  const clicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent.trim() === ${JSON.stringify(text)});
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Could not find button: ${text}`);
}

async function canvasCenter() {
  return evaluate(`(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
}

async function launchWithPointer() {
  const point = await canvasCenter();
  if (!point) throw new Error("Canvas missing for pointer launch");
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
}

async function launchWithTouch() {
  const point = await canvasCenter();
  if (!point) throw new Error("Canvas missing for touch launch");
  const touchPoint = { x: point.x, y: point.y, radiusX: 2, radiusY: 2, force: 1, id: 1 };
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [touchPoint] });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");

await waitForExpression(
  `document.querySelector('canvas') && document.querySelector('.game-status')?.textContent.includes('Orbiting')`,
  "initial playable Orbit Relay state",
);

const initial = await evaluate(`({
  status: document.querySelector('.game-status')?.textContent,
  buttons: [...document.querySelectorAll('.control-button')].map((button) => button.textContent.trim()),
  hasCanvas: Boolean(document.querySelector('canvas')),
})`);

if (!initial.hasCanvas || !initial.buttons.includes("Pause") || !initial.buttons.includes("Restart") || !initial.buttons.includes("Sound on")) {
  throw new Error(`Initial controls are incomplete: ${JSON.stringify(initial)}`);
}

// Keyboard: launch into a deterministic miss, then retry from game over.
await pressSpace();
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('in flight')`, "keyboard launch state", 2500);
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('Run over')`, "keyboard miss/game-over", 5000);
await pressSpace();
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('Orbiting')`, "keyboard restart");

// Shared UI controls must remain synchronized with the Phaser runtime.
await clickButton("Pause");
await waitForExpression(`document.querySelector('.game-status')?.textContent === 'Paused' && [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Resume')`, "pause state");
await clickButton("Resume");
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('resumed') && [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Pause')`, "resume state");
await clickButton("Sound on");
await waitForExpression(`[...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Sound off')`, "sound-off state");
await clickButton("Sound off");
await waitForExpression(`[...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Sound on')`, "sound-on state");
await clickButton("Restart");
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('Orbiting')`, "toolbar restart");

// Pointer input: launch, observe flight, miss, then reset.
await launchWithPointer();
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('in flight')`, "pointer launch state", 2500);
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('Run over')`, "pointer miss/game-over", 5000);
await pressSpace();
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('Orbiting')`, "post-pointer restart");

// Touch input: dispatch a real CDP touch gesture at the canvas.
await launchWithTouch();
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('in flight')`, "touch launch state", 2500);
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('Run over')`, "touch miss/game-over", 5000);
await pressSpace();
await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('Orbiting')`, "post-touch restart");

const persisted = await evaluate(`localStorage.getItem('bgn:orbit-relay:high-score')`);
if (!persisted) throw new Error("Orbit Relay did not write its versioned local high-score record after game over");

const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
fs.mkdirSync(new URL(".", `file://${screenshotPath}`).pathname, { recursive: true });
fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));

if (runtimeErrors.length) {
  throw new Error(`Browser runtime errors detected: ${runtimeErrors.join(" | ")}`);
}

const finalState = await evaluate(`({
  status: document.querySelector('.game-status')?.textContent,
  buttons: [...document.querySelectorAll('.control-button')].map((button) => button.textContent.trim()),
  storage: localStorage.getItem('bgn:orbit-relay:high-score'),
})`);

console.log(JSON.stringify({
  targetUrl,
  checks: [
    "keyboard launch → miss → game-over → restart",
    "pause → resume",
    "sound off → on",
    "toolbar restart",
    "pointer launch → miss → restart",
    "touch launch → miss → restart",
    "versioned local high-score persistence",
    "no browser runtime errors",
  ],
  initial,
  finalState,
}, null, 2));

socket.close();
