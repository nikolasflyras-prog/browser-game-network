const targetUrl = process.env.LINEBREAK_URL ?? "http://127.0.0.1:3000/games/linebreak-daily";
const response = await fetch(targetUrl);
if (!response.ok) throw new Error(`Linebreak route returned ${response.status}`);
const html = await response.text();
if (!html.includes("Linebreak Daily")) throw new Error("Linebreak title missing");
if (!html.includes("How to play")) throw new Error("Linebreak instructions missing");
console.log(JSON.stringify({ targetUrl, ok: true }));
