const debugBase = process.env.CDP_URL ?? "http://127.0.0.1:9222";
const targetUrl = process.env.ORBIT_RELAY_URL ?? "http://127.0.0.1:3000/games/orbit-relay";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForValue(fn, { timeout = 7000, interval = 60, label = "condition" } = {}) {
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
  socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
  socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open CDP websocket")); }, { once: true });
});

let sequence = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
  else resolve(message.result ?? {});
});

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
    type: "keyDown", key: " ", code: "Space", text: " ", unmodifiedText: " ", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32,
  });
}

async function clickRestart() {
  const clicked = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent.trim() === 'Restart');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error("Restart button not found");
  await waitForExpression(`document.querySelector('.game-status')?.textContent.includes('Orbiting')`, "restart to orbiting state");
}

await send("Runtime.enable");
await waitForExpression(
  `document.querySelector('canvas') && document.querySelector('.game-status')?.textContent.includes('Orbiting')`,
  "playable Orbit Relay state",
);

// With the fixed 1280x900 CI viewport, the opening relay is deterministic. The useful
// launch window is roughly 2.8–2.87s after reset. Sweep a few nearby timings so normal
// CI scheduling jitter does not make the test flaky. Every launch still goes through the
// real keyboard input path and the real Phaser collision code.
const launchDelays = [2790, 2810, 2830, 2850, 2870, 2890];
let captured = null;
const attempts = [];

for (const delay of launchDelays) {
  await clickRestart();
  await sleep(delay);
  await pressSpace();
  await waitForExpression(
    `(() => {
      const text = document.querySelector('.game-status')?.textContent ?? '';
      return text.includes('captured') || text.includes('Run over');
    })()`,
    `capture result at ${delay}ms`,
    5000,
  );

  const state = await evaluate(`({
    status: document.querySelector('.game-status')?.textContent ?? '',
    storage: localStorage.getItem('bgn:orbit-relay:high-score'),
  })`);
  attempts.push({ delay, ...state });

  if (state.status.includes("captured")) {
    const parsed = state.storage ? JSON.parse(state.storage) : null;
    if (!parsed || parsed.version !== 1 || typeof parsed.value !== "number" || parsed.value <= 0) {
      throw new Error(`Relay capture did not persist a positive score: ${JSON.stringify(state)}`);
    }
    captured = { delay, status: state.status, score: parsed.value };
    break;
  }
}

if (!captured) {
  throw new Error(`Could not produce a successful opening relay capture. Attempts: ${JSON.stringify(attempts)}`);
}

console.log(JSON.stringify({
  targetUrl,
  check: "real keyboard launch → Phaser collision → relay capture → positive persisted score",
  captured,
  attempts,
}, null, 2));

socket.close();
