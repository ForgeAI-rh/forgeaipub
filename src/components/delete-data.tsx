"use client";

import { useActionState } from "react";
import { deleteMyData } from "@/app/actions";

export function DeleteData() {
  const [state, action, pending] = useActionState(deleteMyData, undefined);
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="label mb-1.5 block">Type DELETE to confirm</span>
        <input name="confirm" className="input max-w-xs" autoComplete="off" />
      </label>
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <button className="btn border-bad/50 text-bad hover:border-bad" disabled={pending}>
        {pending ? "Deleting" : "Delete all my data"}
      </button>
    </form>
  );
}
