export type Category =
  | "reasoning"
  | "research"
  | "planning"
  | "structure"
  | "memory"
  | "simulation"
  | "adaptation";

export type StyleId = "methodical" | "balanced" | "rapid";

export interface Preset {
  id: string;
  name: string;
  summary: string;
  affinity: Partial<Record<Category, number>>;
}

export interface Style {
  id: StyleId;
  name: string;
  summary: string;
  accuracy: number;
  stepFactor: number;
}

export interface Skill {
  id: string;
  name: string;
  category: Category;
  version: string;
  summary: string;
  limits: string;
  bonus: Partial<Record<Category, number>>;
  stepFactor?: number;
  compliance?: number;
  recovery?: boolean;
  unlockLevel: number;
}

export interface Task {
  id: string;
  prompt: string;
  answer: string;
  distractors: string[];
  difficulty: number;
  category: Category;
  steps: number;
  values?: Record<string, number>;
  distance?: number;
  shift?: string;
}

export interface Rubric {
  quality: number;
  completion: number;
  efficiency: number;
  compliance: number;
}

export type Mechanic = "standard" | "chain" | "memory" | "strategy" | "adaptive";

export interface Mission {
  slug: string;
  name: string;
  code: string;
  version: string;
  focus: Category;
  mechanic: Mechanic;
  summary: string;
  objective: string;
  input: string;
  context?: string[];
  constraints: string[];
  budget: number;
  rubric: Rubric;
  rubricNotes: Record<keyof Rubric, string>;
  tasks: Task[];
}

export type RunStatus =
  | "queued"
  | "running"
  | "evaluating"
  | "completed"
  | "failed"
  | "cancelled"
  | "invalidated";

export type EventType =
  | "queued"
  | "started"
  | "sandbox"
  | "context"
  | "tool_call"
  | "output"
  | "checkpoint"
  | "warning"
  | "shift"
  | "recovery"
  | "halted"
  | "budget"
  | "completed"
  | "failed"
  | "evaluating"
  | "scored";

export interface RunEvent {
  at: number;
  type: EventType;
  message: string;
}

export interface TaskResult {
  taskId: string;
  prompt: string;
  given: string | null;
  expected: string;
  correct: boolean;
  credit: number;
  violation: boolean;
  steps: number;
  note?: string;
}

export interface ScoreBreakdown {
  quality: number;
  completion: number;
  efficiency: number;
  compliance: number;
  total: number;
}

export interface SimOutcome {
  outcome: "completed" | "failed";
  events: RunEvent[];
  results: TaskResult[];
  score: ScoreBreakdown;
  stepsUsed: number;
  budget: number;
  durationMs: number;
  summary: string;
}

export interface ConfigSnapshot {
  role: string;
  style: StyleId;
  skills: string[];
  level: number;
}

export interface Account {
  id: string;
  createdAt: number;
  demo?: boolean;
}

export interface Agent {
  id: string;
  ownerId: string;
  name: string;
  role: string;
  style: StyleId;
  objective: string;
  skills: string[];
  configVersion: number;
  visibility: "public" | "private";
  status: "active" | "archived" | "suspended";
  createdAt: number;
  updatedAt: number;
  demo?: boolean;
}

export interface Run {
  id: string;
  agentId: string;
  ownerId: string;
  missionSlug: string;
  missionVersion: string;
  season: number;
  configVersion: number;
  config: ConfigSnapshot;
  createdAt: number;
  startsAt: number;
  sim: SimOutcome;
  runtimeVersion: string;
  evaluatorVersion: string;
  cancelledAt?: number;
  invalidated?: { reason: string; at: number };
  flagged?: { reason: string; at: number };
  demo?: boolean;
}

export interface MissionControl {
  paused: boolean;
  reason?: string;
  at?: number;
}

export interface AuditEntry {
  at: number;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

export interface DbShape {
  schema: number;
  seededAt: number;
  accounts: Account[];
  agents: Agent[];
  runs: Run[];
  missions: Record<string, MissionControl>;
  audit: AuditEntry[];
}
