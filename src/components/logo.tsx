export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="5" fill="#ececec" />
      <rect x="2" y="9" width="5" height="13" fill="#ececec" />
      <rect x="9" y="9" width="10" height="5" fill="#a3a3a3" />
      <rect x="9" y="16" width="6" height="6" fill="#ff6a1a" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      <span className="font-display text-[15px] font-semibold tracking-[0.14em]">
        FORGE<span className="text-forge">AI</span>
      </span>
    </span>
  );
}
