"use client";

import { useMemo, useState } from "react";
import type { Gpu } from "@/lib/gpu";

const STEPS = [8, 12, 16, 20, 24, 32, 40, 48, 80, 94, 141, 180, 288];

export function GpuRouter({ gpus }: { gpus: Gpu[] }) {
  const [idx, setIdx] = useState(4);
  const vram = STEPS[idx];

  const { hourly, job } = useMemo(() => {
    const fit = gpus.filter((g) => g.vendor === "NVIDIA" && g.stock !== "Out" && g.vram >= vram);
    return {
      hourly: [...fit].sort((a, b) => a.rate - b.rate)[0] ?? null,
      job: [...fit].sort((a, b) => a.rate / a.speed - b.rate / b.speed)[0] ?? null,
    };
  }, [gpus, vram]);

  return (
    <div className="relative overflow-hidden rounded-[6px] border border-line bg-linear-to-b from-surface to-carbon">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-forge/10 blur-3xl" />
      <div className="relative grid gap-8 p-6 md:grid-cols-[1fr_1.1fr] md:p-8">
        <div>
          <div className="label">Auto router</div>
          <div className="mt-3 font-display text-2xl font-semibold">Memory in, card out.</div>
          <p className="mt-2 max-w-sm text-sm text-steel">
            Drag to set how much GPU memory the job needs. The router reads live stock and prices across NVIDIA cards, the same way an agent set to Auto does at run time.
          </p>
          <div className="mt-8">
            <div className="flex items-end justify-between">
              <span className="label">Job needs</span>
              <span className="font-display text-4xl font-semibold tabular-nums">
                {vram}
                <span className="ml-1 text-lg text-dim">GB</span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={STEPS.length - 1}
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              aria-label="GPU memory needed"
              className="mt-4 w-full accent-[#ff6a1a]"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-dim">
              <span>8 GB</span>
              <span>288 GB</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <Pick title="Lowest hourly price" gpu={hourly} metric={hourly ? `$${hourly.rate.toFixed(2)} / hr` : ""} />
          <Pick
            title="Cheapest for the whole job"
            gpu={job}
            metric={job ? `$${(job.rate / job.speed).toFixed(3)} per job hour` : ""}
            hint="Hourly price divided by speed. A faster card can cost less in total."
            accent
          />
        </div>
      </div>
    </div>
  );
}

function Pick({ title, gpu, metric, hint, accent }: { title: string; gpu: Gpu | null; metric: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-[4px] border p-4 ${accent ? "border-forge/50 bg-forge/5" : "border-line bg-carbon/60"}`}>
      <div className="label">{title}</div>
      {gpu ? (
        <>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="font-display text-xl font-semibold">{gpu.name}</span>
            <span className="font-mono text-sm text-forge">{metric}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-dim">
            {gpu.vram} GB · {gpu.speed.toFixed(1)}x speed · stock {gpu.stock.toLowerCase()}
          </div>
          {hint && <p className="mt-2 text-[11px] text-dim">{hint}</p>}
        </>
      ) : (
        <div className="mt-2 text-sm text-steel">Nothing with that much memory is in stock right now.</div>
      )}
    </div>
  );
}
