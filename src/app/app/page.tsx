import Link from "next/link";
import { Empty, Meter, PageHead, Stat, StatusPill } from "@/components/ui";
import { CURRENT_SEASON, MISSIONS, SEASONS } from "@/lib/catalog";
import { read } from "@/lib/db";
import { forecast } from "@/lib/engine";
import { agentProgress, viewRun } from "@/lib/forge";
import { agentCode, ago, runCode } from "@/lib/format";
import { currentAccountId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview" };

export default async function Overview({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const me = await currentAccountId();
  const db = await read();
  const agents = me ? db.agents.filter((a) => a.ownerId === me && a.status !== "archived") : [];
  const season = SEASONS.find((s) => s.id === CURRENT_SEASON)!;

  if (!agents.length) {
    return (
      <div className="space-y-8">
        {deleted && (
          <div className="panel border-forge/40 px-4 py-3 text-sm text-steel">Your data was deleted. Nothing from this browser remains on the server.</div>
        )}
        <PageHead kicker={`${season.name} · ${season.summary}`} title="Initialize your first agent">
          You have no agents yet. Creating one takes about a minute and needs no wallet. Your agents are linked to this browser.
        </PageHead>
        <ol className="grid gap-px border border-line bg-line md:grid-cols-4">
          {[
            ["Initialize", "Name it and pick a role."],
            ["Equip", "Choose up to four modules."],
            ["Execute", "Run a starter mission in the sandbox."],
            ["Evaluate", "Read the log and the score breakdown."],
          ].map(([t, b], i) => (
            <li key={t} className="bg-carbon p-5">
              <div className="font-mono text-xs text-forge">0{i + 1}</div>
              <div className="mt-4 font-display font-semibold">{t}</div>
              <p className="mt-1 text-sm text-steel">{b}</p>
            </li>
          ))}
        </ol>
        <Link href="/app/forge" className="btn btn-primary h-11 px-5">
          Forge an agent
        </Link>
      </div>
    );
  }

  const progress = agents.map((a) => ({ agent: a, p: agentProgress(db, a.id) }));
  const runs = db.runs.filter((r) => r.ownerId === me).sort((a, b) => b.createdAt - a.createdAt);
  const recent = runs[0];
  const recentMission = recent && MISSIONS.find((m) => m.slug === recent.missionSlug);
  const totalXp = progress.reduce((s, x) => s + x.p.xp, 0);
  const valid = progress.reduce((s, x) => s + x.p.validRuns, 0);

  const lead = [...progress].sort((a, b) => b.p.xp - a.p.xp)[0];
  const next =
    MISSIONS.find((m) => !m.compute && !lead.p.best[m.slug] && !db.missions[m.slug]?.paused) ??
    MISSIONS.find((m) => !m.compute && !db.missions[m.slug]?.paused);
  const expected = next
    ? forecast(next, { role: lead.agent.role, style: lead.agent.style, skills: lead.agent.skills, level: lead.p.level })
    : null;

  return (
    <div className="space-y-8">
      <PageHead
        kicker={`${season.name} · Open demo`}
        title="Overview"
        actions={
          <Link href="/app/forge" className="btn btn-primary">
            New agent
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Season" value={season.name.replace("Season ", "S")} sub={season.status === "active" ? "Active" : season.status} />
        <Stat label="Your agents" value={agents.length} sub="Max 5 active" />
        <Stat label="Total XP" value={totalXp} sub="Across all agents" />
        <Stat label="Valid runs" value={valid} sub={`${runs.length} runs started`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="panel">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="label">Recent run</span>
            <Link href="/app/runs" className="text-xs text-steel hover:text-ink">
              All runs
            </Link>
          </div>
          {recent && recentMission ? (
            <RecentRun id={recent.id} />
          ) : (
            <div className="p-5 text-sm text-steel">No runs yet. Pick a mission below to start.</div>
          )}
        </div>

        {next && (
          <div className="panel tick p-5">
            <div className="label">Suggested mission</div>
            <div className="mt-3 font-display text-xl font-semibold">{next.name}</div>
            <p className="mt-2 text-sm text-steel">{next.summary}</p>
            <div className="mt-4 text-xs text-dim">
              Expected score for {lead.agent.name}: <span className="font-mono text-ink">~{expected}</span> based on its current config.
            </div>
            <Link href={`/app/missions/${next.slug}`} className="btn btn-primary mt-5">
              Review mission
            </Link>
          </div>
        )}
      </div>

      <div>
        <div className="label mb-3">Progression</div>
        <div className="grid gap-3 md:grid-cols-2">
          {progress.map(({ agent, p }) => (
            <Link key={agent.id} href={`/app/agents/${agent.id}`} className="panel block p-4 hover:border-[#4a4a4a]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="font-mono text-[11px] text-dim">{agentCode(agent.id)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">LV {p.level}</div>
                  <div className="font-mono text-[11px] text-dim">{p.xp} XP</div>
                </div>
              </div>
              <Meter className="mt-4" value={p.xp - p.levelFloor} max={(p.levelNext ?? p.xp) - p.levelFloor || 1} />
              <div className="mt-2 flex justify-between text-[11px] text-dim">
                <span>{Object.keys(p.best).length} of {MISSIONS.length} missions</span>
                <span>{p.levelNext ? `${p.levelNext - p.xp} XP to LV ${p.level + 1}` : "Max level"}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  function RecentRun({ id }: { id: string }) {
    const run = runs.find((r) => r.id === id)!;
    const view = viewRun(run);
    const agent = db.agents.find((a) => a.id === run.agentId);
    return (
      <Link href={`/app/runs/${run.id}`} className="block p-5 hover:bg-graphite/40">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold">{recentMission!.name}</span>
          <StatusPill status={view.status} />
        </div>
        <div className="mt-1 font-mono text-[11px] text-dim">
          {runCode(run.id)} · {agent?.name} · {ago(run.createdAt)}
        </div>
        <div className="mt-5 flex items-end gap-3">
          <span className="font-display text-4xl font-semibold tabular-nums">{view.finished && view.status === "completed" ? run.sim.score.total : "··"}</span>
          <span className="mb-1.5 text-sm text-dim">/ 100</span>
        </div>
        <p className="mt-2 text-sm text-steel">{view.finished ? run.sim.summary : "Run in progress. Open it to follow the log."}</p>
      </Link>
    );
  }
}
