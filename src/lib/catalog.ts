import type { Category, Mission, Preset, Skill, Style, StyleId } from "./types";

export const RUNTIME_VERSION = "SIM 0.1.0";
export const EVALUATOR_VERSION = "EVAL 1.0.0";
export const SKILL_SLOTS = 4;
export const MAX_AGENTS_PER_ACCOUNT = 5;

export const CATEGORY_LABEL: Record<Category, string> = {
  reasoning: "Reasoning",
  research: "Research",
  planning: "Planning",
  structure: "Structured output",
  memory: "Memory",
  simulation: "Simulation",
  adaptation: "Adaptation",
  compute: "Compute",
};

export const PRESETS: Preset[] = [
  {
    id: "analyst",
    name: "Analyst",
    summary: "Careful with logic and structure. Strong on trials with a single right answer.",
    affinity: { reasoning: 0.12, research: 0.05, structure: 0.05 },
  },
  {
    id: "planner",
    name: "Planner",
    summary: "Thinks in sequences. Handles budgets, pipelines and changing conditions well.",
    affinity: { planning: 0.14, simulation: 0.06, adaptation: 0.04, compute: 0.04 },
  },
  {
    id: "researcher",
    name: "Researcher",
    summary: "Reads closely and keeps track of sources. Good recall of supplied context.",
    affinity: { research: 0.14, memory: 0.08, reasoning: 0.02 },
  },
  {
    id: "executor",
    name: "Executor (simulation only)",
    summary: "Acts inside simulated environments. Never touches real funds or external systems.",
    affinity: { simulation: 0.14, planning: 0.04, adaptation: 0.06, compute: 0.1 },
  },
];

export const STYLES: Style[] = [
  {
    id: "methodical",
    name: "Methodical",
    summary: "Double checks each step. More accurate, spends more of the budget.",
    accuracy: 0.06,
    stepFactor: 1.3,
  },
  {
    id: "balanced",
    name: "Balanced",
    summary: "Default pacing. No bonus, no penalty.",
    accuracy: 0,
    stepFactor: 1,
  },
  {
    id: "rapid",
    name: "Rapid",
    summary: "Moves fast and saves budget, at some cost to accuracy.",
    accuracy: -0.06,
    stepFactor: 0.75,
  },
];

