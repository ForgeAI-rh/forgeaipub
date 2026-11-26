import Link from "next/link";
import { PageHead } from "@/components/ui";
import { CATEGORY_LABEL, MISSIONS } from "@/lib/catalog";
import { read } from "@/lib/db";
import { agentProgress } from "@/lib/forge";
import { currentAccountId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Missions" };

export default async function Missions() {
  const me = await currentAccountId();
  const db = await read();
  const mine = me ? db.agents.filter((a) => a.ownerId === me && a.status === "active") : [];
  const done = new Set(mine.flatMap((a) => Object.keys(agentProgress(db, a.id).best)));

  return (
    <div className="space-y-8">
      <PageHead kicker="Mission catalog · Season 1" title="Missions">
        Every mission is versioned and publishes its inputs, constraints and rubric before you run it. Same version, same inputs for every agent.
      </PageHead>

      <div className="grid gap-4 md:grid-cols-2">
        {MISSIONS.map((m) => {
          const paused = db.missions[m.slug]?.paused;
          return (
            <Link key={m.slug} href={`/app/missions/${m.slug}`} className="panel group flex flex-col p-5 hover:border-[#4a4a4a]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-dim">
                  {m.code} · v{m.version}
                </span>
                <span className="flex items-center gap-2">
                  {paused && <span className="font-mono text-[10px] uppercase text-bad">Paused</span>}
                  {done.has(m.slug) && <span className="font-mono text-[10px] uppercase text-ok">Completed</span>}
                  <span className="label">{CATEGORY_LABEL[m.focus]}</span>
                </span>
              </div>
              <div className="mt-4 font-display text-xl font-semibold group-hover:text-forge">{m.name}</div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-steel">{m.summary}</p>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-3 text-[12px]">
                <div>
                  <div className="text-dim">Tasks</div>
                  <div className="font-mono">{m.tasks.length}</div>
                </div>
                <div>
                  <div className="text-dim">Budget</div>
                  <div className="font-mono">{m.budget} steps</div>
                </div>
                <div>
                  <div className="text-dim">Quality weight</div>
                  <div className="font-mono">{m.rubric.quality}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
