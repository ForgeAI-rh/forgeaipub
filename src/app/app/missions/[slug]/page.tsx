import { notFound } from "next/navigation";
import { StartRun } from "@/components/start-run";
import { PageHead } from "@/components/ui";
import { CATEGORY_LABEL, EVALUATOR_VERSION, RUNTIME_VERSION, SKILLS, getMission } from "@/lib/catalog";
import { read } from "@/lib/db";
import { forecast } from "@/lib/engine";
import { LIMITS, agentProgress } from "@/lib/forge";
import { agentCode, date } from "@/lib/format";
import { currentAccountId } from "@/lib/session";
import type { Rubric } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const m = getMission((await params).slug);
  return { title: m?.name ?? "Mission" };
}

export default async function MissionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) notFound();

  const me = await currentAccountId();
  const db = await read();
  const control = db.missions[slug];
  const cats = new Set(mission.tasks.map((t) => t.category));
  const helpful = SKILLS.filter((s) => Object.keys(s.bonus).some((c) => cats.has(c as never)) || (mission.mechanic === "chain" && s.recovery));

  const agents = (me ? db.agents.filter((a) => a.ownerId === me && a.status === "active") : []).map((a) => {
    const p = agentProgress(db, a.id);
    return {
      id: a.id,
      name: a.name,
      code: agentCode(a.id),
      expected: forecast(mission, { role: a.role, style: a.style, skills: a.skills, level: p.level }),
      best: p.best[slug]?.score ?? null,
      missing: helpful.filter((s) => !a.skills.includes(s.id) && s.unlockLevel <= p.level).map((s) => s.name).slice(0, 3),
    };
  });

  return (
    <div className="space-y-8">
      <PageHead kicker={`${mission.code} · v${mission.version} · ${CATEGORY_LABEL[mission.focus]}`} title={mission.name}>
        {mission.summary}
      </PageHead>

      {control?.paused && (
        <div className="panel border-bad/50 px-5 py-3 text-sm">
          <span className="text-bad">Paused by moderators</span>
          <span className="text-steel">
            {" "}
            since {control.at ? date(control.at) : "recently"}. Reason: {control.reason}
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Section title="Objective">
            <p className="text-sm leading-relaxed text-steel">{mission.objective}</p>
          </Section>

          <Section title="Input and data source">
            <p className="text-sm text-steel">{mission.input}</p>
            {mission.context && (
              <ul className="mt-3 space-y-1.5 border-l border-forge/50 pl-4 font-mono text-[12.5px] text-steel">
                {mission.context.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-dim hover:text-steel">Show the {mission.tasks.length} task prompts</summary>
              <ol className="mt-3 space-y-1.5 text-[13px] text-steel">
                {mission.tasks.map((t) => (
                  <li key={t.id} className="flex gap-3">
                    <span className="w-6 shrink-0 font-mono text-[11px] text-dim">{t.id}</span>
                    <span>{t.prompt}</span>
                  </li>
                ))}
              </ol>
            </details>
          </Section>

          <Section title="Constraints">
            <ul className="space-y-1.5 text-sm text-steel">
              {mission.constraints.map((c) => (
                <li key={c} className="flex gap-3">
                  <span className="mt-[7px] size-1 shrink-0 bg-forge" />
                  {c}
                </li>
              ))}
              <li className="flex gap-3">
                <span className="mt-[7px] size-1 shrink-0 bg-forge" />
                Outbound network denied. Only equipped modules are on the tool allowlist.
              </li>
            </ul>
          </Section>

          <Section title="Evaluation rubric" aside={`${EVALUATOR_VERSION} · 100 points`}>
            <div className="divide-y divide-line border-y border-line">
              {(Object.keys(mission.rubric) as Array<keyof Rubric>).map((k) => (
                <div key={k} className="grid grid-cols-[7rem_3rem_1fr] gap-3 py-2.5 text-sm">
                  <span className="capitalize">{k}</span>
                  <span className="font-mono text-forge">{mission.rubric[k]}</span>
                  <span className="text-steel">{mission.rubricNotes[k]}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="panel tick p-5">
            <div className="label mb-4">Run this mission</div>
            <StartRun mission={mission.slug} agents={agents} paused={Boolean(control?.paused)} />
          </div>
          <div className="panel p-5 text-[12.5px] leading-relaxed text-steel">
            <div className="label mb-3">Before you run</div>
            <ul className="space-y-2">
              <li>Budget: {mission.budget} steps. The run stops when it is spent.</li>
              <li>Runtime: {RUNTIME_VERSION}, a seeded simulator. Scores vary between runs.</li>
              <li>XP comes from a first valid completion or a new personal best only.</li>
              <li>
                Limits: {LIMITS.activeRuns} active runs, {LIMITS.runsPerHour} per hour, {LIMITS.cooldownMs / 1000}s cooldown per agent and mission.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="label text-steel">{title}</h2>
        {aside && <span className="font-mono text-[11px] text-dim">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
