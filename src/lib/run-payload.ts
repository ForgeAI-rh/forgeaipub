import "server-only";
import { getMission, getPreset, getSkill, getStyle } from "./catalog";
import { read } from "./db";
import { chargeOf, computeProgress, runEnd, viewRun } from "./forge";
import type { Rubric, RunEvent, RunStatus, ScoreBreakdown, TaskResult } from "./types";

export interface RunPayload {
  id: string;
  owner: boolean;
  agent: { id: string; name: string; demo: boolean };
  mission: { slug: string; name: string; code: string; version: string; budget: number; rubric: Rubric };
  config: { version: number; role: string; style: string; skills: string[] };
  season: number;
  createdAt: number;
  status: RunStatus;
  finished: boolean;
  elapsedMs: number;
  durationMs: number;
  events: RunEvent[];
  results: TaskResult[];
  score: ScoreBreakdown | null;
  stepsUsed: number | null;
  summary: string | null;
  xp: number | null;
  badges: string[];
  runtimeVersion: string;
  evaluatorVersion: string;
  invalidated?: { reason: string; at: number };
  flagged?: { reason: string; at: number };
  demo: boolean;
  compute: null | {
    gpu: string;
    vram: number;
    rate: number;
    minutes: number | null;
    cost: number | null;
    charged: number | null;
    preempted: boolean;
    receipt: string | null;
  };
}

export async function runPayload(runId: string, viewer: string | null): Promise<RunPayload | null> {
  const db = await read();
  const run = db.runs.find((r) => r.id === runId);
  if (!run) return null;
  const agent = db.agents.find((a) => a.id === run.agentId);
  const mission = getMission(run.missionSlug);
  if (!agent || !mission) return null;
  const owner = run.ownerId === viewer;
  if (!owner && agent.visibility !== "public") return null;

  const now = Date.now();
  const view = viewRun(run, now);
  const settled = view.finished && (view.status === "completed" || view.status === "invalidated");
  let xp: number | null = null;
  let badges: string[] = [];
  if (view.finished) {
    const p = computeProgress(db.runs.filter((r) => r.agentId === agent.id), now);
    xp = p.xpByRun[run.id] ?? 0;
    badges = p.badges.filter((b) => b.earnedAt === runEnd(run)).map((b) => b.name);
  }

  return {
    id: run.id,
    owner,
    agent: { id: agent.id, name: agent.name, demo: Boolean(agent.demo) },
    mission: { slug: mission.slug, name: mission.name, code: mission.code, version: run.missionVersion, budget: mission.budget, rubric: mission.rubric },
    config: {
      version: run.configVersion,
      role: getPreset(run.config.role)?.name ?? run.config.role,
      style: getStyle(run.config.style)?.name ?? run.config.style,
      skills: run.config.skills.map((s) => getSkill(s)?.name ?? s),
    },
    season: run.season,
    createdAt: run.createdAt,
    status: view.status,
    finished: view.finished,
    elapsedMs: Math.min(now, view.endsAt) - run.startsAt,
    durationMs: run.sim.durationMs,
    events: view.events,
    results: view.results,
    score: settled ? run.sim.score : null,
    stepsUsed: view.finished && view.status !== "cancelled" ? run.sim.stepsUsed : null,
    summary: view.finished && view.status !== "cancelled" ? run.sim.summary : null,
    xp,
    badges,
    runtimeVersion: run.runtimeVersion,
    evaluatorVersion: run.evaluatorVersion,
    invalidated: run.invalidated,
    flagged: run.flagged,
    demo: Boolean(run.demo),
    compute: run.config.gpu
      ? {
          gpu: run.config.gpu.name,
          vram: run.config.gpu.vram,
          rate: run.config.gpu.rate,
          minutes: view.finished && run.sim.compute ? Math.round(run.sim.compute.seconds / 60) : null,
          cost: view.finished && run.sim.compute ? run.sim.compute.cost : null,
          charged: view.finished ? chargeOf(run, now) : null,
          preempted: view.finished ? Boolean(run.sim.compute?.preempted) : false,
          receipt: view.finished && chargeOf(run, now) > 0 ? (run.receipt?.leaf ?? null) : null,
        }
      : null,
  };
}
