"use client";

import { useState } from "react";
import { leafOf, verify, type ReceiptFields } from "@/lib/receipts";

export function VerifyReceipt({ fields, leaf, proof, root }: { fields: ReceiptFields; leaf: string; proof: string[]; root: string }) {
  const [state, setState] = useState<"idle" | "ok" | "bad">("idle");
  return (
    <button
      type="button"
      className={`btn btn-sm ${state === "ok" ? "border-ok/60 text-ok" : state === "bad" ? "border-bad/60 text-bad" : ""}`}
      onClick={async () => {
        const recomputed = await leafOf(fields);
        setState(recomputed === leaf && (await verify(recomputed, proof, root)) ? "ok" : "bad");
      }}
      title="Recomputes the receipt hash and its proof in your browser"
    >
      {state === "ok" ? "Matches root" : state === "bad" ? "Mismatch" : "Verify"}
    </button>
  );
}
