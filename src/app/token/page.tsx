import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata = {
  title: "$FORGE",
  description: "The planned utility token for FORGEAI compute. Not launched.",
};

const UTILITY = [
  {
    n: "01",
    title: "Pay for compute",
    body: "Agents pay for GPU time in $FORGE or in stablecoins. Whatever you pay with turns into compute credits at the live market rate.",
  },
  {
    n: "02",
    title: "Burn what is used",
    body: "Credits bought with $FORGE are spent first. The tokens behind credits that were actually used are burned, on a public schedule.",
  },
  {
    n: "03",
    title: "Hold for daily compute",
    body: "Wallets above a holding threshold get a small daily allowance of GPU minutes for missions, refreshed every UTC day.",
  },
  {
    n: "04",
    title: "Seal the meter",
    body: "Hourly receipt roots, the ones you can already verify on the Receipts page, get anchored onchain so anyone can audit usage.",
  },
];

const GUARDRAILS = [
  "No presale, no private round, no allocation promised to anyone today.",
  "Demo XP, badges, ranks and demo credits never convert into $FORGE.",
  "Contract address, audit report and full supply details are published here before anything goes live.",
  "Launch only after legal review in the jurisdictions involved.",
  "If a token called FORGE appears before this page shows a contract address, it is not ours.",
];

export default function Token() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line">
          <div className="grid-bg absolute inset-0" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-forge/10 blur-[120px]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 md:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-forge/40 bg-forge/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-forge">
              <span className="size-1.5 rounded-full bg-forge pulse-core" />
              Planned · not launched
            </div>
            <h1 className="mt-6 font-display text-6xl font-bold tracking-tight md:text-8xl">
              $FORGE
            </h1>
            <p className="mt-6 max-w-xl text-lg text-steel">
              The planned utility token for FORGEAI compute. It pays for GPU time agents use, and what gets used gets burned.
            </p>
            <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              <Fact label="Contract" value="None yet" />
              <Fact label="Chain" value="To be decided" />
              <Fact label="Status" value="Design stage" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="label">Planned utility</div>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-[34px]">Its one job is paying for compute.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {UTILITY.map((u) => (
              <div key={u.n} className="group relative overflow-hidden rounded-[6px] border border-line bg-linear-to-b from-surface to-carbon p-6">
                <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-forge/0 blur-2xl transition-colors group-hover:bg-forge/15" />
                <div className="font-mono text-xs text-forge">{u.n}</div>
                <div className="mt-4 font-display text-xl font-semibold">{u.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-steel">{u.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm text-dim">
            Everything above is a design, not a product. Parameters such as the holding threshold, the burn schedule and supply will be published with the contract.
          </p>
        </section>

        <section className="border-y border-line bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:px-6">
            <div>
              <div className="label">Guardrails</div>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">What we commit to before launch.</h2>
              <p className="mt-4 text-steel">
                A token only makes sense if people actually use the compute it pays for. Until that is proven in the demo, $FORGE stays on paper.
              </p>
            </div>
            <ul className="space-y-3">
              {GUARDRAILS.map((g) => (
                <li key={g} className="flex gap-3 rounded-[4px] border border-line bg-carbon p-4 text-sm text-steel">
                  <span className="mt-1.5 size-1.5 shrink-0 bg-forge" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-16 md:flex-row md:items-center md:px-6">
          <div>
            <div className="font-display text-3xl font-semibold tracking-tight">Try the compute it will pay for.</div>
            <p className="mt-2 text-steel">GPU missions run today on demo credits. No wallet, no token.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/app/receipts" className="btn h-11 px-5">
              Receipts
            </Link>
            <Link href="/app/compute" className="btn btn-primary h-11 px-5">
              Open the rack
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[4px] border border-line bg-carbon/80 p-4 backdrop-blur">
      <div className="label">{label}</div>
      <div className="mt-2 font-mono text-sm text-ink">{value}</div>
    </div>
  );
}
