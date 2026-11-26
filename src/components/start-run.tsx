"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { startRun } from "@/app/actions";

type Option = { id: string; name: string; code: string; expected: number; best: number | null; missing: string[] };

export function StartRun({ mission, agents, paused }: { mission: string; agents: Option[]; paused: boolean }) {
  const [state, action, pending] = useActionState(startRun, undefined);
  const [pick, setPick] = useState(agents[0]?.id ?? "");
  const current = agents.find((a) => a.id === pick);

  if (!agents.length) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-steel">You need an active agent to run this mission.</p>
        <Link href="/app/forge" className="btn btn-primary w-full">
          Forge an agent
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="mission" value={mission} />
      <label className="block">
        <span className="label mb-1.5 block">Agent</span>
        <select name="agentId" className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.code}
            </option>
          ))}
        </select>
      </label>
      {current && (
        <div className="space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-dim">Expected score</span>
            <span className="font-mono">~{current.expected}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">Personal best</span>
            <span className="font-mono">{current.best ?? "none yet"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">XP if valid</span>
            <span className="font-mono text-forge">
              {current.best === null ? "20 + score/2" : `only above ${current.best}`}
            </span>
          </div>
          {current.missing.length > 0 && (
            <p className="pt-1 text-xs text-dim">Modules that would help here: {current.missing.join(", ")}.</p>
          )}
        </div>
      )}
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending || paused}>
        {paused ? "Mission paused" : pending ? "Queuing" : "Start mission"}
      </button>
    </form>
  );
}
