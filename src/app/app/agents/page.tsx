import Link from "next/link";
import { archiveAgent } from "@/app/actions";
import { Empty, PageHead } from "@/components/ui";
import { MISSIONS, getPreset, getSkill } from "@/lib/catalog";
import { read } from "@/lib/db";
import { agentProgress } from "@/lib/forge";
import { agentCode, date } from "@/lib/format";
import { currentAccountId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Agents" };

export default async function MyAgents() {
  const me = await currentAccountId();
  const db = await read();
  const agents = me ? db.agents.filter((a) => a.ownerId === me) : [];
  const active = agents.filter((a) => a.status !== "archived");
  const archived = agents.filter((a) => a.status === "archived");

  return (
    <div className="space-y-8">
      <PageHead
        kicker="Agents"
        title="My agents"
        actions={
          <Link href="/app/forge" className="btn btn-primary">
            New agent
          </Link>
        }
      >
        Agents tied to this browser session.
      </PageHead>

      {!active.length && (
        <Empty title="No active agents" href="/app/forge" cta="Forge an agent">
          Create an agent to start running missions.
        </Empty>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {active.map((a) => {
          const p = agentProgress(db, a.id);
          return (
            <div key={a.id} className="panel flex flex-col">
              <Link href={`/app/agents/${a.id}`} className="block p-5 hover:bg-graphite/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-lg font-semibold">{a.name}</div>
                    <div className="font-mono text-[11px] text-dim">
                      {agentCode(a.id)} · v{a.configVersion}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">LV {p.level}</div>
                    <div className="font-mono text-[11px] text-dim">{p.xp} XP</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-steel">{a.objective}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded-[2px] bg-graphite px-2 py-0.5 text-[11px] text-ink">{getPreset(a.role)?.name}</span>
                  {a.skills.map((s) => (
                    <span key={s} className="rounded-[2px] border border-line px-2 py-0.5 text-[11px] text-steel">
                      {getSkill(s)?.name}
                    </span>
                  ))}
                </div>
              </Link>
              <div className="mt-auto flex items-center justify-between border-t border-line px-5 py-2.5 text-[12px] text-dim">
                <span>
                  {Object.keys(p.best).length}/{MISSIONS.length} missions · {a.visibility} {a.status === "suspended" && "· suspended"}
                </span>
                <span className="flex gap-3">
                  <Link href={`/app/agents/${a.id}/edit`} className="hover:text-ink">
                    Edit
                  </Link>
                  <form action={archiveAgent.bind(null, a.id)}>
                    <button className="hover:text-ink">Archive</button>
                  </form>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {archived.length > 0 && (
        <div>
          <div className="label mb-3">Archived</div>
          <div className="panel divide-y divide-line">
            {archived.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  {a.name} <span className="font-mono text-[11px] text-dim">{agentCode(a.id)} · created {date(a.createdAt)}</span>
                </span>
                <form action={archiveAgent.bind(null, a.id)}>
                  <button className="btn btn-sm btn-ghost">Restore</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
