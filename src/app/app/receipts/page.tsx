import Link from "next/link";
import { PageHead } from "@/components/ui";
import { VerifyReceipt } from "@/components/verify-receipt";
import { read } from "@/lib/db";
import { chargeOf, viewRun } from "@/lib/forge";
import { dateTime, runCode } from "@/lib/format";
import { hourOf, merkleRoot, proofFor, type ReceiptFields } from "@/lib/receipts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receipts" };

type Item = { fields: ReceiptFields; leaf: string; gpuName: string };

export default async function Receipts() {
  const db = await read();
  const now = Date.now();
  const items: Item[] = db.runs
    .filter((r) => r.receipt && r.config.gpu && r.sim.compute && viewRun(r, now).finished && chargeOf(r, now) > 0)
    .map((r) => ({
      leaf: r.receipt!.leaf,
      gpuName: r.config.gpu!.name,
      fields: { run: r.id, gpu: r.config.gpu!.id, seconds: r.sim.compute!.seconds, rate: r.config.gpu!.rate, cost: r.sim.compute!.cost, at: r.receipt!.at },
    }));

  const byHour = new Map<number, Item[]>();
  for (const it of items) {
    const h = hourOf(it.fields.at);
    byHour.set(h, [...(byHour.get(h) ?? []), it]);
  }
  const hours = await Promise.all(
    [...byHour.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, 24)
      .map(async ([hour, list]) => {
        const leaves = list.map((i) => i.leaf);
        const root = await merkleRoot(leaves);
        const rows = await Promise.all(list.map(async (i) => ({ ...i, proof: await proofFor(leaves, i.leaf) })));
        return { hour, root, rows, sealed: hour + 3600_000 <= now, total: list.reduce((s, i) => s + i.fields.cost, 0) };
      }),
  );

  return (
    <div className="space-y-8">
      <PageHead kicker="Compute · public meter" title="Receipts">
        Every finished GPU run writes a receipt: which card, for how long, at what rate, for how many credits. Receipts are hashed, and each hour&apos;s hashes are combined into one root. Press Verify to recompute any receipt and its proof in your own browser.
      </PageHead>

      <div className="panel grid gap-4 p-5 text-sm text-steel md:grid-cols-4">
        {[
          ["1", "Read the receipt fields."],
          ["2", "Hash them. That is the leaf."],
          ["3", "Hash the leaf with each proof step."],
          ["4", "You land on the root of that hour."],
        ].map(([n, t]) => (
          <div key={n} className="flex gap-3">
            <span className="font-mono text-forge">0{n}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>

      {hours.length === 0 ? (
        <div className="panel grid-bg p-8 text-sm text-steel">
          No GPU receipts yet. Run <Link href="/app/missions/render" className="text-ink underline decoration-line underline-offset-4">Render Run</Link> or{" "}
          <Link href="/app/missions/finetune" className="text-ink underline decoration-line underline-offset-4">Fine Tune Trial</Link> with an agent that has a compute slot.
        </div>
      ) : (
        hours.map((h) => (
          <section key={h.hour} className="panel">
            <div className="flex flex-col gap-2 border-b border-line px-5 py-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="font-display font-semibold">{dateTime(h.hour)}</span>
                <span className={`font-mono text-[10px] uppercase ${h.sealed ? "text-ok" : "text-forge"}`}>{h.sealed ? "Sealed" : "Open hour"}</span>
              </div>
              <div className="font-mono text-[11px] text-dim">
                {h.rows.length} {h.rows.length === 1 ? "receipt" : "receipts"} · {h.total.toFixed(4)} credits
              </div>
            </div>
            <div className="border-b border-line px-5 py-2.5 font-mono text-[11px] break-all text-steel">
              <span className="text-dim">root </span>
              {h.root}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <tbody>
                  {h.rows.map((r) => (
                    <tr key={r.fields.run} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-2.5 font-mono text-[12px]">
                        <Link href={`/app/runs/${r.fields.run}`} className="hover:text-forge">
                          {runCode(r.fields.run)}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-steel">{r.gpuName}</td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-steel">{Math.round(r.fields.seconds / 60)} min</td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-steel">${r.fields.rate.toFixed(2)}/hr</td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-forge">{r.fields.cost.toFixed(4)}</td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 font-mono text-[11px] text-dim" title={r.leaf}>
                        {r.leaf}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <VerifyReceipt fields={r.fields} leaf={r.leaf} proof={r.proof} root={h.root} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      <p className="text-[12px] leading-relaxed text-dim">
        Roots are published here only. Anchoring them onchain is planned for when $FORGE launches, and is not live. Credits are demo credits with no monetary value.
      </p>
    </div>
  );
}
