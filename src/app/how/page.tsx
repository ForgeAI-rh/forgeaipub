import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";
import {
  EVALUATOR_VERSION,
  LEVELS,
  RUNTIME_VERSION,
  SKILL_SLOTS,
  getMission,
  getSkill,
} from "@/lib/catalog";
import { competence, simulate, successChance } from "@/lib/engine";
import { LIMITS } from "@/lib/forge";
import type { ConfigSnapshot, Rubric } from "@/lib/types";

export const metadata = {
  title: "How it works",
  description: "From a blank agent to a ranked result: the forging cycle, what happens inside a run and how scores are calculated.",
};

const CYCLE = [
  {
    step: "Initialize",
    title: "Give the agent an identity",
    body: "Pick a name and write the objective in one sentence. The agent gets a permanent ID that follows it through every run, profile and ranking.",
    detail: ["Permanent ID such as AGT:7F3K9A", "No wallet needed, linked to your browser session", "Up to 5 active agents per account"],
  },
  {
    step: "Configure",
    title: "Choose how it thinks",
    body: "A role sets the agent's natural strengths. An execution style sets the tradeoff between accuracy and speed.",
    detail: ["Analyst, Planner, Researcher, Executor", "Methodical is more accurate and spends more steps", "Rapid saves budget and loses some accuracy"],
  },
  {
    step: "Equip",
    title: "Fill the module slots",
    body: `Choose up to ${SKILL_SLOTS} modules from the Skill Matrix. Every module says what it is good at and, just as clearly, what it cannot do.`,
    detail: ["10 predefined modules, no arbitrary code", "Some modules unlock at higher levels", "Every config change creates a new version"],
  },
  {
    step: "Execute",
    title: "Run a mission in the sandbox",
    body: "The mission page shows the objective, inputs, constraints and rubric before anything starts. Then the run streams its log live.",
    detail: ["Outbound network denied", "Only equipped modules are allowed as tools", "Fixed step budget per mission"],
  },
  {
    step: "Evaluate",
    title: "Get a score you can check",
    body: "The evaluator grades every output against the published rubric. You see each answer next to the expected one, so nothing about the score is hidden.",
    detail: ["100 points split across four parts", "Weights differ per mission", "Evaluator version stored on every run"],
  },
  {
    step: "Evolve",
    title: "Earn progress that means something",
    body: "XP comes from a first valid completion or from beating your own best. Running the same mission again for nothing earns nothing.",
    detail: ["20 XP plus half the score on a first completion", "Later runs pay only the improvement", "Levels unlock new modules"],
  },
  {
    step: "Compete",
    title: "Climb the season rankings",
    body: "Each agent's best eligible score per mission is summed for the season. Failed, cancelled and invalidated runs never count.",
    detail: ["Overall and per mission rankings", "Ties go to whoever got there first", "Moderators review suspicious runs"],
  },
];

const PIPELINE = [
  ["Request", "You press Start. The API checks the agent belongs to you and the mission is live."],
  ["Quota", `Fair use check: ${LIMITS.activeRuns} active runs, ${LIMITS.runsPerHour} per hour, a short cooldown per mission.`],
  ["Queue", "The run is recorded with a snapshot of the agent config, so later edits never change it."],
  ["Sandbox", "An isolated worker starts with no network and only the equipped modules."],
  ["Execute", "Tasks run one by one. Every tool call, output and checkpoint goes to the log."],
  ["Evaluate", "The evaluator scores the outputs against the rubric for that mission version."],
  ["Progress", "If the run is valid, XP, badges and the leaderboard update."],
];

const REAL = [
  ["Mission content, answer keys and rubrics", "Real and published. Same inputs for every agent in a version."],
  ["Evaluator and score math", "Real. Outputs are graded exactly as described on this page."],
  ["Rate limits, cooldowns, moderation", "Real and enforced on the server."],
  ["XP, levels, badges, rankings", "Real within the testnet. Nonfinancial and nontransferable."],
  ["The agent's answers", `Simulated by ${RUNTIME_VERSION}. Config sets the odds, a seeded draw picks the outcome.`],
  ["Demo agents on the leaderboard", "Sample records, tagged Demo everywhere they appear."],
];

const EXAMPLE_CONFIG: ConfigSnapshot = {
  role: "analyst",
  style: "balanced",
  skills: ["deductive_core", "pattern_lens", "schema_writer"],
  level: 1,
};

function pickExample() {
  const mission = getMission("logic")!;
  for (let seed = 1; seed < 500; seed++) {
    const sim = simulate(mission, EXAMPLE_CONFIG, seed);
    const right = sim.results.filter((r) => r.correct).length;
    const viol = sim.results.filter((r) => r.violation).length;
    if (right === 5 && viol === 1) return { mission, sim, seed };
  }
  return { mission, sim: simulate(mission, EXAMPLE_CONFIG, 1), seed: 1 };
}

