import { CATEGORY_LABEL, getPreset, getSkill, getStyle } from "./catalog";
import type {
  Category,
  ConfigSnapshot,
  Mission,
  RunEvent,
  ScoreBreakdown,
  SimOutcome,
  Skill,
  TaskResult,
} from "./types";

// Small deterministic PRNG so a run can be replayed from its seed.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export function competence(config: ConfigSnapshot, category: Category) {
  const preset = getPreset(config.role);
  const style = getStyle(config.style);
  let c = 0.5 + (preset?.affinity[category] ?? 0) + (style?.accuracy ?? 0);
  for (const id of config.skills) c += getSkill(id)?.bonus[category] ?? 0;
  return c;
}

export function successChance(comp: number, difficulty: number) {
  return clamp(1 / (1 + Math.exp(-(comp - difficulty) * 8)), 0.03, 0.98);
}

function equipped(config: ConfigSnapshot): Skill[] {
  return config.skills.map((id) => getSkill(id)).filter((s): s is Skill => Boolean(s));
}

function skillFor(config: ConfigSnapshot, category: Category) {
  const list = equipped(config);
  return list.find((s) => s.category === category) ?? list.find((s) => (s.bonus[category] ?? 0) > 0) ?? list[0];
}

export function simulate(mission: Mission, config: ConfigSnapshot, seed: number): SimOutcome {
  const rnd = mulberry32(seed);
  const style = getStyle(config.style);
  const skills = equipped(config);
  const stepFactor = (style?.stepFactor ?? 1) * skills.reduce((f, s) => f * (s.stepFactor ?? 1), 1);
  const violationBase = clamp(
    0.22 - (competence(config, "structure") - 0.5) * 0.8 + skills.reduce((v, s) => v + (s.compliance ?? 0), 0),
    0.02,
    0.4,
  );
  const canRecover = skills.some((s) => s.recovery);

  const events: RunEvent[] = [];
  let clock = 0;
  const push = (type: RunEvent["type"], message: string, gap: [number, number] = [380, 820]) => {
    clock += Math.round(gap[0] + rnd() * (gap[1] - gap[0]));
    events.push({ at: clock, type, message });
  };

  events.push({ at: 0, type: "queued", message: `Run accepted for ${mission.name} v${mission.version}.` });
  push("started", "Worker assigned. Isolated sandbox started.", [900, 1600]);
  push(
    "sandbox",
    `Network denied. Tools allowed: ${skills.map((s) => s.name).join(", ")}. Budget ${mission.budget} steps.`,
  );
  const job = mission.compute;
  const vramFactor = skills.reduce((f, s) => f * (s.vramFactor ?? 1), 1);
  const need = job ? Math.ceil(job.vram * vramFactor) : 0;
  const gpu = config.gpu ?? null;
  let preemptAt = -1;
  let checkpointed = false;
  if (job) {
    if (!gpu) return failEarly(mission, events, push, () => clock, "No GPU attached. GPU missions need a compute slot.");
    push("gpu", `${gpu.name} attached · ${gpu.vram} GB · $${gpu.rate.toFixed(2)} per hour, simulated rental.`);
    if (gpu.vram < need) {
      return failEarly(mission, events, push, () => clock, `Out of memory. The job needs ${need} GB and ${gpu.name} has ${gpu.vram} GB.`);
    }
    push("gpu", `Job loaded in ${need} GB${vramFactor < 1 ? " with mixed precision" : ""}.`, [300, 600]);
    if (gpu.stock === "Low" && rnd() < 0.3) preemptAt = Math.floor(mission.tasks.length / 2);
    checkpointed = skills.some((s) => s.checkpoint);
  }
  if (mission.context?.length) {
    push("context", `Loaded ${mission.context.length} ${mission.mechanic === "memory" ? "brief facts" : "documents"} into the run context.`);
  }

  const results: TaskResult[] = [];
  let used = 0;
  let halted = false;
  let recovered = false;
  let budgetHit = false;

  for (let i = 0; i < mission.tasks.length; i++) {
    const task = mission.tasks[i];
    if (halted || budgetHit) {
      results.push({
        taskId: task.id,
        prompt: task.prompt,
        given: null,
        expected: task.answer,
        correct: false,
        credit: 0,
        violation: false,
        steps: 0,
        note: halted ? (job ? "Not reached, GPU lost" : "Not reached, chain halted") : "Not reached, budget spent",
      });
      continue;
    }

    if (task.shift) push("shift", task.shift);

    if (i === preemptAt) {
      preemptAt = -2;
      if (checkpointed) {
        push("recovery", "Card reclaimed by the host. Resumed from the last checkpoint, 12 percent more GPU time.");
      } else {
        halted = true;
        push("halted", "Card reclaimed by the host. No checkpoint, remaining batches lost.");
        i--;
        continue;
      }
    }

    const cost = Math.max(2, Math.round(task.steps * stepFactor * (0.88 + rnd() * 0.24)));
    if (used + cost > mission.budget) {
      budgetHit = true;
      push("budget", `Budget exhausted at ${used} of ${mission.budget} steps. Remaining tasks skipped.`);
      i--;
      continue;
    }
    used += cost;

    const tool = skillFor(config, task.category);
    push("tool_call", `${task.id} · ${tool?.name ?? "base"} on ${CATEGORY_LABEL[task.category].toLowerCase()} task`);

    let difficulty = task.difficulty + (task.distance ?? 0) * 0.06;
    if (mission.mechanic === "adaptive" && task.category === "adaptation") difficulty += 0.05;
    const p = successChance(competence(config, task.category), difficulty);
    let ok = rnd() < p;
    let given = ok ? task.answer : task.distractors[Math.floor(rnd() * task.distractors.length)];
    let note: string | undefined;

    if (!ok && mission.mechanic === "chain" && canRecover && !recovered) {
      recovered = true;
      const extra = Math.round(4 * stepFactor);
      used += extra;
      push("recovery", `${task.id} check failed. Task Planner replans the stage (+${extra} steps).`);
      ok = rnd() < p + 0.15;
      given = ok ? task.answer : given;
      note = ok ? "Recovered after replanning" : "Recovery attempt failed";
    }

    const violation = rnd() < violationBase;
    let credit = ok ? 1 : 0;
    if (task.values) {
      const best = Math.max(...Object.values(task.values));
      credit = (task.values[given] ?? 0) / best;
    }

    results.push({
      taskId: task.id,
      prompt: task.prompt,
      given,
      expected: task.answer,
      correct: ok,
      credit,
      violation,
      steps: cost,
      note,
    });
    push("output", `${task.id} → ${given}${violation ? " (format violation)" : ""}`, [300, 600]);

    if (!ok && mission.mechanic === "chain") {
      halted = true;
      push("halted", `Chain halted at ${task.id}. Later stages depend on this output.`);
    } else if ((i + 1) % 3 === 0 && i < mission.tasks.length - 1) {
      push("checkpoint", `Checkpoint ${Math.floor((i + 1) / 3)} saved at ${used} steps.`, [250, 500]);
    }
  }

  const attempted = results.filter((r) => r.given !== null);
  const failed = attempted.length === 0 || (mission.mechanic === "chain" && attempted.length === 1 && halted);

  let compute: SimOutcome["compute"];
  if (job && gpu) {
    const done = attempted.length / mission.tasks.length;
    const extra = preemptAt === -2 && checkpointed ? 1.12 : 1;
    const seconds = Math.round((job.baseSeconds / gpu.speed) * (style?.stepFactor ?? 1) * done * extra);
    const cost = Math.round((seconds / 3600) * gpu.rate * 10000) / 10000;
    compute = { seconds, cost, preempted: preemptAt === -2 };
    push("gpu", `GPU released after ${Math.round(seconds / 60)} min · ${cost.toFixed(4)} credits.`, [300, 600]);
  }

  const costEff = compute && gpu ? (compute.cost > 0 ? clamp(gpu.refCost / compute.cost) : 1) : undefined;
  const score = evaluate(mission, results, used, costEff);
  push(failed ? "failed" : "completed", failed ? "Run ended without usable output." : `Execution finished. ${used} of ${mission.budget} steps used.`);
  push("evaluating", "Evaluator scoring against published rubric.", [700, 1100]);
  push("scored", failed ? "Run marked failed. No progression awarded." : `Score ${score.total} / 100.`, [900, 1400]);

  return {
    outcome: failed ? "failed" : "completed",
    events,
    results,
    score: failed ? { ...score, total: 0 } : score,
    stepsUsed: used,
    budget: mission.budget,
    durationMs: clock,
    summary: summarize(results, halted, budgetHit),
    compute,
  };
}

