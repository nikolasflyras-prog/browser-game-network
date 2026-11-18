// Daybook leaderboard API.
//
//   GET    /api/daybook/lb                  → { docs: [{ uid, name, date, today, ... }] }
//   POST   /api/daybook/lb  { token, doc }  → { doc }   save your own board entry
//   DELETE /api/daybook/lb  { token }       → { ok }    remove your entry
//
// Storage: Upstash Redis over its REST API (Vercel → Storage → Upstash Redis
// sets KV_REST_API_URL and KV_REST_API_TOKEN; UPSTASH_REDIS_REST_* also work).
// Without it every route answers 503 and the page says leaderboards are off.
//
// A player is a random secret token kept in their browser; their public id is
// a hash of it, so nobody else can overwrite their entry. Scores are
// self-reported by the page, so this is honest-player protection only.
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

const KEY = "daybook:lb";
const MAX_DOC_BYTES = 48 * 1024;
const MAX_PLAYERS = 5000;
const KEEP_DAYS = 120;

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function config() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function redis(cfg: { url: string; token: string }, cmd: (string | number)[]): Promise<unknown> {
  const r = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "content-type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const j = (await r.json()) as { result?: unknown; error?: string };
  if (!r.ok || j.error) throw new Error(j.error || `redis ${r.status}`);
  return j.result;
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const uidFor = (token: string) => "p_" + createHash("sha256").update(token).digest("hex").slice(0, 22);
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

// Keep only plain JSON data: limited depth, keys, list lengths and string sizes.
function clean(v: unknown, depth = 0): Json | undefined {
  if (depth > 6) return undefined;
  if (v === null || typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") return v.slice(0, 80);
  if (Array.isArray(v)) return v.slice(0, 60).map((x) => clean(x, depth + 1) ?? null);
  if (typeof v === "object") {
    const o: { [k: string]: Json } = {};
    for (const k of Object.keys(v).slice(0, 400)) {
      if (!/^[\w.:-]{1,60}$/.test(k)) continue;
      const c = clean((v as Record<string, unknown>)[k], depth + 1);
      if (c !== undefined) o[k] = c;
    }
    return o;
  }
  return undefined;
}
const cleanName = (n: unknown) => {
  const s = typeof n === "string" ? n.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 24) : "";
  return s || "Player";
};
const count = (n: unknown) => Math.max(0, Math.min(10000, Number(n) || 0));

async function readToken(request: Request): Promise<{ token: string; body: Record<string, unknown> } | null> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token = body?.token;
    return typeof token === "string" && /^[0-9a-f]{48}$/.test(token) ? { token, body } : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const cfg = config();
  if (!cfg) return json({ error: "not_configured" }, 503);
  try {
    const flat = ((await redis(cfg, ["HGETALL", KEY])) as string[] | null) || [];
    const cutoff = Date.now() - KEEP_DAYS * 864e5;
    const docs: Record<string, unknown>[] = [];
    for (let i = 0; i < flat.length; i += 2) {
      try {
        const d = JSON.parse(flat[i + 1]) as Record<string, unknown>;
        if (Number(d.updated || 0) >= cutoff) docs.push({ uid: flat[i], ...d });
      } catch {
        /* skip a bad row */
      }
    }
    return json({ docs });
  } catch (e) {
    console.error(e);
    return json({ error: "server_error" }, 500);
  }
}

export async function POST(request: Request) {
  const cfg = config();
  if (!cfg) return json({ error: "not_configured" }, 503);
  const parsed = await readToken(request);
  if (!parsed) return json({ error: "bad_token" }, 400);
  const uid = uidFor(parsed.token);
  try {
    // one write per player every 2 seconds
    if ((await redis(cfg, ["SET", `daybook:rl:${uid}`, "1", "NX", "EX", 2])) === null) return json({ error: "slow_down" }, 429);
    const d = parsed.body.doc as Record<string, unknown> | undefined;
    if (!d || typeof d !== "object" || d.v !== 1 || !isDate(d.date)) return json({ error: "bad_doc" }, 400);
    const doc = {
      v: 1,
      date: d.date,
      name: cleanName(d.name),
      today: clean(d.today) || {},
      week: clean(d.week) || {},
      totals: clean(d.totals) || {},
      ans: clean(d.ans) || {},
      streak: count(d.streak),
      best: count(d.best),
      updated: Date.now(),
    };
    const body = JSON.stringify(doc);
    if (body.length > MAX_DOC_BYTES) return json({ error: "too_large" }, 400);
    const exists = await redis(cfg, ["HEXISTS", KEY, uid]);
    if (!exists && Number(await redis(cfg, ["HLEN", KEY])) >= MAX_PLAYERS) return json({ error: "full" }, 507);
    await redis(cfg, ["HSET", KEY, uid, body]);
    return json({ doc: { uid, ...doc } });
  } catch (e) {
    console.error(e);
    return json({ error: "server_error" }, 500);
  }
}

export async function DELETE(request: Request) {
  const cfg = config();
  if (!cfg) return json({ error: "not_configured" }, 503);
  const parsed = await readToken(request);
  if (!parsed) return json({ error: "bad_token" }, 400);
  try {
    await redis(cfg, ["HDEL", KEY, uidFor(parsed.token)]);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: "server_error" }, 500);
  }
}