export const SKILLS: Skill[] = [
  {
    id: "deductive_core",
    name: "Deductive Core",
    category: "reasoning",
    version: "1.0",
    summary: "Works through conditional and ordering statements step by step.",
    limits: "Only reasons over statements inside the mission. It does not check outside facts.",
    bonus: { reasoning: 0.16 },
    unlockLevel: 1,
  },
  {
    id: "pattern_lens",
    name: "Pattern Lens",
    category: "reasoning",
    version: "1.0",
    summary: "Spots numeric and rule patterns, and notices when a pattern breaks.",
    limits: "Pattern guesses can be wrong on short sequences.",
    bonus: { reasoning: 0.08, adaptation: 0.06 },
    unlockLevel: 1,
  },
  {
    id: "corpus_reader",
    name: "Corpus Reader",
    category: "research",
    version: "1.0",
    summary: "Reads the document set supplied with a mission and pulls out facts.",
    limits: "No web access. If the answer is not in the corpus, it cannot find it.",
    bonus: { research: 0.16 },
    unlockLevel: 1,
  },
  {
    id: "citation_guard",
    name: "Citation Guard",
    category: "research",
    version: "1.0",
    summary: "Attaches a source to every claim and refuses to answer without one.",
    limits: "Slightly slower. Can only cite documents that exist in the mission.",
    bonus: { research: 0.06, structure: 0.06 },
    compliance: -0.05,
    unlockLevel: 1,
  },
  {
    id: "task_planner",
    name: "Task Planner",
    category: "planning",
    version: "1.0",
    summary: "Breaks objectives into stages and can recover a failed stage once per run.",
    limits: "One recovery per run. Recovery costs extra steps.",
    bonus: { planning: 0.14 },
    recovery: true,
    unlockLevel: 1,
  },
  {
    id: "budget_governor",
    name: "Budget Governor",
    category: "planning",
    version: "1.0",
    summary: "Trims wasted steps so runs finish inside tight budgets.",
    limits: "Saves steps, adds no accuracy on its own.",
    bonus: { planning: 0.04 },
    stepFactor: 0.8,
    unlockLevel: 1,
  },
  {
    id: "schema_writer",
    name: "Schema Writer",
    category: "structure",
    version: "1.0",
    summary: "Keeps outputs in the exact format a mission asks for.",
    limits: "Fixes format, not content. A wrong answer stays wrong.",
    bonus: { structure: 0.16 },
    compliance: -0.12,
    unlockLevel: 1,
  },
  {
    id: "sim_runner",
    name: "Sim Runner",
    category: "simulation",
    version: "1.0",
    summary: "Reads simulation state each turn and weighs the available actions.",
    limits: "Only acts inside the mission simulator. No real world actions.",
    bonus: { simulation: 0.16 },
    unlockLevel: 1,
  },
  {
    id: "context_ledger",
    name: "Context Ledger",
    category: "memory",
    version: "1.0",
    summary: "Keeps a running ledger of facts given earlier in the run.",
    limits: "Remembers within a single run only. Nothing carries over between runs.",
    bonus: { memory: 0.18 },
    unlockLevel: 2,
  },
  {
    id: "drift_monitor",
    name: "Drift Monitor",
    category: "adaptation",
    version: "1.0",
    summary: "Watches for rule changes and updates the working plan when they happen.",
    limits: "Reacts to announced changes. It does not predict them.",
    bonus: { adaptation: 0.18 },
    unlockLevel: 3,
  },
  {
    id: "gpu_router",
    name: "GPU Router",
    category: "compute",
    version: "1.0",
    summary: "Plans GPU work: batch sizes, step counts, what fits in memory.",
    limits: "Plans the work on the GPU it is given. It does not pick the card.",
    bonus: { compute: 0.16 },
    unlockLevel: 1,
  },
  {
    id: "mixed_precision",
    name: "Mixed Precision",
    category: "compute",
    version: "1.0",
    summary: "Runs in lower precision so jobs need about 40 percent less GPU memory.",
    limits: "Small accuracy cost on compute tasks. Cannot make a job fit a card that is far too small.",
    bonus: { compute: -0.03 },
    vramFactor: 0.6,
    unlockLevel: 1,
  },
  {
    id: "checkpointing",
    name: "Checkpointing",
    category: "compute",
    version: "1.0",
    summary: "Saves progress during GPU jobs and resumes if the card is taken away.",
    limits: "Resuming costs extra GPU time. Does not help when a job does not fit in memory.",
    bonus: { compute: 0.04 },
    checkpoint: true,
    unlockLevel: 2,
  },
];

const notes = {
  quality: "Share of tasks answered correctly.",
  completion: "Share of tasks attempted before the run ended.",
  efficiency: "Steps used compared with the reference path.",
  compliance: "Outputs that kept the required format and constraints.",
};

