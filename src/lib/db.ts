import "server-only";
import { cache } from "react";
import { seedDemo } from "./seed";
import type { DbShape } from "./types";

const SCHEMA = 1;

/*
 * Two backends behind one interface:
 *   D1 when running on Cloudflare (binding DB), one row per record.
 *   A JSON file in .data/ for plain `next dev` and self hosting.
 * Callers always get the whole dataset; it is small at testnet scale.
 */

type D1 = {
  prepare(sql: string): { bind(...v: unknown[]): D1Stmt; all<T>(): Promise<{ results: T[] }> } & D1Stmt;
  batch(stmts: D1Stmt[]): Promise<unknown>;
  exec(sql: string): Promise<unknown>;
};
type D1Stmt = { all<T>(): Promise<{ results: T[] }>; run(): Promise<unknown> };

type Row = { kind: string; id: string; body: string };

function empty(): DbShape {
  return { schema: SCHEMA, seededAt: Date.now(), accounts: [], agents: [], runs: [], missions: {}, audit: [] };
}

function toRows(db: DbShape): Row[] {
  const rows: Row[] = [{ kind: "meta", id: "meta", body: JSON.stringify({ schema: db.schema, seededAt: db.seededAt }) }];
  for (const a of db.accounts) rows.push({ kind: "account", id: a.id, body: JSON.stringify(a) });
  for (const a of db.agents) rows.push({ kind: "agent", id: a.id, body: JSON.stringify(a) });
  for (const r of db.runs) rows.push({ kind: "run", id: r.id, body: JSON.stringify(r) });
  for (const [slug, m] of Object.entries(db.missions)) rows.push({ kind: "mission", id: slug, body: JSON.stringify(m) });
  db.audit.forEach((e, i) => rows.push({ kind: "audit", id: String(i).padStart(8, "0"), body: JSON.stringify(e) }));
  return rows;
}

function fromRows(rows: Row[]): DbShape | null {
  const meta = rows.find((r) => r.kind === "meta");
  if (!meta) return null;
  const db = { ...empty(), ...JSON.parse(meta.body) } as DbShape;
  const sorted = [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const r of sorted) {
    const v = JSON.parse(r.body);
    if (r.kind === "account") db.accounts.push(v);
    else if (r.kind === "agent") db.agents.push(v);
    else if (r.kind === "run") db.runs.push(v);
    else if (r.kind === "mission") db.missions[r.id] = v;
    else if (r.kind === "audit") db.audit.push(v);
  }
  db.accounts.sort((a, b) => a.createdAt - b.createdAt);
  db.agents.sort((a, b) => a.createdAt - b.createdAt);
  db.runs.sort((a, b) => a.createdAt - b.createdAt);
  return db;
}

const key = (r: Row) => `${r.kind}\u0000${r.id}`;

async function d1(): Promise<D1 | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return ((env as Record<string, unknown>).DB as D1) ?? null;
  } catch {
    return null;
  }
}

const DDL = "CREATE TABLE IF NOT EXISTS docs (kind TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY (kind, id))";

async function d1Load(db: D1): Promise<DbShape> {
  let rows: Row[];
  try {
    rows = (await db.prepare("SELECT kind, id, body FROM docs").all<Row>()).results;
  } catch {
    await db.exec(DDL);
    rows = [];
  }
  const parsed = fromRows(rows);
  if (parsed && parsed.schema === SCHEMA) return parsed;
  const fresh = empty();
  seedDemo(fresh);
  await d1Save(db, [], toRows(fresh));
  return fresh;
}

async function d1Save(db: D1, before: Row[], after: Row[]) {
  const prev = new Map(before.map((r) => [key(r), r.body]));
  const next = new Set(after.map(key));
  const stmts: D1Stmt[] = [];
  for (const r of after) {
    if (prev.get(key(r)) === r.body) continue;
    stmts.push(
      db.prepare("INSERT INTO docs (kind, id, body) VALUES (?, ?, ?) ON CONFLICT(kind, id) DO UPDATE SET body = excluded.body").bind(r.kind, r.id, r.body),
    );
  }
  for (const r of before) if (!next.has(key(r))) stmts.push(db.prepare("DELETE FROM docs WHERE kind = ? AND id = ?").bind(r.kind, r.id));
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50));
}

/* File backend */

type Holder = { db?: DbShape };
const holder = globalThis as unknown as { __forge?: Holder };
holder.__forge ??= {};

async function fileLoad(): Promise<DbShape> {
  if (holder.__forge!.db) return holder.__forge!.db;
  const fs = await import("node:fs");
  const path = await import("node:path");
  const file = path.join(path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.FORGE_DATA_DIR || ".data"), "forge.json");
  let db: DbShape | undefined;
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as DbShape;
    if (raw.schema === SCHEMA) db = raw;
  } catch {
    // first boot or unreadable file, start clean
  }
  if (!db) {
    db = empty();
    seedDemo(db);
    await fileSave(db);
  }
  holder.__forge!.db = db;
  return db;
}

async function fileSave(db: DbShape) {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const dir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.FORGE_DATA_DIR || ".data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "forge.json");
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, file);
}

/* Public interface */

async function load(): Promise<DbShape> {
  const binding = await d1();
  return binding ? d1Load(binding) : fileLoad();
}

// Memoised per server render. Mutations go through write(), which always loads fresh.
export const read = cache(load);

export async function write<T>(fn: (db: DbShape) => T): Promise<T> {
  const binding = await d1();
  if (!binding) {
    const db = await fileLoad();
    const out = fn(db);
    await fileSave(db);
    return out;
  }
  const db = await d1Load(binding);
  const before = toRows(db);
  const out = fn(db);
  await d1Save(binding, before, toRows(db));
  return out;
}
