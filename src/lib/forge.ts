import "server-only";
import { BADGES, CURRENT_SEASON, MISSIONS, levelFor } from "./catalog";
import type { Agent, DbShape, Run, RunEvent, RunStatus, TaskResult } from "./types";

export const LIMITS = {
  activeRuns: 2,
  runsPerHour: 25,
  cooldownMs: 45_000,
};

export interface RunView {
  status: RunStatus;
  finished: boolean;
  events: RunEvent[];
  results: TaskResult[];
  endsAt: number;
}

export function runEnd(run: Run) {
  return run.startsAt + run.sim.durationMs;
}

export function viewRun(run: Run, now = Date.now()): RunView {
  const end = runEnd(run);
  const cancelled = run.cancelledAt !== undefined && run.cancelledAt < end;
  const cutoff = (cancelled ? run.cancelledAt! : Math.min(now, end)) - run.startsAt;
  const events = run.sim.events.filter((e) => e.at <= cutoff);
  if (cancelled) {
    events.push({ at: cutoff, type: "failed", message: "Run cancelled by owner. No progression awarded." });
  }
  const finished = cancelled || now >= end;

  let status: RunStatus;
  if (run.invalidated) status = "invalidated";
  else if (cancelled) status = "cancelled";
  else if (now >= end) status = run.sim.outcome;
  else if (events.some((e) => e.type === "evaluating")) status = "evaluating";
  else if (events.some((e) => e.type === "started")) status = "running";
  else status = "queued";

  const outputs = events.filter((e) => e.type === "output").length;
  const results = finished && !cancelled ? run.sim.results : run.sim.results.filter((r) => r.given !== null).slice(0, outputs);

  return { status, finished, events, results, endsAt: end };
}

export function isEligible(run: Run, now = Date.now()) {
  return (
    now >= runEnd(run) &&
    run.sim.outcome === "completed" &&
    run.sim.score.total > 0 &&
    !run.invalidated &&
    !(run.cancelledAt !== undefined && run.cancelledAt < runEnd(run))
  );
}

export interface Progress {
  xp: number;
  level: number;
  levelFloor: number;
  levelNext: number | null;
  reputation: number;
  best: Record<string, { score: number; runId: string }>;
  xpByRun: Record<string, number>;
  badges: { slug: string; name: string; description: string; earnedAt: number }[];
  validRuns: number;
}

export function computeProgress(agentRuns: Run[], now = Date.now()): Progress {
  const runs = agentRuns.filter((r) => isEligible(r, now)).sort((a, b) => runEnd(a) - runEnd(b));
  const best: Progress["best"] = {};
  const xpByRun: Record<string, number> = {};
  const earned = new Map<string, number>();
  const focus = new Set<string>();
  let xp = 0;

  const award = (slug: string, at: number) => {
    if (!earned.has(slug)) earned.set(slug, at);
  };

  for (const run of runs) {
    const score = run.sim.score.total;
    const prev = best[run.missionSlug];
    let gain = 0;
    if (!prev) gain = 20 + Math.floor(score / 2);
    else if (score > prev.score) gain = score - prev.score;
    if (!prev || score > prev.score) best[run.missionSlug] = { score, runId: run.id };
    xpByRun[run.id] = gain;
    xp += gain;

    const at = runEnd(run);
    award("first_ignition", at);
    if (score >= 90) award("precision", at);
    const attempted = run.sim.results.filter((r) => r.given !== null);
    if (attempted.length === run.sim.results.length && attempted.every((r) => !r.violation)) award("clean_run", at);
    const mission = MISSIONS.find((m) => m.slug === run.missionSlug);
    if (mission) focus.add(mission.focus);
    if (focus.size >= 4) award("range", at);
    if (Object.keys(best).length === MISSIONS.length) award("full_cycle", at);
    if (run.season === 1) award("season_one", at);
    if (mission?.compute) award("first_light", at);
  }

  const lv = levelFor(xp);
  const scores = Object.values(best).map((b) => b.score);
  const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const reputation = Math.round(mean * Math.min(1, scores.length / 4));

  return {
    xp,
    level: lv.level,
    levelFloor: lv.floor,
    levelNext: lv.next,
    reputation,
    best,
    xpByRun,
    badges: BADGES.filter((b) => earned.has(b.slug)).map((b) => ({ ...b, earnedAt: earned.get(b.slug)! })),
    validRuns: runs.length,
  };
}

