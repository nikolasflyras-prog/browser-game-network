import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const targetUrl = process.env.LINEBREAK_URL ?? "http://127.0.0.1:3000/games/linebreak-daily";
const debugBase = "http://127.0.0.1:9224";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const response = await fetch(targetUrl);
if (!response.ok) throw new Error(`Linebreak route returned ${response.status}`);
const html = await response.text();
if (!html.includes("Linebreak Daily")) throw new Error("Linebreak title missing");
if (!html.includes("How to play")) throw new Error("Linebreak instructions missing");

function offsetDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const puzzles = [
  { id: "switchback", width: 6, height: 6, start: [0, 2], exit: [5, 2], key: [2, 1], gate: [4, 2], hazards: [[1, 2], [2, 2], [4, 1], [4, 3], [5, 3]], inkLimit: 8 },
  { id: "northbound", width: 6, height: 6, start: [0, 4], exit: [5, 0], key: [1, 2], gate: [3, 1], hazards: [[1, 4], [2, 3], [3, 2], [3, 0], [5, 1]], inkLimit: 10 },
  { id: "dogleg", width: 6, height: 6, start: [1, 5], exit: [5, 1], key: [3, 4], gate: [4, 2], hazards: [[1, 4], [3, 5], [4, 4], [3, 2], [5, 2]], inkLimit: 9 },
  { id: "reverse-line", width: 6, height: 6, start: [5, 5], exit: [0, 1], key: [4, 3], gate: [2, 2], hazards: [[4, 5], [5, 3], [2, 3], [2, 1], [0, 2]], inkLimit: 10 },
  { id: "long-turn", width: 6, height: 6, start: [0, 0], exit: [5, 5], key: [2, 2], gate: [3, 4], hazards: [[0, 1], [2, 0], [3, 2], [4, 3], [5, 4]], inkLimit: 11 },
];

function same(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function puzzleForDateKey(dateKey) {
  let hash = 2166136261;
  for (const character of dateKey) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return puzzles[(hash >>> 0) % puzzles.length];
}

function solvePuzzle(puzzle) {
  const hazardKeys = new Set(puzzle.hazards.map(([x, y]) => `${x},${y}`));
  const queue = [{
    path: [puzzle.start],
    hasKey: same(puzzle.start, puzzle.key),
    passedGate: false,
  }];

  while (queue.length) {
    const state = queue.shift();
    const current = state.path[state.path.length - 1];
    if (state.passedGate && same(current, puzzle.exit)) return state.path;
    if (state.path.length - 1 >= puzzle.inkLimit) continue;

    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = [current[0] + dx, current[1] + dy];
      if (next[0] < 0 || next[1] < 0 || next[0] >= puzzle.width || next[1] >= puzzle.height) continue;
      if (hazardKeys.has(`${next[0]},${next[1]}`)) continue;
      if (state.path.some((cell) => same(cell, next))) continue;
      if (same(next, puzzle.gate) && !state.hasKey) continue;
      if (same(next, puzzle.exit) && !state.passedGate && !same(next, puzzle.gate)) continue;

      const hasKey = state.hasKey || same(next, puzzle.key);
      const passedGate = state.passedGate || (same(next, puzzle.gate) && state.hasKey);
      queue.push({ path: [...state.path, next], hasKey, passedGate });
    }
  }

  throw new Error(`No solution found for ${puzzle.id}`);
}

async function waitForValue(fn, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(100);
  }
  throw new Error("Timed out waiting for browser state");
}

let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
  const result = spawnSync("which", [candidate], { encoding: "utf8" });
  if (result.status === 0 && result.stdout.trim()) {
    chromePath = result.stdout.trim();
    break;
  }
}
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

const profileDir = await mkdtemp(path.join(os.tmpdir(), "linebreak-smoke-"));
const chrome = spawn(chromePath, [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--window-size=1280,900",
  "--remote-debugging-port=9224",
  `--user-data-dir=${profileDir}`,
  targetUrl,
], { stdio: "ignore" });

