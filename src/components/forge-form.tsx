"use client";

import { useActionState, useMemo, useState } from "react";
import type { FormState } from "@/app/actions";
import { CATEGORY_LABEL, PRESETS, SKILLS, SKILL_SLOTS, STYLES } from "@/lib/catalog";
import { competence } from "@/lib/engine";
import type { Category, StyleId } from "@/lib/types";

type Defaults = {
  name: string;
  role: string;
  style: StyleId;
  objective: string;
  skills: string[];
  visibility: "public" | "private";
};

const CATS: Category[] = ["reasoning", "research", "planning", "structure", "memory", "simulation", "adaptation"];

export function ForgeForm({
  action,
  defaults,
  level,
  submitLabel,
  idPreview,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  defaults?: Defaults;
  level: number;
  submitLabel: string;
  idPreview?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [name, setName] = useState(defaults?.name ?? "");
  const [role, setRole] = useState(defaults?.role ?? "analyst");
  const [style, setStyle] = useState<StyleId>(defaults?.style ?? "balanced");
  const [skills, setSkills] = useState<string[]>(defaults?.skills ?? []);
  const [objective, setObjective] = useState(defaults?.objective ?? "");

  const toggle = (id: string) =>
    setSkills((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : cur.length >= SKILL_SLOTS ? cur : [...cur, id]));

  const profile = useMemo(
    () => CATS.map((c) => ({ c, v: competence({ role, style, skills, level }, c) })),
    [role, style, skills, level],
  );

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-10">
        <Block n="01" title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" hint="2 to 32 characters">
              <input name="name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} required placeholder="Kestrel" />
            </Field>
            <Field label="Visibility" hint="Public agents appear in the registry and leaderboard">
              <select name="visibility" defaultValue={defaults?.visibility ?? "public"} className="input">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </Field>
          </div>
          <Field label="Objective" hint={`${objective.length} / 200`}>
            <textarea
              name="objective"
              className="input"
              rows={2}
              maxLength={200}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Answer structured problems accurately and keep every output in format."
              required
            />
          </Field>
        </Block>

        <Block n="02" title="Configure">
          <div className="label mb-2">Role</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <label
                key={p.id}
                className={`cursor-pointer rounded-[3px] border p-3.5 transition-colors ${role === p.id ? "border-forge bg-forge/5" : "border-line hover:border-[#4a4a4a]"}`}
              >
                <input type="radio" name="role" value={p.id} checked={role === p.id} onChange={() => setRole(p.id)} className="sr-only" />
                <div className="text-sm font-medium">{p.name}</div>
                <div className="mt-1 text-xs leading-relaxed text-steel">{p.summary}</div>
              </label>
            ))}
          </div>
          <div className="label mb-2 mt-6">Execution style</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {STYLES.map((s) => (
              <label
                key={s.id}
                className={`cursor-pointer rounded-[3px] border p-3 transition-colors ${style === s.id ? "border-forge bg-forge/5" : "border-line hover:border-[#4a4a4a]"}`}
              >
                <input type="radio" name="style" value={s.id} checked={style === s.id} onChange={() => setStyle(s.id)} className="sr-only" />
                <div className="text-sm font-medium">{s.name}</div>
                <div className="mt-1 text-xs leading-relaxed text-steel">{s.summary}</div>
              </label>
            ))}
          </div>
        </Block>

        <Block n="03" title="Equip" aside={`${skills.length} / ${SKILL_SLOTS} slots`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {SKILLS.map((s) => {
              const locked = s.unlockLevel > level;
              const on = skills.includes(s.id);
              const full = !on && skills.length >= SKILL_SLOTS;
              return (
                <label
                  key={s.id}
                  className={`relative rounded-[3px] border p-3.5 transition-colors ${
                    locked ? "cursor-not-allowed border-line opacity-45" : on ? "cursor-pointer border-forge bg-forge/5" : full ? "cursor-not-allowed border-line opacity-60" : "cursor-pointer border-line hover:border-[#4a4a4a]"
                  }`}
                >
                  <input type="checkbox" name="skills" value={s.id} checked={on} disabled={locked || full} onChange={() => toggle(s.id)} className="sr-only" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="font-mono text-[10px] uppercase text-dim">{locked ? `LV ${s.unlockLevel}` : CATEGORY_LABEL[s.category]}</span>
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-steel">{s.summary}</div>
                  <div className="mt-2 text-[11px] leading-relaxed text-dim">Limit: {s.limits}</div>
                </label>
              );
            })}
          </div>
        </Block>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="panel tick">
          <div className="border-b border-line px-4 py-3">
            <div className="label">Configuration summary</div>
            <div className="mt-2 font-display text-lg font-semibold">{name || "Unnamed agent"}</div>
            <div className="font-mono text-[11px] text-dim">{idPreview ?? "ID assigned on create"}</div>
          </div>
          <div className="space-y-2.5 px-4 py-4">
            {profile.map(({ c, v }) => {
              const pct = Math.max(0, Math.min(100, ((v - 0.3) / 0.6) * 100));
              return (
                <div key={c}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="text-steel">{CATEGORY_LABEL[c]}</span>
                    <span className="font-mono text-dim">{Math.round(v * 100)}</span>
                  </div>
                  <div className="h-1 bg-graphite">
                    <div className="h-full bg-forge transition-[width] duration-200" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-dim">
            Competence values feed the seeded simulator. They shift the odds per task, they do not guarantee results.
          </div>
          <div className="border-t border-line p-4">
            {state?.error && <p className="mb-3 text-sm text-bad">{state.error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={pending}>
              {pending ? "Saving" : submitLabel}
            </button>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Block({ n, title, aside, children }: { n: string; title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between border-b border-line pb-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-forge">{n}</span>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
        </div>
        {aside && <span className="font-mono text-xs text-dim">{aside}</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex justify-between">
        <span className="label">{label}</span>
        {hint && <span className="text-[11px] text-dim">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
