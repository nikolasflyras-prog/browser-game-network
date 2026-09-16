import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.PLAY_BATCH_6_BASE_URL ?? "http://127.0.0.1:3011";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForValue(fn, timeout = 10000) { const deadline = Date.now() + timeout; while (Date.now() < deadline) { const value = await fn().catch(() => null); if (value) return value; await sleep(80); } throw new Error("Timed out waiting for Batch 6 browser state"); }
let chromePath = null;
for (const candidate of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) { const found = spawnSync("which", [candidate], { encoding: "utf8" }); if (found.status === 0 && found.stdout.trim()) { chromePath = found.stdout.trim(); break; } }
if (!chromePath) throw new Error("No Chrome/Chromium binary found on runner");

async function exercise({ slug, title, port, kind }) {
  const url = `${baseUrl}/games/${slug}`;
  const debugBase = `http://127.0.0.1:${port}`;
  const profileDir = await mkdtemp(path.join(os.tmpdir(), `${slug}-batch6-`));
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
    async function key(type, keyValue, code) { await send("Input.dispatchKeyEvent", { type, key: keyValue, code, windowsVirtualKeyCode: keyValue === " " ? 32 : keyValue.startsWith("Arrow") ? ({ ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[keyValue] ?? 0) : keyValue.toUpperCase().charCodeAt(0) }); }
    async function clickButton(label) { const point = await waitForValue(() => evaluate(`(() => { const section = document.querySelector(${JSON.stringify(`section[aria-label="${title} game"]`)}); const button = Array.from(section?.querySelectorAll('button') ?? []).find((node) => node.textContent?.includes(${JSON.stringify(label)})); if (!button) return null; button.scrollIntoView({ block: 'center' }); const rect = button.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 ? { x: rect.left + rect.width/2, y: rect.top + rect.height/2 } : null; })()`)); await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y }); await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 }); }
    const sectionSelector = `section[aria-label="${title} game"]`;
    const mountSelector = `${sectionSelector} .game-canvas-mount`;
    const status = `(document.querySelector(${JSON.stringify(`${sectionSelector} .game-status`)})?.textContent ?? '')`;
    const buttons = `Array.from(document.querySelectorAll(${JSON.stringify(`${sectionSelector} button`)})).map((node) => node.textContent ?? '')`;
    await send("Runtime.enable"); await send("Page.enable");
    await waitForExpression(`Boolean(document.querySelector(${JSON.stringify(`${sectionSelector} canvas`)}))`);
    const initialStatus = await waitForValue(async () => { const value = await evaluate(status); return value && !value.includes("Loading") ? value : null; });
    if (kind === "courier") {
      const initialX = Number(await waitForValue(() => evaluate(`document.querySelector(${JSON.stringify(mountSelector)})?.dataset.courierX`)));
      await key("keyDown", "ArrowRight", "ArrowRight"); await sleep(650); await key("keyUp", "ArrowRight", "ArrowRight");
      await waitForExpression(`Number(document.querySelector(${JSON.stringify(mountSelector)})?.dataset.courierX ?? 0) > ${initialX + 10}`);
    } else {
      const initialX = Number(await waitForValue(() => evaluate(`document.querySelector(${JSON.stringify(mountSelector)})?.dataset.magnetX`)));
      const initialEnergy = Number(await waitForValue(() => evaluate(`document.querySelector(${JSON.stringify(mountSelector)})?.dataset.magnetEnergy`)));
      await key("keyDown", "ArrowRight", "ArrowRight"); await key("keyDown", " ", "Space"); await sleep(650); await key("keyUp", " ", "Space"); await key("keyUp", "ArrowRight", "ArrowRight");
      await waitForExpression(`Number(document.querySelector(${JSON.stringify(mountSelector)})?.dataset.magnetX ?? 0) > ${initialX + 10}`);
      await waitForExpression(`Number(document.querySelector(${JSON.stringify(mountSelector)})?.dataset.magnetEnergy ?? 100) < ${initialEnergy - 2}`);
    }
    await clickButton("Pause"); await waitForExpression(`${status} === 'Paused'`); await waitForExpression(`${buttons}.some((text) => text.includes('Resume'))`);
    await clickButton("Resume"); await waitForExpression(`${status} !== 'Paused'`); await waitForExpression(`${buttons}.some((text) => text.includes('Pause'))`);
    await clickButton("Restart");
    if (kind === "courier") await waitForExpression(`${status}.includes('Courier Loop live')`); else await waitForExpression(`${status}.includes('Magnet Field live')`);
    const finalState = await evaluate(`({ status: ${status}, hasCanvas: Boolean(document.querySelector(${JSON.stringify(`${sectionSelector} canvas`)})), frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error') })`);
    if (!finalState.hasCanvas || finalState.frameworkError) throw new Error(`${title} browser state invalid: ${JSON.stringify(finalState)}`);
    if (runtimeErrors.length) throw new Error(`${title} runtime errors: ${runtimeErrors.join(" | ")}`);
    return { initialStatus, finalState };
  } finally {
    socket?.close(); if (chrome.exitCode === null) { chrome.kill("SIGTERM"); await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]); } await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

const courierLoop = await exercise({ slug: "courier-loop", title: "Courier Loop", port: 9243, kind: "courier" });
const magnetField = await exercise({ slug: "magnet-field", title: "Magnet Field", port: 9244, kind: "magnet" });
console.log(JSON.stringify({ courierLoop, magnetField, realMovementVerified: true, fieldEnergyVerified: true, sharedControlsVerified: true }));