let socket;
try {
  await waitForValue(async () => {
    const result = await fetch(`${debugBase}/json/version`);
    return result.ok;
  });

  const page = await waitForValue(async () => {
    const result = await fetch(`${debugBase}/json/list`);
    if (!result.ok) return null;
    const pages = await result.json();
    return pages.find((entry) => entry.type === "page" && entry.url.includes("/games/linebreak-daily"));
  });

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out opening CDP websocket")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Failed to open CDP websocket")); }, { once: true });
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
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
    return result.result?.value;
  }

  async function waitForExpression(expression, timeout = 8000) {
    return waitForValue(() => evaluate(expression), timeout);
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await waitForExpression(`Boolean(document.querySelector('.game-canvas-mount canvas'))`);

  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterdayKey = offsetDateKey(todayKey, -1);
  const twoDaysAgoKey = offsetDateKey(todayKey, -2);
  const seedRecord = (dateKey) => JSON.stringify({
    version: 1,
    value: { puzzleId: "seed", segments: 7, completedAt: `${dateKey}T12:00:00.000Z` },
  });

  await evaluate(`(() => {
    localStorage.clear();
    localStorage.setItem(${JSON.stringify(`bgn:linebreak-daily:daily-${twoDaysAgoKey}`)}, ${JSON.stringify(seedRecord(twoDaysAgoKey))});
    localStorage.setItem(${JSON.stringify(`bgn:linebreak-daily:daily-${yesterdayKey}`)}, ${JSON.stringify(seedRecord(yesterdayKey))});
    location.reload();
    return true;
  })()`);

  await waitForExpression(`Boolean(document.querySelector('.game-canvas-mount canvas') && document.querySelector('[data-linebreak-streak]')?.textContent === '2')`, 10000);

  const puzzle = puzzleForDateKey(todayKey);
  const solution = solvePuzzle(puzzle);
  await evaluate(`(() => {
    const canvas = document.querySelector('.game-canvas-mount canvas');
    canvas.scrollIntoView({ block: 'center' });
    return true;
  })()`);
  await sleep(150);

  const refreshedRect = await evaluate(`(() => {
    const r = document.querySelector('.game-canvas-mount canvas').getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  })()`);
  const cellSize = Math.max(40, Math.min(82, (refreshedRect.width - 72) / puzzle.width, (refreshedRect.height - 150) / puzzle.height));
  const originX = (refreshedRect.width - cellSize * puzzle.width) / 2;
  const originY = Math.max(58, (refreshedRect.height - cellSize * puzzle.height) / 2);

  for (const [x, y] of solution.slice(1)) {
    const pointX = refreshedRect.left + originX + (x + 0.5) * cellSize;
    const pointY = refreshedRect.top + originY + (y + 0.5) * cellSize;
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: pointX, y: pointY, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pointX, y: pointY, button: "left", clickCount: 1 });
    await sleep(70);
  }

  await waitForExpression(`document.querySelector('[data-linebreak-complete]')?.getAttribute('data-linebreak-complete') === 'true'`, 10000);
  await waitForExpression(`document.querySelector('[data-linebreak-streak]')?.textContent === '3'`, 5000);
  await waitForExpression(`Boolean(document.querySelector('[data-linebreak-share]'))`, 5000);

  const clickedShare = await evaluate(`(() => {
    const button = document.querySelector('[data-linebreak-share]');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clickedShare) throw new Error("Linebreak share button could not be clicked");
  await sleep(300);

  const finalState = await evaluate(`({
    status: document.querySelector('.game-status')?.textContent,
    streak: document.querySelector('[data-linebreak-streak]')?.textContent,
    today: document.querySelector('[data-linebreak-today]')?.textContent,
    shareLabel: document.querySelector('[data-linebreak-share]')?.textContent?.trim(),
    todayStorage: localStorage.getItem(${JSON.stringify(`bgn:linebreak-daily:daily-${todayKey}`)}),
    frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
  })`);

  if (!finalState.status?.includes("Daily complete")) throw new Error(`Linebreak did not complete: ${JSON.stringify(finalState)}`);
  if (finalState.streak !== "3") throw new Error(`Expected a 3-day streak: ${JSON.stringify(finalState)}`);
  if (!finalState.todayStorage) throw new Error("Today's Linebreak result was not persisted");
  if (!["Copied", "Shared"].includes(finalState.shareLabel)) throw new Error(`Share action did not finish: ${JSON.stringify(finalState)}`);
  if (finalState.frameworkError) throw new Error("Framework error UI detected");
  if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({ targetUrl, puzzle: puzzle.id, solutionLength: solution.length - 1, finalState }));
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => chrome.once("exit", resolve)),
      sleep(1500),
    ]);
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
