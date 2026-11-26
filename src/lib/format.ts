const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function agentCode(id: string) {
  return `AGT:${id.toUpperCase()}`;
}

export function runCode(id: string) {
  return `RUN:${id.toUpperCase()}`;
}

export function date(ts: number) {
  const d = new Date(ts);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function dateTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${date(ts)}, ${hh}:${mm} UTC`;
}

export function ago(ts: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function clock(ms: number) {
  const s = ms / 1000;
  return `+${s.toFixed(1).padStart(4, "0")}s`;
}
