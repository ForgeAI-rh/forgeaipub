import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { read, write } from "./db";
import { sessionToken } from "./ids";

const SESSION = "forge_sid";
const ADMIN = "forge_admin";
const YEAR = 60 * 60 * 24 * 365;

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function currentAccountId(): Promise<string | null> {
  const store = await cookies();
  const sid = store.get(SESSION)?.value;
  if (!sid) return null;
  return (await read()).accounts.some((a) => a.id === sid && !a.demo) ? sid : null;
}

// Only callable from server actions and route handlers, where cookies can be written.
export async function ensureAccount(): Promise<string> {
  const existing = await currentAccountId();
  if (existing) return existing;
  const id = sessionToken();
  await write((db) => db.accounts.push({ id, createdAt: Date.now() }));
  (await cookies()).set(SESSION, id, { ...cookieBase, maxAge: YEAR });
  return id;
}

export async function clearSession() {
  (await cookies()).delete(SESSION);
}

function digest(value: string) {
  return createHash("sha256").update(`forge-admin:${value}`).digest("hex");
}

const EXAMPLE_TOKEN = "forge-admin-local";

// In production the example token and short tokens are refused, so a fresh
// deploy keeps the moderation console locked until a real token is set.
function adminToken() {
  const token = process.env.FORGE_ADMIN_TOKEN || "";
  if (process.env.NODE_ENV === "production" && (token === EXAMPLE_TOKEN || token.length < 16)) return "";
  return token;
}

export async function isAdmin() {
  const token = adminToken();
  if (!token) return false;
  const given = (await cookies()).get(ADMIN)?.value;
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(digest(token));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function adminSignIn(input: string) {
  const token = adminToken();
  if (!token || input.length !== token.length) return false;
  if (!timingSafeEqual(Buffer.from(input), Buffer.from(token))) return false;
  (await cookies()).set(ADMIN, digest(token), { ...cookieBase, maxAge: 60 * 60 * 8 });
  return true;
}

export async function adminSignOut() {
  (await cookies()).delete(ADMIN);
}
