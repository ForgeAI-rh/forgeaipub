// Receipts for simulated GPU rentals. Runs in the browser, Workers and Node,
// so anyone can recompute a leaf and its proof up to the hourly root.

export interface ReceiptFields {
  run: string;
  gpu: string;
  seconds: number;
  rate: number;
  cost: number;
  at: number;
}

const enc = new TextEncoder();

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function canonical(f: ReceiptFields) {
  return `forge.receipt.v1|${f.run}|${f.gpu}|${f.seconds}|${f.rate.toFixed(4)}|${f.cost.toFixed(4)}|${f.at}`;
}

export const leafOf = (f: ReceiptFields) => sha256(canonical(f));

const pair = (a: string, b: string) => sha256(a < b ? a + b : b + a);

export async function merkleRoot(leaves: string[]) {
  if (!leaves.length) return "";
  let level = [...leaves].sort();
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? await pair(level[i], level[i + 1]) : level[i]);
    level = next;
  }
  return level[0];
}

export async function proofFor(leaves: string[], leaf: string) {
  let level = [...leaves].sort();
  let idx = level.indexOf(leaf);
  const proof: string[] = [];
  if (idx < 0) return proof;
  while (level.length > 1) {
    const sib = idx % 2 === 0 ? idx + 1 : idx - 1;
    if (sib < level.length) proof.push(level[sib]);
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) next.push(i + 1 < level.length ? await pair(level[i], level[i + 1]) : level[i]);
    level = next;
    idx = Math.floor(idx / 2);
  }
  return proof;
}

export async function verify(leaf: string, proof: string[], root: string) {
  let h = leaf;
  for (const p of proof) h = await pair(h, p);
  return h === root;
}

export const hourOf = (ts: number) => Math.floor(ts / 3600_000) * 3600_000;
