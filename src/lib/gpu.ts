import snapshot from "./gpu-snapshot.json";

// GPU catalog comes from the public RunPod GraphQL endpoint (no key needed).
// Rentals in FORGEAI are simulated: prices and stock are real, the hardware is not touched.

export type Stock = "High" | "Medium" | "Low" | "Out";

export interface Gpu {
  id: string;
  name: string;
  vendor: string;
  vram: number;
  rate: number;
  stock: Stock;
  speed: number;
  tier: "Datacenter" | "Workstation" | "Consumer";
}

export interface Catalog {
  fetchedAt: number;
  live: boolean;
  gpus: Gpu[];
}

type RawGpu = {
  id: string;
  displayName: string;
  manufacturer: string;
  memoryInGb: number;
  communityPrice: number | null;
  securePrice: number | null;
  lowestPrice?: { uninterruptablePrice: number | null; stockStatus: string | null } | null;
};

// Rough relative throughput, 1.0 is about an RTX A5000. Estimates, not benchmarks.
const SPEED: Array<[RegExp, number]> = [
  [/B300/, 9],
  [/B200/, 8],
  [/MI350/, 7],
  [/H200/, 6],
  [/H100 SXM|H100 NVL/, 5.2],
  [/H100/, 4.6],
  [/MI300/, 5],
  [/RTX PRO 6000/, 3.4],
  [/A100/, 3],
  [/5090/, 2.9],
  [/L40S/, 2.6],
  [/4090/, 2.2],
  [/RTX 6000 Ada/, 2.1],
  [/L40\b/, 2],
  [/RTX PRO 5000/, 2.4],
  [/RTX PRO 4500/, 1.9],
  [/5080/, 1.8],
  [/RTX 5000 Ada/, 1.7],
  [/RTX PRO 4000/, 1.5],
  [/4080/, 1.6],
  [/A6000|A40/, 1.3],
  [/3090/, 1.2],
  [/4070/, 1.1],
  [/RTX 4000 Ada/, 0.95],
  [/A5000/, 1],
  [/3080/, 0.95],
  [/L4\b/, 0.9],
  [/A4500/, 0.9],
  [/RTX 2000 Ada/, 0.7],
  [/A4000/, 0.7],
  [/3070/, 0.6],
  [/A2000/, 0.35],
];

function speedOf(name: string) {
  return SPEED.find(([re]) => re.test(name))?.[1] ?? 1;
}

function tierOf(name: string, vram: number): Gpu["tier"] {
  if (/^(H|B|A100|MI|L40S)/.test(name) || vram >= 80) return "Datacenter";
  if (/RTX (PRO|A\d|\d000 Ada)|^A40|^L4|^L40/.test(name)) return "Workstation";
  return "Consumer";
}

function normalize(raw: RawGpu[]): Gpu[] {
  return raw
    .map((g) => {
      const lp = g.lowestPrice;
      const rate = lp?.uninterruptablePrice ?? (g.securePrice && g.securePrice > 0 ? g.securePrice : g.communityPrice) ?? 0;
      const s = lp?.stockStatus;
      const stock: Stock = s === "High" || s === "Medium" || s === "Low" ? s : "Out";
      return {
        id: g.id,
        name: g.displayName,
        vendor: /^nvidia/i.test(g.id) || /^nvidia$/i.test(g.manufacturer) ? "NVIDIA" : /^amd/i.test(g.id) || /^amd$/i.test(g.manufacturer) ? "AMD" : g.manufacturer,
        vram: g.memoryInGb,
        rate: Math.round(rate * 100) / 100,
        stock,
        speed: speedOf(g.displayName),
        tier: tierOf(g.displayName, g.memoryInGb),
      };
    })
    .filter((g) => g.id !== "unknown" && g.rate > 0 && g.vram > 0)
    .sort((a, b) => a.rate - b.rate || a.vram - b.vram);
}

const QUERY =
  "{ gpuTypes { id displayName manufacturer memoryInGb communityPrice securePrice lowestPrice(input:{gpuCount:1}){ uninterruptablePrice stockStatus } } }";
const TTL = 5 * 60_000;

const holder = globalThis as unknown as { __forgeGpuV2?: Catalog };

export async function getCatalog(): Promise<Catalog> {
  const cached = holder.__forgeGpuV2;
  if (cached?.live && Date.now() - cached.fetchedAt < TTL) return cached;
  try {
    const res = await fetch("https://api.runpod.io/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY }),
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { data?: { gpuTypes?: RawGpu[] } };
    const gpus = normalize(json.data?.gpuTypes ?? []);
    if (!gpus.length) throw new Error("empty");
    holder.__forgeGpuV2 = { fetchedAt: Date.now(), live: true, gpus };
    return holder.__forgeGpuV2;
  } catch {
    return cached ?? { fetchedAt: snapshot.fetchedAt, live: false, gpus: normalize(snapshot.gpus as RawGpu[]) };
  }
}

export const available = (g: Gpu) => g.stock !== "Out";

// Missions run a CUDA stack, so only NVIDIA cards can be attached to agents for now.
export const supported = (g: Gpu) => g.vendor === "NVIDIA";

// The GPU in stock with at least `vram` GB that finishes a job for the least money.
export function route(gpus: Gpu[], vram: number) {
  return gpus.filter((g) => supported(g) && available(g) && g.vram >= vram).sort((a, b) => a.rate / a.speed - b.rate / b.speed || a.rate - b.rate)[0] ?? null;
}

// The GPU in stock with at least `vram` GB that has the lowest hourly price.
export function cheapestHourly(gpus: Gpu[], vram: number) {
  return gpus.filter((g) => supported(g) && available(g) && g.vram >= vram).sort((a, b) => a.rate - b.rate || b.speed - a.speed)[0] ?? null;
}

export function costFor(gpu: Pick<Gpu, "rate" | "speed">, baseSeconds: number) {
  const seconds = Math.round(baseSeconds / gpu.speed);
  return { seconds, cost: Math.round(((seconds / 3600) * gpu.rate) * 10000) / 10000 };
}

export const AUTO = "auto";