export default function HowItWorks() {
  const { mission, sim, seed } = pickExample();
  const comp = competence(EXAMPLE_CONFIG, "reasoning");
  const attempted = sim.results.filter((r) => r.given !== null);
  const right = sim.results.filter((r) => r.correct).length;
  const viol = attempted.filter((r) => r.violation).length;
  const reference = attempted.reduce((s, r) => s + (mission.tasks.find((t) => t.id === r.taskId)?.steps ?? 0), 0);
  const parts: Array<[keyof Rubric, string]> = [
    ["quality", `${right} of ${sim.results.length} correct × ${mission.rubric.quality}`],
    ["completion", `${attempted.length} of ${sim.results.length} attempted × ${mission.rubric.completion}`],
    ["efficiency", `1.5 minus ${sim.stepsUsed} steps ÷ ${reference} reference, × ${mission.rubric.efficiency}, capped at full marks`],
    ["compliance", `${attempted.length - viol} of ${attempted.length} in format × ${mission.rubric.compliance}`],
  ];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="grid-bg border-b border-line">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 md:px-6 md:pt-20">
            <div className="label">How it works</div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">
              From a blank agent to a ranked result.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-steel">
              Seven steps, one sandbox and a rubric you can read before you start. Here is exactly what happens, including the parts that are still simulated.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {CYCLE.map((c, i) => (
                <a key={c.step} href={`#${c.step.toLowerCase()}`} className="rounded-[2px] border border-line bg-carbon px-3 py-1.5 font-mono text-[12px] text-steel hover:border-forge hover:text-ink">
                  0{i + 1} {c.step}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="label">The forging cycle</div>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-[34px]">Seven steps, in order.</h2>
          <ol className="mt-12 border-l border-line">
            {CYCLE.map((c, i) => (
              <li key={c.step} id={c.step.toLowerCase()} className="relative scroll-mt-24 pb-12 pl-8 last:pb-0 md:pl-12">
                <span className="absolute -left-[5px] top-1.5 size-[9px] bg-forge" />
                <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:gap-12">
                  <div>
                    <div className="font-mono text-xs text-forge">
                      0{i + 1} · {c.step.toUpperCase()}
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold">{c.title}</h3>
                    <p className="mt-3 leading-relaxed text-steel">{c.body}</p>
                  </div>
                  <div className="space-y-3">
                    <StepVisual step={c.step} />
                    <ul className="space-y-1.5 text-sm text-steel">
                      {c.detail.map((d) => (
                        <li key={d} className="flex gap-3">
                          <span className="mt-[9px] size-1 shrink-0 bg-forge" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
            <div className="label">Inside a run</div>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-[34px]">What happens after you press Start.</h2>
            <ol className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-7">
              {PIPELINE.map(([name, body], i) => (
                <li key={name} className="bg-carbon p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-dim">0{i + 1}</span>
                    {i < PIPELINE.length - 1 && <span className="hidden font-mono text-[11px] text-forge lg:inline">→</span>}
                  </div>
                  <div className="mt-4 font-display font-semibold">{name}</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-steel">{body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 max-w-2xl text-sm text-dim">
              Run states shown in the app: Queued, Running, Evaluating, then Completed, Failed, Cancelled or Invalidated.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="label">Worked example</div>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-[34px]">One Logic Trial run, scored line by line.</h2>
          <p className="mt-4 max-w-2xl text-steel">
            Computed on this page by the same engine the app uses. Agent: Analyst, Balanced, with {EXAMPLE_CONFIG.skills.map((s) => getSkill(s)?.name).join(", ")}. Seed {seed}.
          </p>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left">
                    {["Task", "Agent output", "Expected", "Result"].map((h) => (
                      <th key={h} className="label px-4 py-2.5 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sim.results.map((r) => (
                    <tr key={r.taskId} className="border-b border-line align-top last:border-b-0">
                      <td className="px-4 py-2.5">
                        <div className="font-mono text-[11px] text-dim">{r.taskId}</div>
                        <div className="mt-0.5 max-w-[240px] text-steel">{r.prompt}</div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px]">
                        {r.given}
                        {r.violation && <div className="mt-0.5 text-[11px] text-forge">format violation</div>}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-steel">{r.expected}</td>
                      <td className="px-4 py-2.5">{r.correct ? <span className="text-ok">Pass</span> : <span className="text-bad">Miss</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="panel tick p-5">
                <div className="label">Score math</div>
                <div className="mt-4 space-y-3">
                  {parts.map(([k, how]) => (
                    <div key={k} className="flex items-start justify-between gap-4 text-sm">
                      <div>
                        <div className="capitalize">{k}</div>
                        <div className="text-[12px] text-dim">{how}</div>
                      </div>
                      <div className="font-mono">
                        {sim.score[k]}
                        <span className="text-dim"> / {mission.rubric[k]}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
                  <span className="label">Total</span>
                  <span className="font-display text-4xl font-semibold">
                    {sim.score.total}
                    <span className="text-base text-dim"> / 100</span>
                  </span>
                </div>
              </div>
              <div className="panel p-5 text-sm text-steel">
                <div className="label mb-2">If this were a first completion</div>
                The agent would earn 20 + {sim.score.total} ÷ 2 = <span className="font-mono text-forge">{20 + Math.floor(sim.score.total / 2)} XP</span>. A later run on the same mission
                would pay only the points above {sim.score.total}.
              </div>
            </div>
          </div>

          <div className="mt-6 panel p-5 text-sm leading-relaxed text-steel">
            <div className="label mb-2">Where the odds come from</div>
            This config has a reasoning competence of <span className="font-mono text-ink">{Math.round(comp * 100)}</span>. Against the easiest task here (difficulty 25) that gives a{" "}
            <span className="font-mono text-ink">{Math.round(successChance(comp, 0.25) * 100)}%</span> chance of the right answer, and against the hardest (difficulty 65) a{" "}
            <span className="font-mono text-ink">{Math.round(successChance(comp, 0.65) * 100)}%</span> chance. Swap a module or the style and these numbers move. That is the whole game.
          </div>
        </section>

        <section className="border-y border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
            <div className="label">Honest about the build</div>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-[34px]">What is real today, and what is simulated.</h2>
            <div className="mt-10 divide-y divide-line border-y border-line">
              {REAL.map(([what, status]) => (
                <div key={what} className="grid gap-1 py-4 md:grid-cols-[22rem_1fr] md:gap-8">
                  <div className="font-medium">{what}</div>
                  <div className="text-sm text-steel">{status}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-sm text-dim">
              A model backed runtime is planned. When it ships it gets its own version label next to {RUNTIME_VERSION}, and scores from the two are never mixed. Current evaluator: {EVALUATOR_VERSION}.
            </p>
          </div>
        </section>

        <section className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-16 md:flex-row md:items-center md:px-6">
          <div>
            <div className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Ready to forge one?</div>
            <p className="mt-2 text-steel">It takes about a minute. No wallet, no signup.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/docs" className="btn h-11 px-5">
              Read the docs
            </Link>
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

function StepVisual({ step }: { step: string }) {
  const frame = "panel p-4 font-mono text-[12px]";
  switch (step) {
    case "Initialize":
      return (
        <div className={frame}>
          <div className="text-dim">NAME</div>
          <div className="text-ink">Kestrel</div>
          <div className="mt-2 text-dim">ID</div>
          <div className="text-forge">AGT:7F3K9A</div>
        </div>
      );
    case "Configure":
      return (
        <div className={`${frame} grid grid-cols-3 gap-2 text-center`}>
          {["Methodical", "Balanced", "Rapid"].map((s) => (
            <div key={s} className={`rounded-[2px] border px-2 py-2 ${s === "Balanced" ? "border-forge text-ink" : "border-line text-dim"}`}>
              {s}
            </div>
          ))}
        </div>
      );
    case "Equip":
      return (
        <div className={`${frame} grid grid-cols-2 gap-2`}>
          {["Deductive Core", "Pattern Lens", "Schema Writer", "empty slot"].map((s, i) => (
            <div key={s} className={`rounded-[2px] border px-2 py-2 ${i < 3 ? "border-forge/50 text-ink" : "border-dashed border-line text-dim"}`}>
              {s}
            </div>
          ))}
        </div>
      );
    case "Execute":
      return (
        <div className={`${frame} space-y-1`}>
          <div><span className="text-dim">+01.0s </span><span className="text-steel">Sandbox started</span></div>
          <div><span className="text-dim">+02.3s </span><span className="text-steel">L1 · Deductive Core</span></div>
          <div><span className="text-dim">+02.8s </span><span className="text-ink">L1 → 63</span></div>
        </div>
      );
    case "Evaluate":
      return (
        <div className={`${frame} space-y-2`}>
          {(["quality", "completion", "efficiency", "compliance"] as const).map((k, i) => (
            <div key={k} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
              <span className="text-dim">{k}</span>
              <div className="h-1 bg-graphite">
                <div className="h-full bg-forge" style={{ width: `${[83, 100, 60, 90][i]}%` }} />
              </div>
            </div>
          ))}
        </div>
      );
    case "Evolve":
      return (
        <div className={frame}>
          <div className="flex justify-between text-dim">
            <span>LV 2</span>
            <span>
              180 / {LEVELS[2]} XP
            </span>
          </div>
          <div className="mt-2 h-1 bg-graphite">
            <div className="h-full bg-forge" style={{ width: "53%" }} />
          </div>
          <div className="mt-2 text-forge">+62 XP · First Ignition</div>
        </div>
      );
    default:
      return (
        <div className={`${frame} space-y-1.5`}>
          {[
            ["01", "Lattice", 553],
            ["02", "Quench", 498],
            ["03", "Your agent", 471],
          ].map(([r, n, s]) => (
            <div key={r} className="flex justify-between">
              <span>
                <span className="text-forge">{r}</span> <span className={n === "Your agent" ? "text-ink" : "text-steel"}>{n}</span>
              </span>
              <span className="text-steel">{s}</span>
            </div>
          ))}
        </div>
      );
  }
}
