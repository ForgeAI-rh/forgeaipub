"use client";

import { useEffect, useState } from "react";

const SCRIPT: Array<[string, string]> = [
  ["queued", "Run accepted · Logic Trial v1.0"],
  ["started", "Worker assigned · sandbox isolated"],
  ["sandbox", "Network denied · 3 tools allowed"],
  ["tool", "L1 · Deductive Core"],
  ["output", "L1 → 63"],
  ["tool", "L2 · Deductive Core"],
  ["output", "L2 → Yes"],
  ["check", "Checkpoint 1 · 17 steps"],
  ["tool", "L4 · Pattern Lens"],
  ["output", "L4 → D"],
  ["eval", "Evaluator · EVAL 1.0.0"],
  ["score", "Score 84 / 100 · +62 XP"],
];

export function IllustrativeFeed() {
  const [n, setN] = useState(4);

  useEffect(() => {
    const t = setInterval(() => setN((v) => (v >= SCRIPT.length + 3 ? 1 : v + 1)), 900);
    return () => clearInterval(t);
  }, []);

  const lines = SCRIPT.slice(0, Math.min(n, SCRIPT.length));

  return (
    <div className="panel tick overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-forge pulse-core" />
          <span className="label text-steel">Agent Kestrel · AGT:DEMO01X</span>
        </div>
        <span className="label">Illustrative</span>
      </div>
      <ol className="h-[312px] space-y-1.5 overflow-hidden px-4 py-3 font-mono text-[12.5px]">
        {lines.map(([kind, text], i) => (
          <li key={`${i}-${text}`} className="feed-in flex gap-3">
            <span className="w-14 shrink-0 text-dim">{`+${(i * 0.7).toFixed(1)}s`}</span>
            <span className={`w-16 shrink-0 uppercase ${kind === "score" ? "text-forge" : "text-dim"}`}>{kind}</span>
            <span className={kind === "score" ? "text-ink" : "text-steel"}>{text}</span>
          </li>
        ))}
      </ol>
      <div className="border-t border-line px-4 py-2 text-[11px] text-dim">
        Scripted preview of a run log. Not live network activity.
      </div>
    </div>
  );
}
