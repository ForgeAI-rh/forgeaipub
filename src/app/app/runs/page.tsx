import Link from "next/link";
import { Empty, PageHead, StatusPill } from "@/components/ui";
import { MISSIONS } from "@/lib/catalog";
import { read } from "@/lib/db";
import { computeProgress, viewRun } from "@/lib/forge";
import { ago, runCode } from "@/lib/format";
import { currentAccountId } from "@/lib/session";
import type { RunStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lab" };

const FILTERS: Array<[string, string]> = [
  ["all", "All"],
  ["active", "In progress"],
  ["completed", "Completed"],
  ["failed", "Failed"],
  ["other", "Cancelled or invalidated"],
];

function match(filter: string, s: RunStatus) {
  if (filter === "active") return s === "queued" || s === "running" || s === "evaluating";
  if (filter === "completed" || filter === "failed") return s === filter;
  if (filter === "other") return s === "cancelled" || s === "invalidated";
  return true;
}

export default async function Lab({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const me = await currentAccountId();
  const db = await read();
  const runs = me ? db.runs.filter((r) => r.ownerId === me).sort((a, b) => b.createdAt - a.createdAt) : [];
  const xp = new Map<string, number>();
  for (const agentId of new Set(runs.map((r) => r.agentId))) {
    const p = computeProgress(db.runs.filter((r) => r.agentId === agentId));
    for (const [k, v] of Object.entries(p.xpByRun)) xp.set(k, v);
  }
  const rows = runs.map((r) => ({ r, v: viewRun(r) })).filter(({ v }) => match(status, v.status));

  return (
    <div className="space-y-8">
      <PageHead kicker="Lab" title="Runs">
        Every run your agents have started, with status, score and the XP it earned.
      </PageHead>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(([k, label]) => (
          <Link
            key={k}
            href={k === "all" ? "/app/runs" : `/app/runs?status=${k}`}
            className={`rounded-[2px] border px-3 py-1.5 text-[12.5px] ${status === k ? "border-forge text-ink" : "border-line text-steel hover:text-ink"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {runs.length === 0 ? (
        <Empty title="No runs yet" href="/app/missions" cta="Browse missions">
          Pick a mission, choose an agent and start a run. The log streams here live.
        </Empty>
      ) : rows.length === 0 ? (
        <div className="panel p-5 text-sm text-steel">Nothing matches this filter.</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["Run", "Mission", "Agent", "Status", "Score", "XP", "Started"].map((h) => (
                  <th key={h} className="label px-4 py-2.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ r, v }) => {
                const agent = db.agents.find((a) => a.id === r.agentId);
                const m = MISSIONS.find((x) => x.slug === r.missionSlug);
                const gain = xp.get(r.id) ?? 0;
                return (
                  <tr key={r.id} className="border-b border-line last:border-b-0 hover:bg-graphite/40">
                    <td className="px-4 py-2.5 font-mono text-[12px]">
                      <Link href={`/app/runs/${r.id}`} className="hover:text-forge">
                        {runCode(r.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{m?.name}</td>
                    <td className="px-4 py-2.5 text-steel">{agent?.name ?? "deleted"}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={v.status} />
                    </td>
                    <td className="px-4 py-2.5 font-mono">{v.status === "completed" ? r.sim.score.total : "··"}</td>
                    <td className="px-4 py-2.5 font-mono">{gain ? <span className="text-forge">+{gain}</span> : <span className="text-dim">0</span>}</td>
                    <td className="px-4 py-2.5 text-[12px] text-dim">{ago(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
