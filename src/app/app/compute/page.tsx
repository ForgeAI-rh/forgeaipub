import Link from "next/link";
import { GpuRouter } from "@/components/gpu-router";
import { GpuName, SpeedBar, StockDot, money } from "@/components/gpu-ui";
import { PageHead } from "@/components/ui";
import { MISSIONS } from "@/lib/catalog";
import { read } from "@/lib/db";
import { CREDITS, creditBalance } from "@/lib/forge";
import { dateTime } from "@/lib/format";
import { available, getCatalog, supported } from "@/lib/gpu";
import { currentAccountId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compute" };

export default async function Compute({ searchParams }: { searchParams: Promise<{ vendor?: string; stock?: string }> }) {
  const sp = await searchParams;
  const [catalog, me, db] = await Promise.all([getCatalog(), currentAccountId(), read()]);
  const credits = me ? creditBalance(db, me) : null;
  const open = catalog.gpus.filter(available);
  const cheapest = open[0];
  const biggest = [...catalog.gpus].sort((a, b) => b.vram - a.vram)[0];
  const rows = catalog.gpus
    .filter((g) => !sp.vendor || g.vendor === sp.vendor)
    .filter((g) => sp.stock !== "open" || available(g));
  const gpuMissions = MISSIONS.filter((m) => m.compute);

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Compute · live GPU market"
        title="The rack"
        actions={
          <Link href="/app/receipts" className="btn">
            Receipts
          </Link>
        }
      >
        Give an agent a GPU and it can take on compute missions. Prices and stock below are live from a public GPU market. Rentals in FORGEAI are simulated and paid in demo credits, so nothing is charged and no card is switched on.
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="GPUs listed" value={String(catalog.gpus.length)} sub={`${open.length} in stock now`} />
        <Tile label="Cheapest hour" value={cheapest ? money(cheapest.rate) : "n/a"} sub={cheapest ? cheapest.name : "Nothing in stock"} />
        <Tile label="Largest card" value={`${biggest?.vram ?? 0} GB`} sub={biggest?.name ?? ""} />
        <Tile
          label="Your credits"
          value={credits ? credits.balance.toFixed(2) : "n/a"}
          sub={credits ? `+${CREDITS.daily} a day, up to ${CREDITS.cap}` : "Forge an agent to get 25"}
          accent
        />
      </div>

      <GpuRouter gpus={catalog.gpus} />

      <div className="grid gap-3 md:grid-cols-2">
        {gpuMissions.map((m) => (
          <Link key={m.slug} href={`/app/missions/${m.slug}`} className="panel group flex items-center justify-between gap-4 p-4 hover:border-[#4a4a4a]">
            <div>
              <div className="font-mono text-[11px] text-dim">{m.code} · GPU mission</div>
              <div className="mt-1 font-display text-lg font-semibold group-hover:text-forge">{m.name}</div>
              <div className="text-xs text-steel">{m.summary}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-2xl font-semibold">{m.compute!.vram} GB</div>
              <div className="label">minimum</div>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              ["All", {}],
              ["In stock", { stock: "open" }],
              ["NVIDIA", { vendor: "NVIDIA" }],
              ["AMD", { vendor: "AMD" }],
            ].map(([label, q]) => {
              const params = new URLSearchParams(q as Record<string, string>).toString();
              const on = (params === "" && !sp.vendor && !sp.stock) || (params !== "" && params === new URLSearchParams(sp as Record<string, string>).toString());
              return (
                <Link
                  key={label as string}
                  href={`/app/compute${params ? `?${params}` : ""}`}
                  className={`rounded-[2px] border px-3 py-1.5 text-[12.5px] ${on ? "border-forge text-ink" : "border-line text-steel hover:text-ink"}`}
                >
                  {label as string}
                </Link>
              );
            })}
          </div>
          <span className="flex items-center gap-2 font-mono text-[11px] text-dim">
            <StockDot stock={catalog.live ? "High" : "Out"} />
            {catalog.live ? "Live" : "Cached snapshot"} · {dateTime(catalog.fetchedAt)}
          </span>
        </div>

        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["GPU", "Memory", "Class", "Speed", "Per hour", "Stock"].map((h) => (
                  <th key={h} className="label px-4 py-2.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id} className={`border-b border-line last:border-b-0 hover:bg-graphite/40 ${available(g) ? "" : "opacity-55"}`}>
                  <td className="px-4 py-2.5">
                    <GpuName gpu={g} />
                  </td>
                  <td className="px-4 py-2.5 font-mono">{g.vram} GB</td>
                  <td className="px-4 py-2.5 text-[12px] text-steel">{supported(g) ? g.tier : "Listed only"}</td>
                  <td className="px-4 py-2.5">
                    <SpeedBar speed={g.speed} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-forge">{money(g.rate)}</td>
                  <td className="px-4 py-2.5">
                    <StockDot stock={g.stock} withLabel />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-dim">
          Speed is our own rough estimate relative to an RTX A5000, used by the simulator to decide how long a job takes. It is not a benchmark. Agents can attach NVIDIA cards only for now, because missions run a CUDA stack. GPU names are used only to identify hardware and do not imply any partnership with their makers.
        </p>
      </div>
    </div>
  );
}

function Tile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-[4px] border p-4 ${accent ? "border-forge/40 bg-forge/5" : "border-line bg-surface"}`}>
      <div className="label">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1 truncate text-xs text-dim">{sub}</div>}
    </div>
  );
}
