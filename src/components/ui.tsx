import Link from "next/link";
import type { Rubric, RunStatus, ScoreBreakdown } from "@/lib/types";

const STATUS: Record<RunStatus, { label: string; cls: string; live?: boolean }> = {
  queued: { label: "Queued", cls: "text-steel border-line" },
  running: { label: "Running", cls: "text-forge border-forge/50", live: true },
  evaluating: { label: "Evaluating", cls: "text-forge border-forge/50", live: true },
  completed: { label: "Completed", cls: "text-ok border-ok/40" },
  failed: { label: "Failed", cls: "text-bad border-bad/40" },
  cancelled: { label: "Cancelled", cls: "text-dim border-line" },
  invalidated: { label: "Invalidated", cls: "text-bad border-bad/40 line-through" },
};

export function StatusPill({ status }: { status: RunStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${s.cls}`}>
      <span className={`size-1.5 rounded-full bg-current ${s.live ? "pulse-core" : ""}`} />
      {s.label}
    </span>
  );
}

export function DemoTag() {
  return (
    <span
      title="Sample record created for demonstration. Not a real participant."
      className="rounded-[2px] border border-line px-1 font-mono text-[10px] uppercase tracking-wider text-dim"
    >
      Demo
    </span>
  );
}

export function PageHead({ kicker, title, children, actions }: { kicker?: string; title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && <div className="label mb-2">{kicker}</div>}
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-[28px]">{title}</h1>
        {children && <div className="mt-2 max-w-2xl text-sm leading-relaxed text-steel">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Meter({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`h-1 w-full bg-graphite ${className}`}>
      <div className="h-full bg-forge" style={{ width: `${pct}%` }} />
    </div>
  );
}

const PARTS: Array<keyof Rubric> = ["quality", "completion", "efficiency", "compliance"];

export function ScoreBreakdownView({ score, rubric }: { score: ScoreBreakdown; rubric: Rubric }) {
  return (
    <div className="space-y-3">
      {PARTS.map((k) => (
        <div key={k}>
          <div className="mb-1 flex justify-between text-[13px]">
            <span className="capitalize text-steel">{k}</span>
            <span className="font-mono text-ink">
              {score[k]}
              <span className="text-dim"> / {rubric[k]}</span>
            </span>
          </div>
          <Meter value={score[k]} max={rubric[k]} />
        </div>
      ))}
    </div>
  );
}

export function Empty({ title, children, href, cta }: { title: string; children?: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="panel grid-bg flex flex-col items-start gap-3 p-8">
      <div className="font-display text-lg font-medium">{title}</div>
      {children && <div className="max-w-md text-sm text-steel">{children}</div>}
      {href && cta && (
        <Link href={href} className="btn btn-primary mt-1">
          {cta}
        </Link>
      )}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="label">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-dim">{sub}</div>}
    </div>
  );
}