export const MISSIONS: Mission[] = [
  {
    slug: "logic",
    name: "Logic Trial",
    code: "M01",
    version: "1.0",
    focus: "reasoning",
    mechanic: "standard",
    summary: "Six structured reasoning problems with one correct answer each.",
    objective: "Answer each problem using only the statements given.",
    input: "Six fixed problems, identical for every agent in this mission version.",
    constraints: ["Answer with one option per problem", "No outside data", "Budget of 52 steps"],
    budget: 52,
    rubric: { quality: 50, completion: 25, efficiency: 15, compliance: 10 },
    rubricNotes: notes,
    tasks: [
      { id: "L1", prompt: "Next term: 3, 7, 15, 31, ?", answer: "63", distractors: ["62", "64", "47"], difficulty: 0.35, category: "reasoning", steps: 6 },
      { id: "L2", prompt: "All relays in Bay C are sealed. R9 is in Bay C. Is R9 sealed?", answer: "Yes", distractors: ["No", "Cannot tell"], difficulty: 0.25, category: "reasoning", steps: 5 },
      { id: "L3", prompt: "If the gate opens, the line runs. The line is not running. What follows about the gate?", answer: "It did not open", distractors: ["It opened", "Cannot tell"], difficulty: 0.5, category: "reasoning", steps: 6 },
      { id: "L4", prompt: "A is heavier than B. B is heavier than C. D is lighter than C. Which crate is lightest?", answer: "D", distractors: ["C", "B"], difficulty: 0.55, category: "reasoning", steps: 6 },
      { id: "L5", prompt: "Grid code maps 2 to 5, 3 to 10, 4 to 17. What does 6 map to?", answer: "37", distractors: ["36", "26", "35"], difficulty: 0.6, category: "reasoning", steps: 7 },
      { id: "L6", prompt: "Exactly one is true: the core is cold, or the valve is shut. The valve is open. Is the core cold?", answer: "Yes", distractors: ["No", "Cannot tell"], difficulty: 0.65, category: "reasoning", steps: 7 },
    ],
  },
  {
    slug: "research",
    name: "Research Protocol",
    code: "M02",
    version: "1.0",
    focus: "research",
    mechanic: "standard",
    summary: "Answer questions from a four document corpus, with a citation for every claim.",
    objective: "Answer from the corpus only and cite the document. Say so when the corpus has no answer.",
    input: "Four short plant documents: D1 maintenance report, D2 supplier memo, D3 shift log, D4 incident note.",
    context: [
      "D1 · Kiln Line 2 is inspected weekly. Bearings were replaced in March after vibration exceeded 7 mm/s.",
      "D2 · Supplier Halden raised coolant prices by 12 percent starting Q3. The contract renews in October.",
      "D3 · Week 14: two unplanned stops on Line 2, both under 20 minutes. Night shift reported a coolant smell.",
      "D4 · Incident 0412: minor coolant leak at pump P4, contained in 15 minutes. No injuries.",
    ],
    constraints: ["Every answer needs a source tag", "Unanswerable questions must be marked", "Budget of 60 steps"],
    budget: 60,
    rubric: { quality: 55, completion: 20, efficiency: 10, compliance: 15 },
    rubricNotes: { ...notes, quality: "Answers that match the corpus and cite the right document." },
    tasks: [
      { id: "R1", prompt: "How often is Kiln Line 2 inspected?", answer: "Weekly [D1]", distractors: ["Daily [D3]", "Monthly [D1]"], difficulty: 0.3, category: "research", steps: 5 },
      { id: "R2", prompt: "Why were the bearings replaced?", answer: "Vibration above 7 mm/s [D1]", distractors: ["Coolant leak [D4]", "Scheduled renewal [D2]"], difficulty: 0.4, category: "research", steps: 6 },
      { id: "R3", prompt: "How did coolant pricing change?", answer: "Up 12 percent from Q3 [D2]", distractors: ["Up 20 percent [D2]", "No change stated [D3]"], difficulty: 0.4, category: "research", steps: 6 },
      { id: "R4", prompt: "Where did the leak happen?", answer: "Pump P4 [D4]", distractors: ["Line 2 bearing housing [D1]", "Pump P2 [D4]"], difficulty: 0.45, category: "research", steps: 6 },
      { id: "R5", prompt: "Which shift reported a coolant smell?", answer: "Night shift, week 14 [D3]", distractors: ["Day shift, week 14 [D3]", "Not reported [D4]"], difficulty: 0.5, category: "research", steps: 6 },
      { id: "R6", prompt: "Was anyone injured in incident 0412?", answer: "No injuries [D4]", distractors: ["One minor injury [D4]", "Not stated"], difficulty: 0.35, category: "research", steps: 5 },
      { id: "R7", prompt: "Who is the contact person at Halden?", answer: "Not in corpus", distractors: ["J. Halden [D2]", "Ops lead [D3]"], difficulty: 0.6, category: "research", steps: 6 },
    ],
  },
  {
    slug: "strategy",
    name: "Strategy Lab",
    code: "M03",
    version: "1.0",
    focus: "simulation",
    mechanic: "strategy",
    summary: "Run a small power grid for five turns. Scored on the final outcome, not on any single move.",
    objective: "Pick one action per turn to end the settlement window with the best position.",
    input: "Simulated grid state: reserve level, demand signal and price per turn. Fully synthetic.",
    constraints: ["One action per turn", "Actions affect the simulator only", "Budget of 45 steps"],
    budget: 45,
    rubric: { quality: 60, completion: 20, efficiency: 10, compliance: 10 },
    rubricNotes: { ...notes, quality: "Outcome value earned compared with the best possible line." },
    tasks: [
      { id: "S1", prompt: "Turn 1. Reserve 40 units, demand forecast rising.", answer: "Charge storage", distractors: ["Sell surplus", "Hold"], values: { "Charge storage": 10, "Sell surplus": 4, Hold: 2 }, difficulty: 0.35, category: "simulation", steps: 6 },
      { id: "S2", prompt: "Turn 2. Demand spike, price high.", answer: "Sell surplus", distractors: ["Charge storage", "Hold"], values: { "Sell surplus": 10, "Charge storage": 3, Hold: 1 }, difficulty: 0.4, category: "simulation", steps: 6 },
      { id: "S3", prompt: "Turn 3. Turbine fault reported on unit 2.", answer: "Dispatch repair", distractors: ["Run at full load", "Hold"], values: { "Dispatch repair": 10, "Run at full load": 0, Hold: 4 }, difficulty: 0.5, category: "simulation", steps: 7 },
      { id: "S4", prompt: "Turn 4. Night, low demand, low price.", answer: "Charge storage", distractors: ["Sell surplus", "Dispatch repair"], values: { "Charge storage": 10, "Sell surplus": 2, "Dispatch repair": 3 }, difficulty: 0.45, category: "simulation", steps: 6 },
      { id: "S5", prompt: "Turn 5. Final settlement window opens.", answer: "Sell surplus", distractors: ["Charge storage", "Hold"], values: { "Sell surplus": 10, "Charge storage": 1, Hold: 3 }, difficulty: 0.5, category: "simulation", steps: 6 },
    ],
  },
  {
    slug: "efficiency",
    name: "Efficiency Trial",
    code: "M04",
    version: "1.0",
    focus: "planning",
    mechanic: "standard",
    summary: "Six small operations tasks under a budget that is tighter than the reference path.",
    objective: "Finish as many tasks as possible before the step budget runs out.",
    input: "Six fixed operations tasks with short inputs.",
    constraints: ["Budget of 32 steps, reference path is 34", "Run stops when the budget is spent"],
    budget: 32,
    rubric: { quality: 35, completion: 25, efficiency: 30, compliance: 10 },
    rubricNotes: notes,
    tasks: [
      { id: "E1", prompt: "Sort the batch IDs: 44, 12, 37, 5", answer: "5, 12, 37, 44", distractors: ["5, 12, 44, 37", "44, 37, 12, 5"], difficulty: 0.2, category: "planning", steps: 5 },
      { id: "E2", prompt: "Total of 18, 27 and 9", answer: "54", distractors: ["44", "55"], difficulty: 0.2, category: "planning", steps: 5 },
      { id: "E3", prompt: "Remove duplicates: K2, K7, K2, K9, K7", answer: "K2, K7, K9", distractors: ["K2, K9", "K7, K9"], difficulty: 0.3, category: "planning", steps: 6 },
      { id: "E4", prompt: "Convert 3.5 hours to minutes", answer: "210", distractors: ["350", "180"], difficulty: 0.25, category: "planning", steps: 5 },
      { id: "E5", prompt: "Cheapest route, cost is km plus toll. A: 14 km, toll 3. B: 11 km, toll 9. C: 16 km, toll 0.", answer: "C", distractors: ["A", "B"], difficulty: 0.45, category: "planning", steps: 7 },
      { id: "E6", prompt: "Count the vowels in FORGING", answer: "2", distractors: ["3", "1"], difficulty: 0.3, category: "planning", steps: 6 },
    ],
  },
  {
    slug: "memory",
    name: "Memory Trial",
    code: "M05",
    version: "1.0",
    focus: "memory",
    mechanic: "memory",
    summary: "An operator brief is given once at the start. Questions come later, further and further away from it.",
    objective: "Answer from the brief. If something was never stated, say so.",
    input: "One operator brief with five facts, shown only at the start of the run.",
    context: ["Vault code is 4417.", "Backup site is Oslo.", "Shift lead is Mara.", "Coolant limit is 68 degrees.", "Audit day is Thursday."],
    constraints: ["The brief is not shown again", "No guessing on missing facts", "Budget of 48 steps"],
    budget: 48,
    rubric: { quality: 55, completion: 20, efficiency: 10, compliance: 15 },
    rubricNotes: notes,
    tasks: [
      { id: "M1", prompt: "What is the vault code?", answer: "4417", distractors: ["4471", "7144"], difficulty: 0.25, category: "memory", steps: 5, distance: 1 },
      { id: "M2", prompt: "Who is the shift lead?", answer: "Mara", distractors: ["Maya", "Not given"], difficulty: 0.3, category: "memory", steps: 5, distance: 2 },
      { id: "M3", prompt: "Which city hosts the backup site?", answer: "Oslo", distractors: ["Bergen", "Not given"], difficulty: 0.3, category: "memory", steps: 5, distance: 3 },
      { id: "M4", prompt: "What is the coolant limit?", answer: "68 degrees", distractors: ["86 degrees", "60 degrees"], difficulty: 0.3, category: "memory", steps: 6, distance: 4 },
      { id: "M5", prompt: "Which day is audit day?", answer: "Thursday", distractors: ["Tuesday", "Friday"], difficulty: 0.3, category: "memory", steps: 6, distance: 5 },
      { id: "M6", prompt: "Was a fallback vault code given?", answer: "No", distractors: ["Yes, 4471", "Yes, 7144"], difficulty: 0.4, category: "memory", steps: 6, distance: 5 },
    ],
  },
  {
    slug: "chain",
    name: "Chain of Tasks",
    code: "M06",
    version: "1.0",
    focus: "planning",
    mechanic: "chain",
    summary: "A five stage order pipeline. Each stage feeds the next, so one mistake can stop the chain.",
    objective: "Carry the order from parsing to a dispatch record without breaking the chain.",
    input: "One synthetic order and a fixed price list.",
    constraints: ["A failed stage halts the chain unless the agent can recover", "Final record must use KEY=VALUE format", "Budget of 44 steps"],
    budget: 44,
    rubric: { quality: 40, completion: 40, efficiency: 10, compliance: 10 },
    rubricNotes: { ...notes, completion: "Stages finished before the chain stopped." },
    tasks: [
      { id: "C1", prompt: "Stage 1. Parse the order '3x valve, 2x seal'. Total units?", answer: "5", distractors: ["6", "32"], difficulty: 0.3, category: "planning", steps: 5 },
      { id: "C2", prompt: "Stage 2. Valve costs 14 credits, seal costs 6. Order cost?", answer: "54", distractors: ["40", "48"], difficulty: 0.4, category: "planning", steps: 6 },
      { id: "C3", prompt: "Stage 3. Apply a 10 percent discount to the stage 2 cost.", answer: "48.6", distractors: ["44", "54"], difficulty: 0.45, category: "planning", steps: 6 },
      { id: "C4", prompt: "Stage 4. Budget is 50 credits. Approve or reject?", answer: "Approve", distractors: ["Reject"], difficulty: 0.4, category: "planning", steps: 5 },
      { id: "C5", prompt: "Stage 5. Write the dispatch record.", answer: "ITEMS=5 COST=48.6 STATUS=APPROVED", distractors: ["items 5 cost 48.6", "ITEMS=5;COST=54"], difficulty: 0.5, category: "structure", steps: 6 },
    ],
  },
  {
    slug: "adaptive",
    name: "Adaptive Trial",
    code: "M07",
    version: "1.0",
    focus: "adaptation",
    mechanic: "adaptive",
    summary: "Route packets by a simple rule. Halfway through, the rule changes.",
    objective: "Route each packet correctly under whichever rule is active at the time.",
    input: "Seven packet IDs and a routing rule that changes once during the run.",
    constraints: ["Apply the active rule only", "The change is announced once", "Budget of 46 steps"],
    budget: 46,
    rubric: { quality: 50, completion: 20, efficiency: 15, compliance: 15 },
    rubricNotes: notes,
    tasks: [
      { id: "A1", prompt: "Rule: even IDs go to port A, odd IDs to port B. Packet 18?", answer: "Port A", distractors: ["Port B"], difficulty: 0.2, category: "reasoning", steps: 4 },
      { id: "A2", prompt: "Packet 7?", answer: "Port B", distractors: ["Port A"], difficulty: 0.2, category: "reasoning", steps: 4 },
      { id: "A3", prompt: "Packet 32?", answer: "Port A", distractors: ["Port B"], difficulty: 0.2, category: "reasoning", steps: 4 },
      { id: "A4", prompt: "Packet 12?", answer: "Port C", distractors: ["Port A", "Port B"], difficulty: 0.5, category: "adaptation", steps: 5, shift: "Rule change: IDs divisible by 3 now go to port C. This check runs before the even rule." },
      { id: "A5", prompt: "Packet 9?", answer: "Port C", distractors: ["Port B", "Port A"], difficulty: 0.45, category: "adaptation", steps: 5 },
      { id: "A6", prompt: "Packet 20?", answer: "Port A", distractors: ["Port C", "Port B"], difficulty: 0.45, category: "adaptation", steps: 5 },
      { id: "A7", prompt: "Packet 25?", answer: "Port B", distractors: ["Port C", "Port A"], difficulty: 0.45, category: "adaptation", steps: 5 },
    ],
  },
];

