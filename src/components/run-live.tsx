"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cancelRun } from "@/app/actions";
import type { RunPayload } from "@/lib/run-payload";
import { agentCode, clock, dateTime, runCode } from "@/lib/format";
import { DemoTag, ScoreBreakdownView, StatusPill } from "./ui";

const STAGES = ["queued", "running", "evaluating", "done"] as const;

function stageIndex(s: RunPayload["status"]) {
  if (s === "queued") return 0;
  if (s === "running") return 1;
  if (s === "evaluating") return 2;
  return 3;
}

const TYPE_TONE: Record<string, string> = {
  tool_call: "text-steel",
  output: "text-ink",
  warning: "text-forge",
  shift: "text-forge",
  recovery: "text-forge",
  halted: "text-bad",
  budget: "text-bad",
  failed: "text-bad",
  scored: "text-forge",
};

export function RunLive({ initial }: { initial: RunPayload }) {
  const [run, setRun] = useState(initial);
  const [cancelling, setCancelling] = useState(false);
  const logRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (run.finished) return;
    let alive = true;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/runs/${run.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as RunPayload;
        if (alive) setRun(next);
      } catch {
        // transient network hiccup, the next tick retries
      }
    }, 800);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [run.id, run.finished]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [run.events.length]);

  const stage = stageIndex(run.status);
  const endLabel =
    run.status === "failed" ? "Failed" : run.status === "cancelled" ? "Cancelled" : run.status === "invalidated" ? "Invalidated" : "Completed";
  const live = !run.finished;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="label mb-2 flex flex-wrap items-center gap-2">
            {runCode(run.id)} · Season {run.season} · {run.mission.code} v{run.mission.version}
            {run.demo && <DemoTag />}
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-[28px]">{run.mission.name}</h1>
          <div className="mt-2 text-sm text-steel">
            <Link href={`/app/agents/${run.agent.id}`} className="text-ink hover:text-forge">
              {run.agent.name}
            </Link>{" "}
            <span className="font-mono text-[12px] text-dim">
              {agentCode(run.agent.id)} · config v{run.config.version} · {dateTime(run.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={run.status} />
          {run.owner && live && (
            <form
              action={async () => {
                setCancelling(true);
                await cancelRun(run.id);
                const res = await fetch(`/api/runs/${run.id}`, { cache: "no-store" });
                if (res.ok) setRun(await res.json());
                setCancelling(false);
              }}
            >
              <button className="btn btn-sm" disabled={cancelling}>
                {cancelling ? "Cancelling" : "Cancel run"}
              </button>
            </form>
          )}
        </div>
      </div>

      <ol className="grid grid-cols-4 gap-px overflow-hidden border border-line bg-line">
        {STAGES.map((s, i) => {
          const label = s === "done" ? endLabel : s[0].toUpperCase() + s.slice(1);
          const on = i === stage;
          const past = i < stage;
          const bad = s === "done" && on && run.status !== "completed";
          return (
            <li key={s} className={`bg-carbon px-3 py-3 ${on ? "bg-surface" : ""}`}>
              <div className={`h-0.5 w-full ${past ? "bg-forge/60" : on ? (bad ? "bg-bad" : "bg-forge") : "bg-graphite"}`} />
              <div className={`mt-2.5 text-[12px] ${on ? "text-ink" : past ? "text-steel" : "text-dim"}`}>
                <span className="mr-1.5 font-mono text-[10px] text-dim">0{i + 1}</span>
                {label}
              </div>
            </li>
          );
        })}
      </ol>

      {run.invalidated && (
        <div className="panel border-bad/50 px-5 py-3 text-sm">
          <span className="text-bad">Invalidated by moderators.</span> <span className="text-steel">Reason: {run.invalidated.reason}. This run gives no XP and is excluded from rankings.</span>
        </div>
      )}
      {run.flagged && !run.invalidated && (
        <div className="panel px-5 py-3 text-sm text-steel">
          <span className="text-forge">Under review.</span> {run.flagged.reason}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel flex flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="label">Execution log · sanitized</span>
            <span className="font-mono text-[11px] text-dim">{live ? clock(run.elapsedMs) : `${(run.durationMs / 1000).toFixed(1)}s total`}</span>
          </div>
          <ol ref={logRef} className="h-[380px] space-y-1 overflow-y-auto px-4 py-3 font-mono text-[12.5px]">
            {run.events.map((e, i) => (
              <li key={i} className="feed-in grid grid-cols-[4.2rem_5.5rem_1fr] gap-2">
                <span className="text-dim">{clock(e.at)}</span>
                <span className="uppercase text-dim">{e.type.replace("_", " ")}</span>
                <span className={TYPE_TONE[e.type] ?? "text-steel"}>{e.message}</span>
              </li>
            ))}
            {live && (
              <li className="grid grid-cols-[4.2rem_5.5rem_1fr] gap-2 text-dim">
                <span />
                <span className="pulse-core">▍</span>
              </li>
            )}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="panel tick p-5">
            <div className="label">Score</div>
            <div className="mt-3 flex items-end gap-2">
              <span className="font-display text-5xl font-semibold tabular-nums">{run.score ? run.score.total : "··"}</span>
              <span className="mb-2 text-dim">/ 100</span>
            </div>
            {run.score ? (
              <div className="mt-5">
                <ScoreBreakdownView score={run.score} rubric={run.mission.rubric} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-steel">
                {live ? "Scoring starts when execution finishes." : run.status === "failed" ? "No score. The run produced no usable output." : "No score for this run."}
              </p>
            )}
          </div>

          <div className="panel divide-y divide-line text-[13px]">
            <Line k="Progression" v={run.xp === null ? "pending" : run.xp > 0 ? `+${run.xp} XP` : "No XP"} hl={Boolean(run.xp)} />
            {run.badges.length > 0 && <Line k="Badges" v={run.badges.join(", ")} hl />}
            <Line k="Steps used" v={run.stepsUsed === null ? "··" : `${run.stepsUsed} of ${run.mission.budget}`} />
            <Line k="Runtime" v={run.runtimeVersion} />
            <Line k="Evaluator" v={run.evaluatorVersion} />
            <Line k="Config" v={`${run.config.role} · ${run.config.style}`} />
            <div className="px-4 py-2.5 text-dim">{run.config.skills.join(", ")}</div>
          </div>
          {run.finished && run.xp === 0 && run.status === "completed" && (
            <p className="text-xs leading-relaxed text-dim">
              No XP because this score did not beat the agent&apos;s previous best on this mission.
            </p>
          )}
        </div>
      </div>

      {run.status === "failed" && run.owner && (
        <div className="panel border-bad/40 p-5">
          <div className="font-medium">Recovering from a failed run</div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel">
            {run.mission.slug === "chain"
              ? "The chain stopped at stage 1, so nothing downstream ran. Equip Task Planner to allow one recovery per run, or a planning focused role."
              : "The agent did not produce any output inside the budget. Try a Rapid style or Budget Governor, then run again."}{" "}
            Failed runs never count against your XP.
          </p>
          <div className="mt-4 flex gap-2">
            <Link href={`/app/agents/${run.agent.id}/edit`} className="btn">
              Adjust config
            </Link>
            <Link href={`/app/missions/${run.mission.slug}`} className="btn btn-primary">
              Run again
            </Link>
          </div>
        </div>
      )}

      <div className="panel overflow-x-auto">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="label">Output</span>
          {run.summary && <span className="text-[12px] text-steel">{run.summary}</span>}
        </div>
        {run.results.length === 0 ? (
          <div className="px-4 py-6 text-sm text-dim">{live ? "Outputs appear here as tasks complete." : "No output."}</div>
        ) : (
          <table className="w-full min-w-[680px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left">
                {["Task", "Prompt", "Agent output", "Expected", "Result"].map((h) => (
                  <th key={h} className="label px-4 py-2 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {run.results.map((r) => (
                <tr key={r.taskId} className="border-b border-line align-top last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-dim">{r.taskId}</td>
                  <td className="max-w-[260px] px-4 py-2.5 text-steel">{r.prompt}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">
                    {r.given ?? <span className="text-dim">not reached</span>}
                    {r.violation && <div className="mt-0.5 text-[11px] text-forge">format violation</div>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-steel">{r.expected}</td>
                  <td className="px-4 py-2.5">
                    {r.given === null ? (
                      <span className="text-dim">··</span>
                    ) : r.correct ? (
                      <span className="text-ok">Pass</span>
                    ) : r.credit > 0 ? (
                      <span className="text-steel">{Math.round(r.credit * 100)}%</span>
                    ) : (
                      <span className="text-bad">Miss</span>
                    )}
                    {r.note && <div className="mt-0.5 text-[11px] text-dim">{r.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-dim">
        Runtime {run.runtimeVersion} is a seeded simulator. The agent&apos;s configuration sets the odds of each answer and the evaluator grades the actual outputs. It is not a language model.
      </p>
    </div>
  );
}

function Line({ k, v, hl }: { k: string; v: string; hl?: boolean }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5">
      <span className="text-dim">{k}</span>
      <span className={`text-right font-mono text-[12px] ${hl ? "text-forge" : ""}`}>{v}</span>
    </div>
  );
}
