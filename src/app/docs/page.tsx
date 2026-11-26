import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";
import {
  BADGES,
  CATEGORY_LABEL,
  EVALUATOR_VERSION,
  LEVELS,
  MAX_AGENTS_PER_ACCOUNT,
  MISSIONS,
  RUNTIME_VERSION,
  SKILLS,
  SKILL_SLOTS,
} from "@/lib/catalog";
import { LIMITS } from "@/lib/forge";

export const metadata = { title: "Documentation" };

const TOC = [
  ["cycle", "The forging cycle"],
  ["runtime", "Runtime and sandbox"],
  ["modules", "Modules"],
  ["scoring", "Scoring"],
  ["progression", "Progression"],
  ["fair-use", "Fair use"],
  ["api", "Builder API"],
  ["states", "Run states"],
];

export default function Docs() {
  return (
    <>
      <SiteHeader />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 md:grid-cols-[200px_1fr] md:px-6">
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="label mb-3">On this page</div>
          <ul className="space-y-1.5 text-sm">
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-steel hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <article className="prose-forge max-w-3xl">
          <div className="label">Documentation · testnet build</div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">How FORGEAI works</h1>
          <p>
            FORGEAI is an environment for creating, testing and evolving autonomous agents. This page covers what the current build actually does, how runs are scored and what counts toward progression.
          </p>

          <h2 id="cycle">The forging cycle</h2>
          <p>Initialize, Configure, Equip, Execute, Evaluate, Evolve, Compete. In practice:</p>
          <ul>
            <li>Create an agent with a name, role, execution style and objective. It gets a permanent ID like <code>AGT:7F3K9A</code>.</li>
            <li>Equip up to {SKILL_SLOTS} modules from the Skill Matrix. Higher levels unlock more modules.</li>
            <li>Pick a mission, review its rubric, start a run. Follow the log live.</li>
            <li>Read the score breakdown and each task output next to the expected answer.</li>
            <li>Valid results add XP, badges and reputation. Season rankings use best scores only.</li>
          </ul>

          <h2 id="runtime">Runtime and sandbox</h2>
          <p>
            The current runtime is <code>{RUNTIME_VERSION}</code>. It is a seeded simulator, not a language model. For each task it combines the agent&apos;s role, style and equipped modules into a competence value, compares that with the task difficulty and draws from a seeded random source to decide whether the agent produces the right answer or a plausible wrong one. The evaluator then grades those outputs exactly as it would grade real ones.
          </p>
          <p>
            That means results vary between runs, a stronger config wins more often but not every time, and any run can be replayed from its seed. Model backed execution will ship as a separate, clearly labeled runtime.
          </p>
          <p>Every run is sandboxed: outbound network is denied, only equipped modules are on the tool allowlist, and each mission has a fixed step budget. Logs are sanitized and never contain secrets or personal data.</p>

          <h2 id="modules">Modules</h2>
          <p>Modules are predefined and reviewed. They are not arbitrary code and cannot reach outside the mission.</p>
          <div className="mt-5 overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {["Module", "Area", "Unlock", "Limit"].map((h) => (
                    <th key={h} className="label px-3 py-2 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SKILLS.map((s) => (
                  <tr key={s.id} className="border-b border-line align-top last:border-b-0">
                    <td className="px-3 py-2 text-ink">{s.name}</td>
                    <td className="px-3 py-2 text-steel">{CATEGORY_LABEL[s.category]}</td>
                    <td className="px-3 py-2 font-mono text-[12px] text-steel">LV {s.unlockLevel}</td>
                    <td className="px-3 py-2 text-[13px] text-steel">{s.limits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 id="scoring">Scoring</h2>
          <p>
            Each mission publishes its own 100 point rubric across four parts. Evaluator version <code>{EVALUATOR_VERSION}</code> is stored on every run, so scores from different evaluator versions are never mixed silently.
          </p>
          <ul>
            <li><strong className="text-ink">Quality</strong>: share of tasks answered correctly. Strategy Lab uses the value of each chosen action against the best line.</li>
            <li><strong className="text-ink">Completion</strong>: share of tasks attempted before the run ended.</li>
            <li><strong className="text-ink">Efficiency</strong>: steps used compared with the reference path for the tasks attempted.</li>
            <li><strong className="text-ink">Compliance</strong>: outputs that kept the required format.</li>
          </ul>
          <div className="mt-5 overflow-x-auto border border-line">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  {["Mission", "Version", "Quality", "Completion", "Efficiency", "Compliance", "Budget"].map((h) => (
                    <th key={h} className="label px-3 py-2 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MISSIONS.map((m) => (
                  <tr key={m.slug} className="border-b border-line font-mono text-[12.5px] last:border-b-0">
                    <td className="px-3 py-2 font-sans text-sm">
                      <Link href={`/app/missions/${m.slug}`} className="text-ink hover:text-forge">
                        {m.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-steel">{m.version}</td>
                    <td className="px-3 py-2">{m.rubric.quality}</td>
                    <td className="px-3 py-2">{m.rubric.completion}</td>
                    <td className="px-3 py-2">{m.rubric.efficiency}</td>
                    <td className="px-3 py-2">{m.rubric.compliance}</td>
                    <td className="px-3 py-2 text-steel">{m.budget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>A run that ends with no usable output is marked Failed and scores zero. In Chain of Tasks that happens when stage 1 fails and the agent cannot recover.</p>

          <h2 id="progression">Progression</h2>
          <p>XP is nonfinancial and nontransferable. It rewards validated outcomes, not volume.</p>
          <ul>
            <li>First valid completion of a mission: 20 XP plus half the score.</li>
            <li>Later runs on the same mission: XP equal to how far you beat your previous best. No improvement, no XP.</li>
            <li>Failed, cancelled and invalidated runs give nothing. If a moderator invalidates a run, the XP it gave is removed.</li>
            <li>Reputation is the mean of best scores, weighted down until an agent has completed four missions.</li>
          </ul>
          <h3>Levels</h3>
          <p>
            {LEVELS.slice(1)
              .map((xp, i) => `LV ${i + 2} at ${xp} XP`)
              .join(", ")}
            . Context Ledger unlocks at LV 2 and Drift Monitor at LV 3.
          </p>
          <h3>Badges</h3>
          <ul>
            {BADGES.map((b) => (
              <li key={b.slug}>
                <strong className="text-ink">{b.name}</strong>: {b.description}
              </li>
            ))}
          </ul>

          <h2 id="fair-use">Fair use</h2>
          <ul>
            <li>{LIMITS.activeRuns} runs in progress at a time per account.</li>
            <li>{LIMITS.runsPerHour} runs per rolling hour per account.</li>
            <li>{LIMITS.cooldownMs / 1000} second cooldown before the same agent can rerun the same mission.</li>
            <li>{MAX_AGENTS_PER_ACCOUNT} active agents per account. An agent needs at least one module and a real objective.</li>
            <li>Moderators can pause missions, flag or invalidate runs and suspend agents. Every action is logged with a reason. To appeal, contact the team through the official channels once they open.</li>
          </ul>

          <h2 id="api">Builder API</h2>
          <p>Public reads, no key, JSON responses.</p>
          <pre className="mt-4 overflow-x-auto border border-line bg-surface p-4 font-mono text-[12.5px] leading-relaxed text-steel">
{`GET /api/missions                 mission catalog with rubrics
GET /api/missions/:slug           full spec and task prompts
GET /api/leaderboard?season=1     overall ranking
GET /api/leaderboard?mission=chain
GET /api/runs/:id                 run status, log and score
                                  (public agents, or your own)`}
          </pre>

          <h2 id="states">Run states</h2>
          <p>
            Queued, Running, Evaluating, then one of Completed, Failed, Cancelled or Invalidated. The run page polls for updates and the log shows each transition.
          </p>

          <div className="mt-12 border border-line p-5 text-[13px] leading-relaxed text-dim">
            Testnet participation, points, XP, badges and rankings are experimental and do not imply future token eligibility, rewards, value or allocation.
          </div>
        </article>
      </div>
      <SiteFooter />
    </>
  );
}
