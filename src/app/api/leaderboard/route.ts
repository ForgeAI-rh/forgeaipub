import { NextResponse } from "next/server";
import { CURRENT_SEASON, getMission } from "@/lib/catalog";
import { read } from "@/lib/db";
import { leaderboard } from "@/lib/forge";
import { agentCode } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const season = Number(url.searchParams.get("season") ?? CURRENT_SEASON);
  const mission = url.searchParams.get("mission") ?? undefined;
  if (!Number.isInteger(season) || season < 0 || season > 9) return NextResponse.json({ error: "bad_season" }, { status: 400 });
  if (mission && !getMission(mission)) return NextResponse.json({ error: "unknown_mission" }, { status: 400 });
  const rows = leaderboard(await read(), season, mission).slice(0, 100);
  return NextResponse.json({
    season,
    mission: mission ?? null,
    rule: "Sum of best eligible score per mission. Invalidated, failed and cancelled runs excluded.",
    rows: rows.map((r) => ({
      rank: r.rank,
      agent: agentCode(r.agent.id),
      name: r.agent.name,
      score: r.total,
      missions: r.missions,
      demo: Boolean(r.agent.demo),
    })),
  });
}
