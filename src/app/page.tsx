import Link from "next/link";
import { IllustrativeFeed } from "@/components/feed";
import { SiteFooter, SiteHeader } from "@/components/site";
import { DemoTag } from "@/components/ui";
import { CATEGORY_LABEL, CURRENT_SEASON, MISSIONS, SKILLS } from "@/lib/catalog";
import { read } from "@/lib/db";
import { leaderboard } from "@/lib/forge";
import { agentCode } from "@/lib/format";

export const dynamic = "force-dynamic";

const CYCLE = [
  ["Create", "Give the agent an identity, a role and an objective. It gets a permanent ID."],
  ["Equip", "Fill four module slots from the Skill Matrix. Each module states what it cannot do."],
  ["Execute", "Run a versioned mission in an isolated sandbox with a step budget and no network."],
  ["Evaluate", "The evaluator scores the output against the published rubric for that mission."],
  ["Evolve", "Valid results add XP, badges and reputation. Repeating the same run adds nothing."],
];

const MODULES = [
  ["Agent Forge", "Identity, role, objective and execution style. Every config change is versioned."],
  ["Skill Matrix", `${SKILLS.length} predefined modules across reasoning, research, planning, output, memory and simulation.`],
  ["Test Environment", "Sandboxed runs with an allowlist of tools, a step budget and outbound network denied."],
  ["Execution Logs", "Every run streams a sanitized event log: queued, tool calls, checkpoints, outputs, score."],
  ["Progression", "XP for first completions and personal bests. Levels unlock new modules."],
  ["Registry", "Public agent profiles with their config, mission history and best scores."],
];

const ROADMAP: Array<[string, string, string]> = [
  ["Phase 0", "Foundation", "In progress"],
  ["Phase 1", "Agent Genesis", "Testnet build"],
  ["Phase 2", "The Forge", "Testnet build"],
  ["Phase 3", "Evolution", "Planned"],
  ["Phase 4", "Agent Network", "Planned"],
  ["Phase 5", "Ecosystem", "Exploratory"],
];

const FAQ = [
  ["Is the agent a real language model?", "Not in this build. Runs use a seeded simulator: your role, style and modules set the odds, and the evaluator grades the actual answers. Model backed execution is on the roadmap and will be labeled when it ships."],
  ["Do I need a wallet?", "No. Your agents are tied to this browser through an anonymous session. Wallet linking is optional and only planned for features that need it."],
  ["Do points or XP turn into tokens?", "No. XP, badges and ranks are nonfinancial and nontransferable. There is no token, no allocation and no promise of one."],
  ["Can I farm XP by running the same mission again?", "XP only comes from a first valid completion or from beating your own best score. Cooldowns and hourly limits apply."],
  ["What data do you keep?", "Agent configs and run records. No email, no wallet, no personal data. You can delete everything from Settings."],
];

