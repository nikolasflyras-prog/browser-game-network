import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.PLAY_BATCH_4_BASE_URL ?? "http://127.0.0.1:3009";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForValue(fn, timeout = 10000) { const deadline = Date.now() + timeout; while (Date.now() < deadline) { const value = await fn().catch(() => null); if (value) return value; await sleep(80); } throw new Error("Timed out waiting for Batch 4 browser state"); }
let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) { const found = spawnSync("which", [candidate], { encoding: "utf8" }); if (found.status === 0 && found.stdout.trim()) { chromePath = found.stdout.trim(); break; } }
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

async function exercise({ slug, title, port, kind }) {
  const url = `${baseUrl}/games/${slug}`;
  const debugBase = `http://127.0.0.1:${port}`;
  const profileDir = await mkdtemp(path.join(os.tmpdir(), `${slug}-batch4-`));
  const chrome = spawn(chromePath, ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--hide-scrollbars", "--window-size=1280,900", `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, url], { stdio: "ignore" });
  let socket;
  try {
    await waitForValue(async () => (await fetch(`${debugBase}/json/version`)).ok);
    const page = await waitForValue(async () => { const response = await fetch(`${debugBase}/json/list`); if (!response.ok) return null; return (await response.json()).find((entry) => entry.type === "page" && entry.url.includes(`/games/${slug}`)); });
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`Timed out opening ${title} websocket`)), 5000); socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true }); socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error(`Failed to open ${title} websocket`)); }, { once: true }); });
    let sequence = 0; const pending = new Map(); const runtimeErrors = [];
    socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); if (message.error) reject(new Error(message.error.message)); else resolve(message.result ?? {}); return; } if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params?.exceptionDetails?.text ?? "Runtime exception"); });
    function send(method, params = {}) { const id = ++sequence; return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); }); }
    async function evaluate(expression) { const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? "Runtime.evaluate failed"); return response.result?.value; }
    async function waitForExpression(expression, timeout = 8000) { return waitForValue(() => evaluate(expression), timeout); }
    async function clickButton(label) { const point = await waitForValue(() => evaluate(`(() => { const section = document.querySelector(${JSON.stringify(`section[aria-label="${title} game"]`)}); const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)})); if (!button) return null; button.scrollIntoView({ block: 'center' }); const rect = button.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 ? { x: rect.left + rect.width/2, y: rect.top + rect.height/2 } : null; })()`)); await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y }); await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 }); }
    async function clickCanvas(xRatio) { const point = await waitForValue(() => evaluate(`(() => { const canvas = document.querySelector(${JSON.stringify(`section[aria-label="${title} game"] canvas`)}); if (!canvas) return null; canvas.scrollIntoView({ block: 'center' }); const rect = canvas.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 ? { x: rect.left + rect.width*${xRatio}, y: rect.top + rect.height*0.55 } : null; })()`)); await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y }); await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 }); }
    const status = `(document.querySelector(${JSON.stringify(`section[aria-label="${title} game"] .game-status`)})?.textContent ?? '')`;
    const buttons = `Array.from(document.querySelectorAll(${JSON.stringify(`section[aria-label="${title} game"] button`)})).map((node) => node.textContent ?? '')`;
    await send("Runtime.enable"); await send("Page.enable");
    await waitForExpression(`Boolean(document.querySelector(${JSON.stringify(`section[aria-label="${title} game"] canvas`)}))`);
    const initial = await waitForValue(async () => { const value = await evaluate(status); return value && !value.includes("Loading") ? value : null; });
    await clickCanvas(kind === "switchyard" ? 0.86 : 0.5);
    await waitForExpression(`${status} !== ${JSON.stringify(initial)}`);
    if (kind === "switchyard") await waitForExpression(`${status}.includes('RIGHT lane')`);
    await clickButton("Pause"); await waitForExpression(`${status} === 'Paused'`); await waitForExpression(`${buttons}.some((text) => text.includes('Resume'))`);
    await clickButton("Resume"); await waitForExpression(`${status} !== 'Paused'`); await waitForExpression(`${buttons}.some((text) => text.includes('Pause'))`);
    await clickButton("Restart");
    if (kind === "stackline") await waitForExpression(`${status}.includes('Stackline live')`); else await waitForExpression(`${status}.includes('Switchyard live')`);
    const finalState = await evaluate(`({ status: ${status}, hasCanvas: Boolean(document.querySelector(${JSON.stringify(`section[aria-label="${title} game"] canvas`)})), frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error') })`);
    if (!finalState.hasCanvas || finalState.frameworkError) throw new Error(`${title} browser state invalid: ${JSON.stringify(finalState)}`);
    if (runtimeErrors.length) throw new Error(`${title} runtime errors: ${runtimeErrors.join(" | ")}`);
    return finalState;
  } finally {
    socket?.close(); if (chrome.exitCode === null) { chrome.kill("SIGTERM"); await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]); } await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

const stackline = await exercise({ slug: "stackline", title: "Stackline", port: 9239, kind: "stackline" });
const switchyard = await exercise({ slug: "switchyard", title: "Switchyard", port: 9240, kind: "switchyard" });
console.log(JSON.stringify({ stackline, switchyard, realCanvasInputVerified: true, sharedControlsVerified: true }));
