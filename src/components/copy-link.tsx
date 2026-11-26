"use client";

import { useState } from "react";

export function CopyLink({ path, label = "Copy profile link" }: { path: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Link copied" : label}
    </button>
  );
}
