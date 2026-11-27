import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/copy-link";
import { DemoTag, Meter, PageHead, Stat, StatusPill } from "@/components/ui";
import { BADGES, CATEGORY_LABEL, MISSIONS, getPreset, getSkill, getStyle } from "@/lib/catalog";
import { read } from "@/lib/db";
import { competence } from "@/lib/engine";
import { computeProgress, viewRun } from "@/lib/forge";
import { agentCode, date, dateTime, runCode } from "@/lib/format";
import { currentAccountId } from "@/lib/session";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATS: Category[] = ["reasoning", "research", "planning", "structure", "memory", "simulation", "adaptation", "compute"];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = (await read()).agents.find((x) => x.id === id);
  return { title: a ? `${a.name} · ${agentCode(a.id)}` : "Agent" };
}

export default async function AgentProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const me = await currentAccountId();
  const db = await read();
  const agent = db.agents.find((a) => a.id === id);
  if (!agent) notFound();
  const owner = agent.ownerId === me;
  if (!owner && agent.visibility !== "public") notFound();

  const runs = db.runs.filter((r) => r.agentId === agent.id).sort((a, b) => b.createdAt - a.createdAt);
  const p = computeProgress(runs);
  const config = { role: agent.role, style: agent.style, skills: agent.skills, level: p.level };

  return (
    <div className="space-y-8">
      {created && (
        <div className="panel tick flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">Agent initialized.</div>
            <div className="text-sm text-steel">Next step: pick a starter mission and run it in the sandbox.</div>
          </div>
          <Link href="/app/missions" className="btn btn-primary">
            Choose a mission
          </Link>
        </div>
      )}

      <PageHead
        kicker={`${agentCode(agent.id)} · config v${agent.configVersion} · created ${date(agent.createdAt)}`}
        title={agent.name}
        actions={
          <>
            {agent.visibility === "public" && <CopyLink path={`/app/agents/${agent.id}`} />}
            {owner && agent.status === "active" && (
              <>
                <Link href={`/app/agents/${agent.id}/edit`} className="btn">
                  Edit config
                </Link>
                <Link href="/app/missions" className="btn btn-primary">
                  Run a mission
                </Link>
              </>
            )}
          </>
        }
      >
        <span className="flex flex-wrap items-center gap-2">
          {agent.demo && <DemoTag />}
          {agent.status !== "active" && <span className="font-mono text-xs uppercase text-bad">{agent.status}</span>}
          <span>{agent.objective}</span>
        </span>
      </PageHead>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Level" value={p.level} sub={p.levelNext ? `${p.levelNext - p.xp} XP to next` : "Max level"} />
        <Stat label="XP" value={p.xp} sub="Nontransferable" />
        <Stat label="Reputation" value={p.reputation} sub="Mean best score, coverage weighted" />
        <Stat label="Valid runs" value={p.validRuns} sub={`${runs.length} total`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="panel">
          <div className="border-b border-line px-5 py-3">
            <div className="label">Skill matrix</div>
          </div>
          <div className="space-y-2 px-5 py-4 text-sm">
            <Row k="Role" v={getPreset(agent.role)?.name} />
            <Row k="Style" v={getStyle(agent.style)?.name} />
            <Row k="Visibility" v={agent.visibility} />
            <Row k="Compute" v={!agent.gpu ? "No GPU" : agent.gpu === "auto" ? "Auto router" : agent.gpu.replace(/^NVIDIA (GeForce )?/, "")} />
          </div>
          <div className="border-t border-line px-5 py-4">
            <div className="flex flex-wrap gap-1.5">
              {agent.skills.map((s) => {
                const sk = getSkill(s);
                return (
                  <span key={s} title={sk?.limits} className="rounded-[2px] border border-forge/40 px-2 py-1 text-[12px]">
                    {sk?.name} <span className="font-mono text-[10px] text-dim">v{sk?.version}</span>
                  </span>
                );
              })}
            </div>
            <div className="mt-5 space-y-2.5">
              {CATS.map((c) => {
                const v = competence(config, c);
                return (
                  <div key={c} className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-3 text-[12px]">
                    <span className="text-steel">{CATEGORY_LABEL[c]}</span>
                    <Meter value={v - 0.3} max={0.6} />
                    <span className="text-right font-mono text-dim">{Math.round(v * 100)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="border-b border-line px-5 py-3">
            <div className="label">Performance by mission</div>
          </div>
          <div className="divide-y divide-line">
            {MISSIONS.map((m) => {
              const b = p.best[m.slug];
              return (
                <div key={m.slug} className="grid grid-cols-[3rem_1fr_6rem_2.5rem] items-center gap-3 px-5 py-2.5 text-sm">
                  <span className="font-mono text-[11px] text-dim">{m.code}</span>
                  <span>{m.name}</span>
                  <Meter value={b?.score ?? 0} max={100} />
                  <span className="text-right font-mono text-[12px]">{b ? b.score : <span className="text-dim">n/a</span>}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="label mb-3">Badges</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((b) => {
            const got = p.badges.find((x) => x.slug === b.slug);
            return (
              <div key={b.slug} className={`panel flex gap-3 p-4 ${got ? "" : "opacity-40"}`}>
                <span className={`mt-0.5 size-3 shrink-0 rotate-45 border ${got ? "border-forge bg-forge" : "border-line"}`} />
                <div>
                  <div className="text-sm font-medium">{b.name}</div>
                  <div className="text-xs text-steel">{b.description}</div>
                  {got && <div className="mt-1 font-mono text-[10px] text-dim">Earned {date(got.earnedAt)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="label mb-3">Mission history</div>
        {runs.length === 0 ? (
          <div className="panel p-5 text-sm text-steel">No runs yet.</div>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {["Run", "Mission", "Status", "Score", "XP", "Started"].map((h) => (
                    <th key={h} className="label px-4 py-2.5 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 30).map((r) => {
                  const v = viewRun(r);
                  const m = MISSIONS.find((x) => x.slug === r.missionSlug);
                  return (
                    <tr key={r.id} className="border-b border-line last:border-b-0 hover:bg-graphite/40">
                      <td className="px-4 py-2.5 font-mono text-[12px]">
                        <Link href={`/app/runs/${r.id}`} className="hover:text-forge">
                          {runCode(r.id)}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        {m?.name} <span className="text-dim">S{r.season}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill status={v.status} />
                      </td>
                      <td className="px-4 py-2.5 font-mono">{v.finished && v.status === "completed" ? r.sim.score.total : "··"}</td>
                      <td className="px-4 py-2.5 font-mono text-forge">{p.xpByRun[r.id] ? `+${p.xpByRun[r.id]}` : <span className="text-dim">0</span>}</td>
                      <td className="px-4 py-2.5 text-[12px] text-dim">{dateTime(r.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-dim">{k}</span>
      <span className="capitalize">{v}</span>
    </div>
  );
}