export function runsForAgent(db: DbShape, agentId: string) {
  return db.runs.filter((r) => r.agentId === agentId);
}

export function agentProgress(db: DbShape, agentId: string) {
  return computeProgress(runsForAgent(db, agentId));
}

export interface BoardRow {
  rank: number;
  agent: Agent;
  total: number;
  missions: number;
  reachedAt: number;
}

export function leaderboard(db: DbShape, season: number, missionSlug?: string, query?: string): BoardRow[] {
  const now = Date.now();
  const rows: Omit<BoardRow, "rank">[] = [];
  const q = query?.trim().toLowerCase();

  for (const agent of db.agents) {
    if (agent.status === "suspended" || agent.visibility !== "public") continue;
    if (q && !agent.name.toLowerCase().includes(q) && !displayAgentId(agent.id).toLowerCase().includes(q)) continue;
    const runs = db.runs.filter(
      (r) => r.agentId === agent.id && r.season === season && isEligible(r, now) && (!missionSlug || r.missionSlug === missionSlug),
    );
    if (!runs.length) continue;
    const best = new Map<string, { score: number; at: number }>();
    for (const r of runs) {
      const cur = best.get(r.missionSlug);
      if (!cur || r.sim.score.total > cur.score) best.set(r.missionSlug, { score: r.sim.score.total, at: runEnd(r) });
    }
    const vals = [...best.values()];
    rows.push({
      agent,
      total: vals.reduce((s, v) => s + v.score, 0),
      missions: vals.length,
      reachedAt: Math.max(...vals.map((v) => v.at)),
    });
  }

  rows.sort((a, b) => b.total - a.total || a.reachedAt - b.reachedAt);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function startCheck(db: DbShape, accountId: string, agentId: string, missionSlug: string, now = Date.now()): string | null {
  const mine = db.runs.filter((r) => r.ownerId === accountId);
  const active = mine.filter((r) => !viewRun(r, now).finished);
  if (active.length >= LIMITS.activeRuns) return `You already have ${active.length} runs in progress. Wait for one to finish.`;
  if (mine.filter((r) => r.createdAt > now - 3600_000).length >= LIMITS.runsPerHour)
    return `Hourly limit reached (${LIMITS.runsPerHour} runs). Try again later.`;
  const last = mine
    .filter((r) => r.agentId === agentId && r.missionSlug === missionSlug)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (last && now - last.createdAt < LIMITS.cooldownMs) {
    const wait = Math.ceil((LIMITS.cooldownMs - (now - last.createdAt)) / 1000);
    return `This agent ran this mission moments ago. Cooldown ends in ${wait}s.`;
  }
  return null;
}

/* Demo credits: no monetary value. 1 credit pays for 1 dollar of compute at live market rates. */

export const CREDITS = { start: 25, daily: 10, cap: 100 };

// A GPU run reserves its cost while it runs. Failed and cancelled runs are free.
export function chargeOf(run: Run, now = Date.now()) {
  const c = run.sim.compute?.cost ?? 0;
  if (!c) return 0;
  const v = viewRun(run, now);
  if (!v.finished) return c;
  return v.status === "completed" || v.status === "invalidated" ? c : 0;
}

export function creditBalance(db: DbShape, accountId: string, now = Date.now()) {
  const account = db.accounts.find((a) => a.id === accountId);
  if (!account) return { granted: 0, spent: 0, balance: 0 };
  const days = Math.max(0, Math.floor((now - account.createdAt) / 86_400_000));
  const granted = Math.min(CREDITS.start + CREDITS.daily * days, CREDITS.cap);
  const spent = db.runs.filter((r) => r.ownerId === accountId).reduce((s, r) => s + chargeOf(r, now), 0);
  return { granted, spent: Math.round(spent * 10000) / 10000, balance: Math.round((granted - spent) * 10000) / 10000 };
}

export function displayAgentId(id: string) {
  return `AGT:${id.toUpperCase()}`;
}

export const currentSeason = CURRENT_SEASON;