function failEarly(
  mission: Mission,
  events: RunEvent[],
  push: (type: RunEvent["type"], message: string, gap?: [number, number]) => void,
  now: () => number,
  reason: string,
): SimOutcome {
  push("failed", reason);
  push("evaluating", "Evaluator scoring against published rubric.", [700, 1100]);
  push("scored", "Run marked failed. No progression awarded.", [900, 1400]);
  const results: TaskResult[] = mission.tasks.map((t) => ({
    taskId: t.id,
    prompt: t.prompt,
    given: null,
    expected: t.answer,
    correct: false,
    credit: 0,
    violation: false,
    steps: 0,
    note: "Not reached",
  }));
  return {
    outcome: "failed",
    events,
    results,
    score: { quality: 0, completion: 0, efficiency: 0, compliance: 0, total: 0 },
    stepsUsed: 0,
    budget: mission.budget,
    durationMs: now(),
    summary: reason,
    compute: { seconds: 0, cost: 0, preempted: false },
  };
}

function summarize(results: TaskResult[], halted: boolean, budgetHit: boolean) {
  const done = results.filter((r) => r.given !== null).length;
  const right = results.filter((r) => r.correct).length;
  let s = `${right} of ${results.length} tasks correct, ${done} attempted.`;
  if (halted) s += " Chain halted early.";
  if (budgetHit) s += " Step budget ran out.";
  return s;
}

export function evaluate(mission: Mission, results: TaskResult[], used: number, costEff?: number): ScoreBreakdown {
  const total = results.length;
  const attempted = results.filter((r) => r.given !== null);
  const reference = attempted.reduce((s, r) => s + (mission.tasks.find((t) => t.id === r.taskId)?.steps ?? 0), 0);

  const quality = results.reduce((s, r) => s + r.credit, 0) / total;
  const completion = attempted.length / total;
  const stepEff = attempted.length ? clamp(1.5 - used / Math.max(1, reference)) * completion : 0;
  const efficiency = costEff === undefined ? stepEff : attempted.length ? costEff * completion : 0;
  const compliance = attempted.length ? 1 - attempted.filter((r) => r.violation).length / attempted.length : 0;

  const w = mission.rubric;
  const parts = {
    quality: Math.round(quality * w.quality),
    completion: Math.round(completion * w.completion),
    efficiency: Math.round(efficiency * w.efficiency),
    compliance: Math.round(compliance * w.compliance),
  };
  return { ...parts, total: parts.quality + parts.completion + parts.efficiency + parts.compliance };
}

// Rough expected score, used on the mission page before a run.
export function forecast(mission: Mission, config: ConfigSnapshot) {
  const runs = 40;
  let sum = 0;
  for (let i = 0; i < runs; i++) sum += simulate(mission, config, 9000 + i).score.total;
  return Math.round(sum / runs);
}
