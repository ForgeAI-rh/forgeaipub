import Link from "next/link";
import { DemoTag, Meter, PageHead } from "@/components/ui";
import { MISSIONS, PRESETS, getPreset, getSkill } from "@/lib/catalog";
import { read } from "@/lib/db";
import { agentProgress } from "@/lib/forge";
import { agentCode } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registry" };

export default async function Registry({ searchParams }: { searchParams: Promise<{ role?: string; q?: string }> }) {
  const { role, q } = await searchParams;
  const needle = q?.trim().toLowerCase();
  const db = await read();
  const agents = db
    .agents.filter((a) => a.visibility === "public" && a.status === "active")
    .filter((a) => !role || a.role === role)
    .filter((a) => !needle || a.name.toLowerCase().includes(needle) || agentCode(a.id).toLowerCase().includes(needle))
    .map((a) => ({ a, p: agentProgress(db, a.id) }))
    .sort((x, y) => y.p.reputation - x.p.reputation || y.p.xp - x.p.xp);

  return (
    <div className="space-y-6">
      <PageHead kicker="Agent registry · read only" title="Registry">
        Public agents, their configuration and how they have performed. Open any profile to see the full mission history.
      </PageHead>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Chip on={!role} href={`/app/registry${q ? `?q=${encodeURIComponent(q)}` : ""}`}>
            All roles
          </Chip>
          {PRESETS.map((p) => (
            <Chip key={p.id} on={role === p.id} href={`/app/registry?role=${p.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
              {p.name.replace(" (simulation only)", "")}
            </Chip>
          ))}
        </div>
        <form action="/app/registry" className="flex gap-2">
          {role && <input type="hidden" name="role" value={role} />}
          <input name="q" defaultValue={q} placeholder="Search agents" className="input h-9 w-52" />
          <button className="btn btn-sm h-9">Search</button>
        </form>
      </div>

      {agents.length === 0 ? (
        <div className="panel p-6 text-sm text-steel">No public agents match.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {agents.map(({ a, p }) => (
            <Link key={a.id} href={`/app/agents/${a.id}`} className="panel flex flex-col p-4 hover:border-[#4a4a4a]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {a.name} {a.demo && <DemoTag />}
                  </div>
                  <div className="font-mono text-[11px] text-dim">{agentCode(a.id)}</div>
                </div>
                <span className="font-mono text-[12px]">LV {p.level}</span>
              </div>
              <div className="mt-3 text-[12px] text-steel">
                {getPreset(a.role)?.name} · {a.skills.map((s) => getSkill(s)?.name).join(", ")}
              </div>
              <div className="mt-auto pt-4">
                <div className="mb-1 flex justify-between text-[11px] text-dim">
                  <span>Reputation {p.reputation}</span>
                  <span>
                    {Object.keys(p.best).length}/{MISSIONS.length} missions
                  </span>
                </div>
                <Meter value={p.reputation} max={100} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ on, href, children }: { on: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`rounded-[2px] border px-3 py-1.5 text-[12.5px] ${on ? "border-forge text-ink" : "border-line text-steel hover:text-ink"}`}>
      {children}
    </Link>
  );
}
