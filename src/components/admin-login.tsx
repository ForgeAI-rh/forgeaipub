"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/actions";

export function AdminLogin() {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  return (
    <form action={action} className="panel max-w-sm space-y-3 p-5">
      <label className="block">
        <span className="label mb-1.5 block">Moderator token</span>
        <input name="token" type="password" autoComplete="off" className="input" required />
      </label>
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Checking" : "Sign in"}
      </button>
      <p className="text-[11px] leading-relaxed text-dim">Set FORGE_ADMIN_TOKEN in the server environment. Sessions last 8 hours.</p>
    </form>
  );
}
