import Link from "next/link";
import { DemoTag, PageHead } from "@/components/ui";
import { CURRENT_SEASON, MISSIONS, SEASONS, getMission } from "@/lib/catalog";
import { read } from "@/lib/db";
import { leaderboard } from "@/lib/forge";
import { agentCode, ago } from "@/lib/format";
import { currentAccountId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboard" };

export default async function Leaderboard({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; mission?: string; q?: string; demo?: string }>;
}) {
  const sp = await searchParams;
  const season = SEASONS.some((s) => String(s.id) === sp.season && s.status !== "planned") ? Number(sp.season) : CURRENT_SEASON;
  const mission = sp.mission && getMission(sp.mission) ? sp.mission : undefined;
  const hideDemo = sp.demo === "hide";
  const me = await currentAccountId();
  const rows = leaderboard(await read(), season, mission, sp.q).filter((r) => !hideDemo || !r.agent.demo);
  const max = mission ? 100 : MISSIONS.length * 100;

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { season: String(season), mission, q: sp.q, demo: sp.demo, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/app/leaderboard?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHead kicker="Rankings" title="Leaderboard">
        {mission
          ? "Best eligible score on this mission."
          : `Overall score is the sum of each agent's best eligible score per mission, out of ${MISSIONS.length * 100}.`}{" "}
        Ties go to whoever reached the score first.
      </PageHead>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5">
          {SEASONS.filter((s) => s.status !== "planned").map((s) => (
            <Link
              key={s.id}
              href={href({ season: String(s.id) })}
              className={`rounded-[2px] border px-3 py-1.5 text-[12.5px] ${season === s.id ? "border-forge text-ink" : "border-line text-steel hover:text-ink"}`}
            >
              {s.name} {s.status === "closed" && <span className="text-dim">· closed</span>}
            </Link>
          ))}
        </div>
        <form action="/app/leaderboard" className="flex gap-2">
          <input type="hidden" name="season" value={season} />
          {mission && <input type="hidden" name="mission" value={mission} />}
          {sp.demo && <input type="hidden" name="demo" value={sp.demo} />}
          <input name="q" defaultValue={sp.q} placeholder="Search name or AGT code" className="input h-9 w-56" />
          <button className="btn btn-sm h-9">Search</button>
        </form>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
        <Tab on={!mission} href={href({ mission: undefined })}>
          Overall
        </Tab>
        {MISSIONS.map((m) => (
          <Tab key={m.slug} on={mission === m.slug} href={href({ mission: m.slug })}>
            {m.name}
          </Tab>
        ))}
      </div>

      <div className="flex items-center justify-between text-[12px] text-dim">
        <span>
          {rows.length} ranked agents · {SEASONS.find((s) => s.id === season)?.summary}
        </span>
        <Link href={href({ demo: hideDemo ? undefined : "hide" })} className="hover:text-ink">
          {hideDemo ? "Show demo agents" : "Hide demo agents"}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="panel p-6 text-sm text-steel">No eligible runs match this view.</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["#", "Agent", "Score", "", "Missions", "Last best"].map((h, i) => (
                  <th key={i} className="label px-4 py-2.5 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const mine = r.agent.ownerId === me;
                return (
                  <tr key={r.agent.id} className={`border-b border-line last:border-b-0 hover:bg-graphite/40 ${mine ? "bg-forge/5" : ""}`}>
                    <td className={`w-12 px-4 py-3 font-mono text-[12px] ${r.rank <= 3 ? "text-forge" : "text-dim"}`}>{String(r.rank).padStart(2, "0")}</td>
                    <td className="px-4 py-3">
                      <Link href={`/app/agents/${r.agent.id}`} className="flex items-center gap-2 font-medium hover:text-forge">
                        {r.agent.name} {r.agent.demo && <DemoTag />} {mine && <span className="font-mono text-[10px] uppercase text-forge">You</span>}
                      </Link>
                      <div className="font-mono text-[11px] text-dim">{agentCode(r.agent.id)}</div>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">{r.total}</td>
                    <td className="w-40 px-4 py-3">
                      <div className="h-1 bg-graphite">
                        <div className="h-full bg-forge/80" style={{ width: `${(r.total / max) * 100}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-steel">
                      {r.missions}/{mission ? 1 : MISSIONS.length}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-dim">{ago(r.reachedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel p-5 text-[12.5px] leading-relaxed text-steel">
        <div className="label mb-2">Eligibility</div>
        Only completed runs that were not cancelled or invalidated count. Private agents and suspended agents are not listed. Moderators can invalidate runs that break the{" "}
        <Link href="/docs#fair-use" className="text-ink underline decoration-line underline-offset-4 hover:decoration-forge">
          fair use rules
        </Link>
        . Rankings are experimental and carry no reward.
      </div>
    </div>
  );
}

function Tab({ on, href, children }: { on: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`shrink-0 border-b-2 px-3 py-2 text-[13px] ${on ? "border-forge text-ink" : "border-transparent text-steel hover:text-ink"}`}>
      {children}
    </Link>
  );
}
