"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  EVALUATOR_VERSION,
  MAX_AGENTS_PER_ACCOUNT,
  RUNTIME_VERSION,
  SKILL_SLOTS,
  CURRENT_SEASON,
  getMission,
  getPreset,
  getSkill,
  getStyle,
} from "@/lib/catalog";
import { read, write } from "@/lib/db";
import { seedFrom, simulate } from "@/lib/engine";
import { agentProgress, startCheck, viewRun } from "@/lib/forge";
import { randomId } from "@/lib/ids";
import { adminSignIn, adminSignOut, clearSession, currentAccountId, ensureAccount, isAdmin } from "@/lib/session";
import type { StyleId } from "@/lib/types";

export type FormState = { error?: string; ok?: string } | undefined;

const NAME_RE = /^[A-Za-z0-9 ._']{2,32}$/;

function parseAgentForm(form: FormData, level: number) {
  const name = String(form.get("name") ?? "").trim().replace(/\s+/g, " ");
  const role = String(form.get("role") ?? "");
  const style = String(form.get("style") ?? "") as StyleId;
  const objective = String(form.get("objective") ?? "").trim().replace(/\s+/g, " ");
  const visibility = form.get("visibility") === "private" ? "private" : "public";
  const skills = [...new Set(form.getAll("skills").map(String))];

  if (!NAME_RE.test(name)) return { error: "Name needs 2 to 32 characters: letters, numbers, spaces, dots or apostrophes." };
  if (!getPreset(role)) return { error: "Pick a role." };
  if (!getStyle(style)) return { error: "Pick an execution style." };
  if (objective.length < 12 || objective.length > 200) return { error: "Objective should be 12 to 200 characters." };
  if (skills.length < 1) return { error: "Equip at least one module. An agent with no modules cannot run missions." };
  if (skills.length > SKILL_SLOTS) return { error: `Only ${SKILL_SLOTS} module slots are available.` };
  for (const id of skills) {
    const skill = getSkill(id);
    if (!skill) return { error: "Unknown module selected." };
    if (skill.unlockLevel > level) return { error: `${skill.name} unlocks at level ${skill.unlockLevel}.` };
  }
  return { value: { name, role, style, objective, visibility, skills } as const };
}

export async function createAgent(_: FormState, form: FormData): Promise<FormState> {
  const owner = await ensureAccount();
  const parsed = parseAgentForm(form, 1);
  if ("error" in parsed) return { error: parsed.error };

  const db = await read();
  const count = db.agents.filter((a) => a.ownerId === owner && a.status !== "archived").length;
  if (count >= MAX_AGENTS_PER_ACCOUNT) return { error: `Limit is ${MAX_AGENTS_PER_ACCOUNT} active agents per account. Archive one first.` };

  const id = randomId(6);
  const now = Date.now();
  await write((d) =>
    d.agents.push({
      id,
      ownerId: owner,
      ...parsed.value,
      configVersion: 1,
      status: "active",
      createdAt: now,
      updatedAt: now,
    }),
  );
  revalidatePath("/app", "layout");
  redirect(`/app/agents/${id}?created=1`);
}

export async function updateAgent(agentId: string, _: FormState, form: FormData): Promise<FormState> {
  const owner = await currentAccountId();
  const db = await read();
  const agent = db.agents.find((a) => a.id === agentId);
  if (!owner || !agent || agent.ownerId !== owner) return { error: "You can only edit your own agents." };
  if (agent.status !== "active") return { error: "This agent is not active." };

  const parsed = parseAgentForm(form, agentProgress(db, agent.id).level);
  if ("error" in parsed) return { error: parsed.error };
  const v = parsed.value;
  const configChanged =
    v.role !== agent.role || v.style !== agent.style || v.skills.join() !== agent.skills.join();

  await write((d) => {
    const a = d.agents.find((x) => x.id === agentId)!;
    Object.assign(a, v, { updatedAt: Date.now() });
    if (configChanged) a.configVersion += 1;
  });
  revalidatePath("/app", "layout");
  redirect(`/app/agents/${agentId}`);
}

export async function archiveAgent(agentId: string) {
  const owner = await currentAccountId();
  await write((d) => {
    const a = d.agents.find((x) => x.id === agentId);
    if (a && a.ownerId === owner) a.status = a.status === "archived" ? "active" : "archived";
  });
  revalidatePath("/app", "layout");
}

export async function startRun(_: FormState, form: FormData): Promise<FormState> {
  const owner = await currentAccountId();
  if (!owner) return { error: "Create an agent first." };
  const agentId = String(form.get("agentId") ?? "");
  const slug = String(form.get("mission") ?? "");
  const db = await read();
  const agent = db.agents.find((a) => a.id === agentId && a.ownerId === owner);
  const mission = getMission(slug);
  if (!agent) return { error: "Pick one of your agents." };
  if (agent.status !== "active") return { error: "This agent is archived or suspended." };
  if (!mission) return { error: "Unknown mission." };
  if (db.missions[slug]?.paused) return { error: "This mission is paused by moderators." };
  if (!agent.skills.length) return { error: "Equip at least one module before running." };

  const blocked = startCheck(db, owner, agent.id, slug);
  if (blocked) return { error: blocked };

  const id = randomId(8);
  const now = Date.now();
  const config = { role: agent.role, style: agent.style, skills: [...agent.skills], level: agentProgress(db, agent.id).level };
  await write((d) =>
    d.runs.push({
      id,
      agentId: agent.id,
      ownerId: owner,
      missionSlug: slug,
      missionVersion: mission.version,
      season: CURRENT_SEASON,
      configVersion: agent.configVersion,
      config,
      createdAt: now,
      startsAt: now,
      sim: simulate(mission, config, seedFrom(`${id}:${agent.configVersion}`)),
      runtimeVersion: RUNTIME_VERSION,
      evaluatorVersion: EVALUATOR_VERSION,
    }),
  );
  revalidatePath("/app", "layout");
  redirect(`/app/runs/${id}`);
}

export async function cancelRun(runId: string) {
  const owner = await currentAccountId();
  await write((d) => {
    const r = d.runs.find((x) => x.id === runId);
    if (r && r.ownerId === owner && !viewRun(r).finished) r.cancelledAt = Date.now();
  });
  revalidatePath(`/app/runs/${runId}`);
}

export async function deleteMyData(_: FormState, form: FormData): Promise<FormState> {
  const owner = await currentAccountId();
  if (!owner) return { error: "There is no data stored for this browser." };
  if (String(form.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") return { error: "Type DELETE to confirm." };
  await write((d) => {
    const agentIds = new Set(d.agents.filter((a) => a.ownerId === owner).map((a) => a.id));
    d.runs = d.runs.filter((r) => r.ownerId !== owner && !agentIds.has(r.agentId));
    d.agents = d.agents.filter((a) => a.ownerId !== owner);
    d.accounts = d.accounts.filter((a) => a.id !== owner);
  });
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/app?deleted=1");
}

/* Moderation */

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised");
}

async function audit(action: string, target: string, detail: string) {
  await write((d) => d.audit.push({ at: Date.now(), actor: "admin", action, target, detail }));
}

export async function adminLogin(_: FormState, form: FormData): Promise<FormState> {
  const ok = await adminSignIn(String(form.get("token") ?? ""));
  if (!ok) return { error: "Token not accepted." };
  revalidatePath("/app/admin");
  return { ok: "Signed in." };
}

export async function adminLogout() {
  await adminSignOut();
  revalidatePath("/app/admin");
}

export async function toggleMission(slug: string, form: FormData) {
  await requireAdmin();
  const reason = String(form.get("reason") ?? "").trim().slice(0, 140) || "No reason given";
  let paused = false;
  await write((d) => {
    const cur = d.missions[slug];
    paused = !cur?.paused;
    d.missions[slug] = paused ? { paused: true, reason, at: Date.now() } : { paused: false, at: Date.now() };
  });
  await audit(paused ? "mission.pause" : "mission.resume", slug, paused ? reason : "Resumed");
  revalidatePath("/app", "layout");
}

export async function moderateRun(runId: string, kind: "invalidate" | "flag" | "restore", form: FormData) {
  await requireAdmin();
  const reason = String(form.get("reason") ?? "").trim().slice(0, 140) || "No reason given";
  await write((d) => {
    const r = d.runs.find((x) => x.id === runId);
    if (!r) return;
    if (kind === "invalidate") r.invalidated = { reason, at: Date.now() };
    if (kind === "flag") r.flagged = { reason, at: Date.now() };
    if (kind === "restore") {
      delete r.invalidated;
      delete r.flagged;
    }
  });
  await audit(`run.${kind}`, runId, kind === "restore" ? "Restored" : reason);
  revalidatePath("/app", "layout");
}

export async function toggleSuspend(agentId: string, form: FormData) {
  await requireAdmin();
  const reason = String(form.get("reason") ?? "").trim().slice(0, 140) || "No reason given";
  let now = "";
  await write((d) => {
    const a = d.agents.find((x) => x.id === agentId);
    if (!a) return;
    a.status = a.status === "suspended" ? "active" : "suspended";
    now = a.status;
  });
  await audit(now === "suspended" ? "agent.suspend" : "agent.reinstate", agentId, reason);
  revalidatePath("/app", "layout");
}
