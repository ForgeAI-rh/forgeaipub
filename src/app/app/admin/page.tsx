import Link from "next/link";
import { adminLogout, moderateRun, toggleMission, toggleSuspend } from "@/app/actions";
import { AdminLogin } from "@/components/admin-login";
import { DemoTag, PageHead, Stat, StatusPill } from "@/components/ui";
import { MISSIONS } from "@/lib/catalog";
import { read } from "@/lib/db";
import { viewRun } from "@/lib/forge";
import { agentCode, ago, dateTime, runCode } from "@/lib/format";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderation" };

export default async function Admin() {
  if (!(await isAdmin())) {
    return (
      <div className="space-y-6">
        <PageHead kicker="Restricted" title="Moderation console">
          Mission control, run review and the audit trail. Moderators only.
        </PageHead>
        <AdminLogin />
      </div>
    );
  }

  const db = await read();
  const now = Date.now();
  const day = db.runs.filter((r) => r.createdAt > now - 86_400_000 && !r.demo);
  const real = db.runs.filter((r) => !r.demo);
  const finished = real.filter((r) => viewRun(r, now).finished);
  const invalid = real.filter((r) => r.invalidated).length;
  const failed = finished.filter((r) => r.sim.outcome === "failed").length;
  const accounts = db.accounts.filter((a) => !a.demo);
  const activated = new Set(db.agents.filter((a) => !a.demo).map((a) => a.ownerId)).size;
  const recent = [...db.runs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 40);

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Restricted"
        title="Moderation console"
        actions={
          <form action={adminLogout}>
            <button className="btn btn-sm">Sign out</button>
          </form>
        }
      >
        Every action here is written to the audit log with a reason.
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Runs, 24h" value={day.length} sub="Excludes demo data" />
        <Stat label="Activation" value={accounts.length ? `${Math.round((activated / accounts.length) * 100)}%` : "n/a"} sub={`${activated} of ${accounts.length} sessions made an agent`} />
        <Stat label="Failed rate" value={finished.length ? `${Math.round((failed / finished.length) * 100)}%` : "n/a"} sub={`${failed} failed runs`} />
        <Stat label="Invalidated" value={invalid} sub="By moderators" />
      </div>

      <section>
        <div className="label mb-3">Mission control</div>
        <div className="panel divide-y divide-line">
          {MISSIONS.map((m) => {
            const c = db.missions[m.slug];
            return (
              <form key={m.slug} action={toggleMission.bind(null, m.slug)} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                <div className="flex-1">
                  <span className="font-mono text-[11px] text-dim">{m.code}</span> <span className="font-medium">{m.name}</span>{" "}
                  <span className="text-[12px] text-dim">v{m.version}</span>
                  {c?.paused && <div className="text-[12px] text-bad">Paused: {c.reason}</div>}
                </div>
                {!c?.paused && <input name="reason" placeholder="Reason for pausing" className="input h-8 md:w-64" />}
                <button className={`btn btn-sm ${c?.paused ? "btn-primary" : ""}`}>{c?.paused ? "Resume" : "Pause"}</button>
              </form>
            );
          })}
        </div>
      </section>

      <section>
        <div className="label mb-3">Recent runs</div>
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left">
                {["Run", "Agent", "Mission", "Status", "Score", "Started", "Action"].map((h) => (
                  <th key={h} className="label px-3 py-2.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => {
                const a = db.agents.find((x) => x.id === r.agentId);
                const v = viewRun(r, now);
                return (
                  <tr key={r.id} className="border-b border-line align-top last:border-b-0">
                    <td className="px-3 py-2.5 font-mono text-[12px]">
                      <Link href={`/app/runs/${r.id}`} className="hover:text-forge">
                        {runCode(r.id)}
                      </Link>
                      {r.flagged && <div className="text-[11px] text-forge">flagged</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        {a?.name} {r.demo && <DemoTag />}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-steel">{MISSIONS.find((m) => m.slug === r.missionSlug)?.name}</td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={v.status} />
                    </td>
                    <td className="px-3 py-2.5 font-mono">{v.finished ? r.sim.score.total : "··"}</td>
                    <td className="px-3 py-2.5 text-dim">{ago(r.createdAt, now)}</td>
                    <td className="px-3 py-2.5">
                      {r.invalidated || r.flagged ? (
                        <form action={moderateRun.bind(null, r.id, "restore")}>
                          <button className="btn btn-sm">Restore</button>
                        </form>
                      ) : (
                        <div className="flex gap-1.5">
                          <form action={moderateRun.bind(null, r.id, "flag")} className="flex gap-1.5">
                            <input name="reason" placeholder="Reason" className="input h-8 w-36" />
                            <button className="btn btn-sm">Flag</button>
                          </form>
                          <form action={moderateRun.bind(null, r.id, "invalidate")}>
                            <input type="hidden" name="reason" value="Invalidated after review" />
                            <button className="btn btn-sm text-bad">Invalidate</button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="label mb-3">Agents</div>
        <div className="panel divide-y divide-line">
          {db.agents.slice(-25).reverse().map((a) => (
            <form key={a.id} action={toggleSuspend.bind(null, a.id)} className="flex flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2 text-sm">
                {a.name} {a.demo && <DemoTag />} <span className="font-mono text-[11px] text-dim">{agentCode(a.id)}</span>
                <span className={`font-mono text-[10px] uppercase ${a.status === "suspended" ? "text-bad" : "text-dim"}`}>{a.status}</span>
              </div>
              {a.status !== "suspended" && <input name="reason" placeholder="Reason" className="input h-8 md:w-56" />}
              <button className="btn btn-sm">{a.status === "suspended" ? "Reinstate" : "Suspend"}</button>
            </form>
          ))}
        </div>
      </section>

      <section>
        <div className="label mb-3">Audit log · append only</div>
        <div className="panel">
          {db.audit.length === 0 ? (
            <div className="px-4 py-4 text-sm text-dim">No moderator actions yet.</div>
          ) : (
            <ol className="divide-y divide-line font-mono text-[12px]">
              {[...db.audit].reverse().slice(0, 60).map((e, i) => (
                <li key={i} className="grid gap-1 px-4 py-2 md:grid-cols-[13rem_9rem_8rem_1fr]">
                  <span className="text-dim">{dateTime(e.at)}</span>
                  <span className="text-forge">{e.action}</span>
                  <span className="text-steel">{e.target}</span>
                  <span className="text-steel">{e.detail}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