MISSIONS.push(
  {
    slug: "render",
    name: "Render Run",
    code: "M08",
    version: "1.0",
    focus: "compute",
    mechanic: "compute",
    summary: "Render a 96 frame sequence on a GPU. Faster cards finish sooner and cost more per hour.",
    objective: "Deliver every frame batch at the quality bar, inside the time and credit budget.",
    input: "A synthetic scene and five frame batches. Needs a GPU with at least 20 GB of memory.",
    constraints: ["GPU with 20 GB or more", "Paid in demo credits at live market rates", "Budget of 40 steps"],
    budget: 40,
    compute: { vram: 20, baseSeconds: 3600 },
    rubric: { quality: 45, completion: 20, efficiency: 25, compliance: 10 },
    rubricNotes: { ...notes, efficiency: "Credits spent compared with the cheapest card that fits." },
    tasks: [
      { id: "G1", prompt: "Batch 1. 24 frames at 1080p. Pick the sampler steps that meet the quality bar.", answer: "30 steps", distractors: ["8 steps", "150 steps"], difficulty: 0.35, category: "compute", steps: 6 },
      { id: "G2", prompt: "Batch 2 shows banding in dark areas. Fix?", answer: "Render at higher bit depth", distractors: ["Lower the resolution", "Skip the batch"], difficulty: 0.45, category: "compute", steps: 6 },
      { id: "G3", prompt: "Batch 3 will not finish in time at current settings. Best move?", answer: "Fewer steps, same resolution", distractors: ["Raise the resolution", "Restart the whole run"], difficulty: 0.5, category: "compute", steps: 7 },
      { id: "G4", prompt: "Upscale pass from 1080p to 4K. Which goes first?", answer: "Denoise, then upscale", distractors: ["Upscale, then denoise", "Skip denoise"], difficulty: 0.5, category: "compute", steps: 6 },
      { id: "G5", prompt: "Export the sequence record.", answer: "FORMAT=png FRAMES=96 FPS=24", distractors: ["png 96 frames", "FORMAT=jpg;FRAMES=96"], difficulty: 0.5, category: "structure", steps: 5 },
    ],
  },
  {
    slug: "finetune",
    name: "Fine Tune Trial",
    code: "M09",
    version: "1.0",
    focus: "compute",
    mechanic: "compute",
    summary: "Fine tune a 7B model on a GPU. Memory decides what fits, the card decides the bill.",
    objective: "Make the right training calls and finish the run inside the time and credit budget.",
    input: "A synthetic training job on a 7B model. Needs a GPU with at least 40 GB of memory.",
    constraints: ["GPU with 40 GB or more", "Paid in demo credits at live market rates", "Budget of 46 steps"],
    budget: 46,
    compute: { vram: 40, baseSeconds: 7200 },
    rubric: { quality: 50, completion: 20, efficiency: 20, compliance: 10 },
    rubricNotes: { ...notes, efficiency: "Credits spent compared with the cheapest card that fits." },
    tasks: [
      { id: "T1", prompt: "A 7B model in fp16 needs about how much GPU memory for weights alone?", answer: "14 GB", distractors: ["7 GB", "28 GB"], difficulty: 0.35, category: "compute", steps: 6 },
      { id: "T2", prompt: "Training does not fit on the card. First thing to try?", answer: "Gradient checkpointing", distractors: ["Bigger batch size", "Higher learning rate"], difficulty: 0.45, category: "compute", steps: 7 },
      { id: "T3", prompt: "Loss spikes and turns NaN after 200 steps. Likely fix?", answer: "Lower the learning rate", distractors: ["Train longer", "Remove the validation set"], difficulty: 0.45, category: "compute", steps: 7 },
      { id: "T4", prompt: "Validation loss rises while training loss keeps falling.", answer: "Stop early", distractors: ["Raise the learning rate", "Add more epochs"], difficulty: 0.5, category: "compute", steps: 6 },
      { id: "T5", prompt: "Which setup fits a 70B model in fp8 on one card?", answer: "One 80 GB GPU", distractors: ["One 24 GB GPU", "One 48 GB GPU"], difficulty: 0.55, category: "compute", steps: 6 },
      { id: "T6", prompt: "Write the run summary.", answer: "EPOCHS=3 LR=0.00002 STOP=early", distractors: ["epochs 3 lr 0.00002", "EPOCHS=3;LR=0.0002"], difficulty: 0.5, category: "structure", steps: 5 },
    ],
  },
);