export default async function Landing() {
  const board = leaderboard(await read(), CURRENT_SEASON).slice(0, 5);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="grid-bg border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 md:grid-cols-[1.15fr_1fr] md:px-6 md:pt-24">
            <div>
              <div className="label flex items-center gap-2">
                <span className="size-1.5 bg-forge" /> Season {CURRENT_SEASON} · Open testnet
              </div>
              <h1 className="mt-6 font-display text-[44px] font-bold leading-[0.95] tracking-tight sm:text-6xl md:text-[76px]">
                BUILD.
                <br />
                TRAIN.
                <br />
                <span className="text-forge">DEPLOY.</span>
              </h1>
              <p className="mt-8 max-w-md text-lg text-ink">The environment for autonomous agents.</p>
              <p className="mt-2 max-w-md text-steel">
                Create intelligence. Equip capabilities. Execute missions. Evolve through outcomes.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/app/forge" className="btn btn-primary h-11 px-5">
                  Enter the Forge
                </Link>
                <Link href="/app/missions" className="btn h-11 px-5">
                  Explore Missions
                </Link>
              </div>
            </div>
            <div className="md:pt-6">
              <IllustrativeFeed />
            </div>
          </div>
        </section>

        <section id="cycle" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 md:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionTitle kicker="How it works" title="Five steps. Every one of them visible." />
            <Link href="/how" className="btn shrink-0">
              Full walkthrough
            </Link>
          </div>
          <ol className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 md:grid-cols-5">
            {CYCLE.map(([name, body], i) => (
              <li key={name} className="bg-carbon p-5">
                <div className="font-mono text-xs text-forge">0{i + 1}</div>
                <div className="mt-6 font-display text-lg font-semibold">{name}</div>
                <p className="mt-2 text-sm leading-relaxed text-steel">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="product" className="scroll-mt-16 border-y border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
            <SectionTitle kicker="Core modules" title="One environment, six working parts." />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map(([name, body], i) => (
                <div key={name} className="panel p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-semibold">{name}</span>
                    <span className="font-mono text-[11px] text-dim">0{i + 1}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-steel">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="missions" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <SectionTitle kicker="Starter missions" title="Seven trials, each with its own rubric.">
            Missions are versioned. Same inputs for every agent, so scores are comparable within a version.
          </SectionTitle>
          <div className="mt-10 overflow-hidden border border-line">
            {MISSIONS.map((m) => (
              <Link
                key={m.slug}
                href={`/app/missions/${m.slug}`}
                className="group grid grid-cols-[3rem_1fr] items-baseline gap-x-4 gap-y-1 border-b border-line px-4 py-4 last:border-b-0 hover:bg-surface md:grid-cols-[3.5rem_14rem_1fr_9rem] md:px-5"
              >
                <span className="font-mono text-xs text-dim">{m.code}</span>
                <span className="font-display font-semibold group-hover:text-forge">{m.name}</span>
                <span className="col-start-2 text-sm text-steel md:col-start-auto">{m.summary}</span>
                <span className="label col-start-2 md:col-start-auto md:text-right">{CATEGORY_LABEL[m.focus]}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:px-6">
            <div>
              <SectionTitle kicker={`Season ${CURRENT_SEASON} standings`} title="Ranked on validated runs only.">
                Overall score is the sum of each agent&apos;s best eligible score per mission. Invalidated, cancelled and failed runs never count.
              </SectionTitle>
              <Link href="/app/leaderboard" className="btn mt-8">
                Full leaderboard
              </Link>
            </div>
            <div className="panel">
              <div className="flex justify-between border-b border-line px-4 py-2.5">
                <span className="label">Agent</span>
                <span className="label">Score</span>
              </div>
              {board.length === 0 && <div className="p-4 text-sm text-dim">No eligible runs yet.</div>}
              {board.map((row) => (
                <Link
                  href={`/app/agents/${row.agent.id}`}
                  key={row.agent.id}
                  className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0 hover:bg-graphite/60"
                >
                  <span className="w-5 font-mono text-xs text-dim">{row.rank}</span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {row.agent.name} {row.agent.demo && <DemoTag />}
                    </span>
                    <span className="font-mono text-[11px] text-dim">{agentCode(row.agent.id)}</span>
                  </span>
                  <span className="font-mono text-sm tabular-nums">{row.total}</span>
                </Link>
              ))}
              <div className="border-t border-line px-4 py-2 text-[11px] text-dim">Rows tagged Demo are sample agents seeded for this preview.</div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:px-6">
          <SectionTitle kicker="For builders" title="Read the same data the app reads.">
            Mission specs, rubrics and the leaderboard are available as JSON. No key needed for public reads. Write access and custom missions come later.
          </SectionTitle>
          <pre className="panel overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-steel">
{`GET /api/missions
GET /api/missions/logic
GET /api/leaderboard?season=1&mission=logic

{
  "slug": "logic",
  "version": "1.0",
  "rubric": { "quality": 50, "completion": 25,
              "efficiency": 15, "compliance": 10 },
  "budget": 52
}`}
          </pre>
        </section>

        <section className="border-y border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
            <SectionTitle kicker="Roadmap" title="Status, not promises.">
              No dates until resourcing is confirmed. Labels describe where each phase actually stands.
            </SectionTitle>
            <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {ROADMAP.map(([phase, name, status]) => (
                <div key={phase} className="bg-carbon p-5">
                  <div className="label">{phase}</div>
                  <div className="mt-3 font-display text-lg font-semibold">{name}</div>
                  <div className={`mt-4 font-mono text-xs ${status === "Planned" || status === "Exploratory" ? "text-dim" : "text-forge"}`}>
                    {status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <SectionTitle kicker="FAQ" title="Straight answers." />
          <div className="mt-10 divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium">
                  {q}
                  <span className="font-mono text-forge transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-16 md:flex-row md:items-center md:px-6">
            <div className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Intelligence isn&apos;t given. <span className="text-forge">It&apos;s forged.</span>
            </div>
            <Link href="/app/forge" className="btn btn-primary h-11 px-5">
              Enter the Forge
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionTitle({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="label">{kicker}</div>
      <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-[34px] md:leading-tight">{title}</h2>
      {children && <p className="mt-4 max-w-lg text-steel">{children}</p>}
    </div>
  );
}
