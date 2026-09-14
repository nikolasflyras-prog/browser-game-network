const debugBase = process.env.CDP_URL ?? "http://127.0.0.1:9223";
const targetUrl = process.env.RUN_THE_FED_URL ?? "http://127.0.0.1:3001/games/run-the-fed";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForValue(fn, timeout = 8000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(100);
  }
  throw new Error("Timed out waiting for browser state");
}

const page = await waitForValue(async () => {
  const response = await fetch(`${debugBase}/json/list`);
  if (!response.ok) return null;
  const pages = await response.json();
  return pages.find((entry) => entry.type === "page" && entry.url.includes("/games/run-the-fed"));
}, 10000);

const socket = new WebSocket(page.webSocketDebuggerUrl);
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

async function waitForExpression(expression, timeout = 7000) {
  return waitForValue(() => evaluate(expression), timeout);
}

async function clickByText(text) {
  const ok = await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent.trim() === ${JSON.stringify(text)});
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!ok) throw new Error(`Could not click button: ${text}`);
}

await send("Runtime.enable");
await send("Page.enable");

await waitForExpression(`document.querySelector('.fed-shell') && document.querySelector('.fed-quarter strong')?.textContent === '0/8'`);

const initialRate = await evaluate(`document.querySelector('.fed-rate-control strong')?.textContent`);
if (initialRate !== "4.50%") throw new Error(`Unexpected initial policy rate: ${initialRate}`);

const raised = await evaluate(`(() => {
  const button = document.querySelector('button[aria-label^="Raise policy rate"]');
  if (!button) return false;
  button.click();
  return true;
})()`);
if (!raised) throw new Error("Raise-rate control missing");
await waitForExpression(`document.querySelector('.fed-rate-control strong')?.textContent === '4.75%'`);

await clickByText("Advance quarter");
await waitForExpression(`document.querySelector('.fed-quarter strong')?.textContent === '1/8'`);
const firstQuarterRows = await evaluate(`document.querySelectorAll('.fed-history tbody tr').length`);
if (firstQuarterRows !== 1) throw new Error(`Quarter history did not update: ${firstQuarterRows}`);

for (let quarter = 2; quarter <= 8; quarter += 1) {
  await clickByText("Advance quarter");
  await waitForExpression(`document.querySelector('.fed-quarter strong')?.textContent === '${quarter}/8'`);
}

await waitForExpression(`document.querySelector('.fed-result') && document.querySelector('.fed-grade strong')`);
const finalState = await evaluate(`({
  quarter: document.querySelector('.fed-quarter strong')?.textContent,
  grade: document.querySelector('.fed-grade strong')?.textContent,
  score: document.querySelector('.fed-result h2')?.textContent,
  rows: document.querySelectorAll('.fed-history tbody tr').length,
  complete: [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === 'Simulation complete' && button.disabled),
  storage: localStorage.getItem('bgn:run-the-fed:best-soft-landing'),
  frameworkError: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-toast-errors-parent')) || document.body.innerText.includes('Application error'),
})`);

if (!/^[A-D]$/.test(finalState.grade ?? "")) throw new Error(`Missing final grade: ${JSON.stringify(finalState)}`);
if (!finalState.score?.includes("/100")) throw new Error(`Missing final score: ${JSON.stringify(finalState)}`);
if (finalState.rows !== 8 || !finalState.complete) throw new Error(`Simulation did not complete eight quarters: ${JSON.stringify(finalState)}`);
if (!finalState.storage) throw new Error("Run the Fed did not persist its best score");
if (finalState.frameworkError) throw new Error("Framework error UI detected");
if (runtimeErrors.length) throw new Error(`Runtime errors detected: ${runtimeErrors.join(" | ")}`);

console.log(JSON.stringify({ targetUrl, initialRate, finalState }));
socket.close();
