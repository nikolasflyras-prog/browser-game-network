import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.FUTURE_GAMES_LAB_URL ?? "http://127.0.0.1:3010/lab/future-games";
const debugBase = "http://127.0.0.1:9229";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForValue(fn, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Supply Chain learning state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "supply-chain-learning-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,960",
  "--remote-debugging-port=9229",
  `--user-data-dir=${profileDir}`,
  targetUrl,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
  const page = await waitForValue(async () => {
    const response = await fetch(`${debugBase}/json/list`);
    if (!response.ok) return null;
    return (await response.json()).find((entry) => entry.type === "page" && entry.url.includes("/lab/future-games"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening Supply Chain QA websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Supply Chain QA websocket")); }, { once: true });
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
    } else if (message.method === "Runtime.exceptionThrown") {
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
    const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? "Runtime.evaluate failed");
    return response.result?.value;
  }

  async function waitForExpression(expression, timeout = 8000) {
    return waitForValue(() => evaluate(expression), timeout);
  }

  async function activate() {
    const clicked = await evaluate(`(() => {
      const button = Array.from(document.querySelectorAll('nav button')).find((node) => node.textContent?.includes('Supply Chain Shock'));
      button?.click();
      return Boolean(button);
    })()`);
    if (!clicked) throw new Error("Supply Chain Shock tab missing");
    await waitForExpression(`Boolean(document.querySelector('section[aria-label="Supply Chain Shock staged prototype"]'))`);
  }

  async function clickChoice(label) {
    const clicked = await evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Supply Chain Shock staged prototype"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}));
      if (!button || button.getAttribute('aria-disabled') === 'true') return false;
      button.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`Supply Chain choice unavailable: ${label}`);
    await sleep(80);
  }

  async function capability(name) {
    return evaluate(`(() => {
      const node = document.querySelector('[data-supply-capability=${JSON.stringify(name)}]');
      return { status: node?.getAttribute('data-status') ?? null, text: node?.textContent ?? '' };
    })()`);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await activate();

  await clickChoice("Qualify a second supplier");
  const preparedCapacity = await capability("alternate-capacity");
  if (preparedCapacity.status !== "ready" || !preparedCapacity.text.includes("READY")) {
    throw new Error(`Alternate capacity did not become ready: ${JSON.stringify(preparedCapacity)}`);
  }
  const preparedContext = await evaluate(`document.querySelector('[data-supply-context]')?.textContent ?? ''`);
  if (!preparedContext.includes("capabilities")) throw new Error(`Supply Chain preparedness context missing: ${preparedContext}`);

  await clickChoice("Prioritize key customers");
  await clickChoice("Cap new orders");
  const backupAvailability = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Supply Chain Shock staged prototype"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Activate alternate capacity'));
    return button ? button.getAttribute('aria-disabled') : null;
  })()`);
  if (backupAvailability === null || backupAvailability === "true") throw new Error("Prepared path failed to unlock alternate capacity");
  await clickChoice("Activate alternate capacity");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock staged prototype"]')?.textContent?.includes('Operating style')`);

  const restarted = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Supply Chain Shock staged prototype"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.trim() === 'Run again');
    button?.click();
    return Boolean(button);
  })()`);
  if (!restarted) throw new Error("Supply Chain restart control missing");
  await waitForExpression(`document.querySelector('section[aria-label="Supply Chain Shock staged prototype"]')?.textContent?.includes('Supplier warning')`);

  await clickChoice("Wait for evidence");
  const unpreparedCapacity = await capability("alternate-capacity");
  if (unpreparedCapacity.status !== "pending" || !unpreparedCapacity.text.includes("NOT READY")) {
    throw new Error(`Unprepared path incorrectly shows alternate capacity: ${JSON.stringify(unpreparedCapacity)}`);
  }
  await clickChoice("Prioritize key customers");
  await clickChoice("Cap new orders");
  const blocked = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Supply Chain Shock staged prototype"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes('Activate alternate capacity'));
    return { disabled: button?.getAttribute('aria-disabled') ?? null, text: button?.textContent ?? '' };
  })()`);
  if (blocked.disabled !== "true" || !blocked.text.includes("do not have enough qualified alternate capacity")) {
    throw new Error(`Unprepared path did not explain locked backup capacity: ${JSON.stringify(blocked)}`);
  }

  const history = await evaluate(`(document.querySelector('[data-lab-event-history]')?.getAttribute('data-lab-event-history') ?? '').split(',').filter(Boolean)`);
  if (!history.includes("game_restarted") || history.filter((event) => event === "level_completed").length < 7) {
    throw new Error(`Supply Chain analytics lifecycle incomplete: ${history.join(",")}`);
  }
  if (runtimeErrors.length) throw new Error(`Runtime errors detected during Supply Chain learning QA: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    preparedPathUnlockedBackup: true,
    unpreparedPathBlockedBackup: true,
    preparednessCuesVerified: true,
  }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
