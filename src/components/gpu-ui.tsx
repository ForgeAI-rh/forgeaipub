import type { Gpu, Stock } from "@/lib/gpu";

const STOCK: Record<Stock, { cls: string; label: string }> = {
  High: { cls: "bg-ok", label: "High" },
  Medium: { cls: "bg-ok/70", label: "Medium" },
  Low: { cls: "bg-forge", label: "Low" },
  Out: { cls: "bg-dim/50", label: "Out" },
};

export function StockDot({ stock, withLabel = false }: { stock: Stock; withLabel?: boolean }) {
  const s = STOCK[stock];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-1.5 rounded-full ${s.cls} ${stock === "High" || stock === "Medium" ? "pulse-core" : ""}`} />
      {withLabel && <span className={`font-mono text-[11px] ${stock === "Out" ? "text-dim" : "text-steel"}`}>{s.label}</span>}
    </span>
  );
}

export function SpeedBar({ speed }: { speed: number }) {
  const pct = Math.min(100, (Math.log2(speed + 1) / Math.log2(10)) * 100);
  return (
    <span className="flex items-center gap-2">
      <span className="h-1 w-14 bg-graphite">
        <span className="block h-full bg-linear-to-r from-forge-deep to-forge" style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-[11px] text-dim">{speed.toFixed(1)}x</span>
    </span>
  );
}

export function money(v: number, digits = 2) {
  return `$${v.toFixed(digits)}`;
}

export function GpuName({ gpu }: { gpu: Gpu }) {
  return (
    <span>
      <span className="font-medium text-ink">{gpu.name}</span>
      <span className="ml-2 font-mono text-[10px] uppercase text-dim">{gpu.vendor}</span>
    </span>
  );
}