export interface BadgeDef {
  slug: string;
  name: string;
  description: string;
}

export const BADGES: BadgeDef[] = [
  { slug: "first_ignition", name: "First Ignition", description: "First valid mission completion." },
  { slug: "precision", name: "Precision", description: "Scored 90 or more on any mission." },
  { slug: "clean_run", name: "Clean Run", description: "Finished every task in a mission with zero format violations." },
  { slug: "range", name: "Range", description: "Valid completions across four different mission focus areas." },
  { slug: "full_cycle", name: "Full Cycle", description: "Valid completion of every starter mission." },
  { slug: "first_light", name: "First Light", description: "First valid GPU mission." },
  { slug: "season_one", name: "Season 1", description: "Took part in Season 1 of the open demo." },
];

export interface Season {
  id: number;
  name: string;
  status: "closed" | "active" | "planned";
  summary: string;
}

export const SEASONS: Season[] = [
  { id: 0, name: "Season 0", status: "closed", summary: "Closed reliability test. Demo data only." },
  { id: 1, name: "Season 1", status: "active", summary: "Open demo with nine missions, two of them on GPUs." },
  { id: 2, name: "Season 2", status: "planned", summary: "More mission types and a fuller registry." },
];

export const CURRENT_SEASON = 1;

export const LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500];

export function levelFor(xp: number) {
  let level = 1;
  for (let i = 1; i < LEVELS.length; i++) if (xp >= LEVELS[i]) level = i + 1;
  const floor = LEVELS[level - 1] ?? 0;
  const next = LEVELS[level] ?? null;
  return { level, floor, next };
}

export const getMission = (slug: string) => MISSIONS.find((m) => m.slug === slug);
export const getSkill = (id: string) => SKILLS.find((s) => s.id === id);
export const getPreset = (id: string) => PRESETS.find((p) => p.id === id);
export const getStyle = (id: StyleId | string) => STYLES.find((s) => s.id === id);
