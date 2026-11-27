import { EVALUATOR_VERSION, MISSIONS, RUNTIME_VERSION } from "./catalog";
import { seedFrom, simulate } from "./engine";
import type { Agent, DbShape, StyleId } from "./types";

// Demo roster so the leaderboard and registry are not empty on first boot.
// Every record created here carries demo: true and is labelled in the UI.
const ROSTER: Array<[string, string, StyleId, string[], string]> = [
  ["Kestrel", "analyst", "methodical", ["deductive_core", "pattern_lens", "schema_writer", "corpus_reader"], "Solve structured problems with zero format errors."],
  ["Anvil 7", "planner", "rapid", ["task_planner", "budget_governor", "schema_writer", "sim_runner"], "Finish pipelines inside tight budgets."],
  ["Lattice", "researcher", "balanced", ["corpus_reader", "citation_guard", "context_ledger", "deductive_core"], "Answer only what the sources support."],
  ["Northbound", "executor", "balanced", ["sim_runner", "task_planner", "drift_monitor", "pattern_lens"], "Hold a strong position through changing conditions."],
  ["Quench", "analyst", "rapid", ["deductive_core", "budget_governor", "pattern_lens", "schema_writer"], "Fast, clean answers on logic work."],
  ["Slag Reader", "researcher", "methodical", ["corpus_reader", "citation_guard", "schema_writer", "context_ledger"], "Careful reading, careful citing."],
  ["Tempo", "planner", "balanced", ["task_planner", "sim_runner", "drift_monitor", "budget_governor"], "Keep the plan moving when rules change."],
  ["Bellows", "executor", "rapid", ["sim_runner", "budget_governor", "pattern_lens", "task_planner"], "Cheap, quick simulation runs."],
];

const HOUR = 3600_000;

export function seedDemo(db: DbShape) {
  const now = Date.now();
  ROSTER.forEach(([name, role, style, skills, objective], idx) => {
    const ownerId = `demo_owner_${idx + 1}`;
    db.accounts.push({ id: ownerId, createdAt: now - 30 * 24 * HOUR, demo: true });
    const agent: Agent = {
      id: `demo${String(idx + 1).padStart(2, "0")}x`,
      ownerId,
      name,
      role,
      style,
      objective,
      skills,
      configVersion: 1,
      visibility: "public",
      status: "active",
      createdAt: now - (28 - idx) * 24 * HOUR,
      updatedAt: now - (28 - idx) * 24 * HOUR,
      demo: true,
    };
    db.agents.push(agent);

    MISSIONS.filter((x) => !x.compute).forEach((mission, m) => {
      const passes: Array<[number, number]> = [];
      if ((idx + m) % 3 !== 0) passes.push([0, 20 + m]);
      if ((idx * 7 + m) % 4 !== 1) passes.push([1, 2 + ((idx * 5 + m * 3) % 9)]);
      if ((idx + m) % 5 === 0) passes.push([1, 1 + ((idx + m) % 2)]);

      passes.forEach(([season, daysAgo], k) => {
        const runId = `demo${idx + 1}${mission.code.toLowerCase()}${season}${k}`;
        const startsAt = now - daysAgo * 24 * HOUR - (idx * 37 + m * 11) * 60_000;
        db.runs.push({
          id: runId,
          agentId: agent.id,
          ownerId,
          missionSlug: mission.slug,
          missionVersion: mission.version,
          season,
          configVersion: 1,
          config: { role, style, skills, level: 3 },
          createdAt: startsAt,
          startsAt,
          sim: simulate(mission, { role, style, skills, level: 3 }, seedFrom(runId)),
          runtimeVersion: RUNTIME_VERSION,
          evaluatorVersion: EVALUATOR_VERSION,
          demo: true,
        });
      });
    });
  });
}
