import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.FUTURE_GAMES_LAB_URL ?? "http://127.0.0.1:3010/lab/future-games";
const debugBase = "http://127.0.0.1:9230";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForValue(fn, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("Timed out waiting for Chip Fab learning state");
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

const profileDir = await mkdtemp(path.join(os.tmpdir(), "chip-fab-learning-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,960",
  "--remote-debugging-port=9230",
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
    const timer = setTimeout(() => reject(new Error("Timed out opening Chip Fab QA websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open Chip Fab QA websocket")); }, { once: true });
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
      const button = Array.from(document.querySelectorAll('nav button')).find((node) => node.textContent?.includes('Chip Fab'));
      button?.click();
      return Boolean(button);
    })()`);
    if (!clicked) throw new Error("Chip Fab tab missing");
    await waitForExpression(`Boolean(document.querySelector('section[aria-label="Chip Fab staged prototype"]'))`);
  }

  async function clickChoice(label) {
    const clicked = await evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Chip Fab staged prototype"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)}));
      if (!button || button.getAttribute('aria-disabled') === 'true') return false;
      button.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`Chip Fab choice unavailable: ${label}`);
    await sleep(80);
  }

  async function readSignal(name) {
    return evaluate(`(() => {
      const node = document.querySelector('[data-fab-signal=${JSON.stringify(name)}]');
      return { state: node?.getAttribute('data-state') ?? null, text: node?.textContent ?? '' };
    })()`);
  }

  async function runToBottleneck() {
    await clickChoice("Controlled ramp");
    await clickChoice("Increase sampling");
    await waitForExpression(`document.querySelector('section[aria-label="Chip Fab staged prototype"]')?.textContent?.includes('Lithography bottleneck')`);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await activate();

  const initialOutput = await readSignal("good-output");
  if (!initialOutput.text.includes("30")) throw new Error(`Unexpected initial good-output signal: ${JSON.stringify(initialOutput)}`);

  await runToBottleneck();
  const bottleneckContext = await evaluate(`document.querySelector('[data-fab-context]')?.textContent ?? ''`);
  if (!bottleneckContext.includes("utilization is not the same as fab output")) {
    throw new Error(`Chip Fab bottleneck lesson missing: ${bottleneckContext}`);
  }

  await clickChoice("Run flat-out");
  const flatOutput = await readSignal("good-output");
  const flatCongestion = await readSignal("congestion");
  const flatRisk = await readSignal("process-risk");
  if (!flatOutput.text.includes("41")) throw new Error(`Unexpected flat-out good output: ${JSON.stringify(flatOutput)}`);
  if (flatCongestion.state !== "high" || !flatCongestion.text.includes("HIGH")) {
    throw new Error(`Run-flat-out did not surface high cycle-time pressure: ${JSON.stringify(flatCongestion)}`);
  }
  if (flatRisk.state !== "watch") throw new Error(`Unexpected flat-out process risk: ${JSON.stringify(flatRisk)}`);

  const restarted = await evaluate(`(() => {
    const section = document.querySelector('section[aria-label="Chip Fab staged prototype"]');
    const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.trim() === 'Run again');
    if (button) { button.click(); return true; }
    const choices = Array.from(section?.querySelectorAll('button') ?? []);
    return false;
  })()`);

  if (!restarted) {
    await clickChoice("Shorten maintenance");
    const completedRestart = await evaluate(`(() => {
      const section = document.querySelector('section[aria-label="Chip Fab staged prototype"]');
      const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.trim() === 'Run again');
      button?.click();
      return Boolean(button);
    })()`);
    if (!completedRestart) throw new Error("Chip Fab restart control missing");
  }
  await waitForExpression(`document.querySelector('section[aria-label="Chip Fab staged prototype"]')?.textContent?.includes('Ramp pressure')`);

  await runToBottleneck();
  await clickChoice("Improve scheduling");
  const scheduledOutput = await readSignal("good-output");
  const scheduledCongestion = await readSignal("congestion");
  if (!scheduledOutput.text.includes("47")) throw new Error(`Unexpected scheduling good output: ${JSON.stringify(scheduledOutput)}`);
  if (scheduledCongestion.state !== "controlled" || !scheduledCongestion.text.includes("CONTROLLED")) {
    throw new Error(`Scheduling did not reduce cycle-time pressure: ${JSON.stringify(scheduledCongestion)}`);
  }

  const history = await evaluate(`(document.querySelector('[data-lab-event-history]')?.getAttribute('data-lab-event-history') ?? '').split(',').filter(Boolean)`);
  if (!history.includes("game_restarted") || history.filter((event) => event === "level_completed").length < 6) {
    throw new Error(`Chip Fab analytics lifecycle incomplete: ${history.join(",")}`);
  }
  if (runtimeErrors.length) throw new Error(`Runtime errors detected during Chip Fab learning QA: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({
    targetUrl,
    flatOut: { goodOutput: 41, congestion: "high", processRisk: "watch" },
    improveScheduling: { goodOutput: 47, congestion: "controlled" },
    utilizationLessonVerified: true,
  }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
