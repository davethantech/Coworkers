import type { AgentDef, AgentId, MemEntry, RoutePlan, Step } from "../types";

export const AGENT_ORDER: AgentId[] = ["commander", "coder", "qa", "itops", "devops", "music", "video", "designer", "daily", "research", "analyst"];

const DEF = (id: AgentId, name: string, role: string, hue: string, initials: string, desk: { x: number; y: number }, blurb: string, capabilities: string[], defaultProvider = "auto"): AgentDef => ({ id, name, role, hue, initials, desk, blurb, capabilities, defaultProvider });

export const AGENT_DEFS: Record<AgentId, AgentDef> = {
  commander: DEF("commander", "Commander", "Chief of staff · plans & delegates", "#f2b44c", "CO", { x: 17, y: 21 }, "Owns the board, delegates work, watches dependencies, and escalates what deserves your attention.", ["planning", "delegation", "verification", "approvals"]),
  coder: DEF("coder", "Coder", "Vibe coder · builds software", "#5ec8de", "CO", { x: 61, y: 18 }, "Builds, debugs, refactors and ships code in real workspaces.", ["code", "git", "shell", "debugging", "web"]),
  qa: DEF("qa", "QA", "Quality engineer · proves it works", "#7bd88f", "QA", { x: 84, y: 31 }, "Runs the checks instead of inventing green output.", ["tests", "lint", "browser", "security", "verification"]),
  itops: DEF("itops", "IT Ops", "Infrastructure · keeps systems alive", "#b9dc5c", "IO", { x: 15, y: 64 }, "Handles real machines, services, logs, containers and operational incidents.", ["shell", "ssh", "powershell", "docker", "kubernetes", "networking"]),
  devops: DEF("devops", "DevOps", "Delivery · deploys & rolls back", "#9ac7ff", "DO", { x: 79, y: 67 }, "Owns releases, pipelines, environments and deployment verification.", ["ci", "cd", "cloud", "deploy", "rollback"]),
  music: DEF("music", "Music", "Producer · makes audio", "#e89cff", "MU", { x: 34, y: 48 }, "Turns ideas into compositions, MIDI, arrangements and rendered audio with available tools.", ["audio", "midi", "composition", "mixing"]),
  video: DEF("video", "Video", "Producer · makes video", "#ff9a7a", "VI", { x: 52, y: 48 }, "Builds scripts, storyboards, voice, edits, captions and final renders.", ["video", "storyboard", "voice", "editing", "ffmpeg"]),
  designer: DEF("designer", "Designer", "Visuals · creates assets", "#f28fc1", "DE", { x: 70, y: 48 }, "Creates visual systems, graphics, thumbnails and product assets.", ["graphics", "branding", "ui", "images"]),
  daily: DEF("daily", "Daily", "Personal ops · keeps life moving", "#d8b47a", "DA", { x: 35, y: 80 }, "Handles planning, reminders and approved personal workflows.", ["planning", "reminders", "calendar", "tasks"]),
  research: DEF("research", "Research", "Researcher · finds answers", "#7ec8a2", "RE", { x: 52, y: 80 }, "Researches the web, documents and projects and keeps the useful evidence.", ["web", "docs", "analysis", "sources"]),
  analyst: DEF("analyst", "Analyst", "Data · turns numbers into decisions", "#8ba7e6", "AN", { x: 70, y: 80 }, "Works with datasets, spreadsheets, metrics and reports.", ["data", "spreadsheets", "metrics", "reports"]),
};

export const SPOTS: Record<string, { x: number; y: number }> = {
  coffee: { x: 84, y: 78 },
  center: { x: 50, y: 39 },
  war: { x: 29, y: 27 },
  studio: { x: 52, y: 53 },
  terminal: { x: 17, y: 53 },
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const SEED_MEMORY: Omit<MemEntry, "id" | "ts">[] = [
  { scope: "shared", kind: "preference", text: "Prefer real tool output over simulated output. Never claim an action completed without evidence.", by: "commander" },
  { scope: "shared", kind: "decision", text: "Free-first: local/open tools are preferred; paid providers are optional adapters.", by: "commander" },
  { scope: "shared", kind: "decision", text: "High-impact actions require approval unless an explicit local policy allows automation.", by: "itops" },
  { scope: "shared", kind: "note", text: "Creative agents should reuse existing assets before generating new ones.", by: "designer" },
  { scope: "coder", kind: "preference", text: "Keep changes small, test them, then commit meaningful units.", by: "coder" },
  { scope: "qa", kind: "preference", text: "A green claim needs an actual command, result and timestamp.", by: "qa" },
];

export const IDLE_BUBBLES: Record<AgentId, string[]> = {
  commander: ["Watching the board. Something will happen.", "Dependencies are just meetings with better typography."],
  coder: ["Looking for the smallest useful diff.", "The bug is probably one await away."],
  qa: ["Green is earned, not narrated.", "Running the suspicious path again."],
  itops: ["Watching CPU, disk and logs.", "Quiet infrastructure is my favorite infrastructure."],
  devops: ["Canary first. Confidence second.", "Checking the deployment before calling it done."],
  music: ["Finding the pocket.", "Layering another take."],
  video: ["Cutting the boring seconds.", "Rendering a preview."],
  designer: ["The spacing is judging us.", "Making the visual hierarchy clearer."],
  daily: ["Checking what actually matters today.", "One useful thing at a time."],
  research: ["Cross-checking the source.", "Looking for the primary document."],
  analyst: ["The chart is lying until verified.", "Cleaning the denominator."],
};

export function greeting(persisted: boolean, memCount: number): string {
  if (!persisted) return "I'm Commander. Give me the outcome, not the ceremony. I'll route it to the specialist who can actually do the work.";
  return `Back again. The shared memory has ${memCount} entries and the workforce is ready. What needs doing?`;
}

export function buildSteps(agent: AgentId, title: string, opts: { contended: boolean; spend: boolean; del: boolean; major: boolean }): Step[] {
  const t = title.toLowerCase();
  const steps: Step[] = [];
  const evidence = (outputs: string[]): Step => ({ label: "collect evidence", outputs, duration: 2200 });

  if (agent === "coder") {
    steps.push({ label: "inspect the workspace", cmd: "pwd && git status --short && git branch --show-current", outputs: ["workspace inspected", "repository state captured"], duration: 2400, move: "terminal" });
    steps.push({ label: "implement the smallest safe change", outputs: ["editing only the affected files", "keeping existing conventions intact"], duration: 3600, move: "desk" });
    steps.push({ label: "run verification", cmd: "npm test -- --run", outputs: ["executing the real test command", "capturing stdout/stderr for the ledger"], duration: 3200, message: { to: "qa", text: "Implementation is ready for verification." } });
  } else if (agent === "qa") {
    steps.push({ label: "inspect the change", cmd: "git diff --check && git diff --stat", outputs: ["diff checked", "looking for correctness and collateral changes"], duration: 2400 });
    steps.push({ label: "run the relevant suite", cmd: "npm test -- --run", outputs: ["running the real suite", "recording the actual exit status"], duration: 3600 });
    steps.push(evidence(["test evidence captured", "result is attached to the task record"]));
  } else if (agent === "itops") {
    steps.push({ label: "inspect system health", cmd: "uname -a && uptime && df -h", outputs: ["collecting kernel, uptime and disk evidence", "checking for immediate resource pressure"], duration: 2800, move: "terminal" });
    steps.push({ label: "inspect service state", cmd: "docker ps --format '{{.Names}}\\t{{.Status}}'", outputs: ["querying real container state", "capturing unhealthy/restarting containers"], duration: 2800 });
    if (opts.major || opts.del) steps.push({ label: "wait for approval before mutation", outputs: ["mutation classified as high impact", "execution paused for human approval"], duration: 1200, approval: { kind: "production", title: "Approve infrastructure mutation", detail: `The IT Ops agent needs permission to make a potentially high-impact change for: ${title}` } });
    steps.push({ label: "verify operational state", cmd: "docker ps --format '{{.Names}}\\t{{.Status}}'", outputs: ["re-checking after the operation", "recording the final state"], duration: 2200 });
  } else if (agent === "devops") {
    steps.push({ label: "inspect release state", cmd: "git status --short && git log -1 --oneline", outputs: ["release candidate identified", "working tree state captured"], duration: 2200, move: "terminal" });
    if (opts.major) steps.push({ label: "approval gate", outputs: ["production-affecting action detected"], duration: 1200, approval: { kind: "production", title: "Approve production deployment", detail: `Deployment requested for: ${title}` } });
    steps.push({ label: "deploy and verify", outputs: ["running configured deployment command", "waiting for health checks", "recording deployment evidence"], duration: 4200 });
  } else if (agent === "music") {
    steps.push({ label: "brief the composition", outputs: ["extracting mood, tempo and structure", "choosing a free/local generation path when available"], duration: 1800, move: "studio" });
    steps.push({ label: "create the audio artifact", outputs: ["building arrangement", "rendering a working draft"], duration: 4200 });
    steps.push({ label: "export", outputs: ["WAV/MP3 export prepared", "artifact path recorded"], duration: 2200 });
  } else if (agent === "video") {
    steps.push({ label: "build the storyboard", outputs: ["scene list drafted", "shot timing and asset requirements identified"], duration: 2200, move: "studio" });
    steps.push({ label: "assemble the cut", outputs: ["media pipeline prepared", "voice/music/captions staged"], duration: 4800 });
    steps.push({ label: "render and verify", outputs: ["render completed or provider job submitted", "duration, codec and output path recorded"], duration: 3200 });
  } else if (agent === "designer") {
    steps.push({ label: "define visual direction", outputs: ["layout, hierarchy and asset requirements captured"], duration: 2000 });
    steps.push({ label: "create assets", outputs: ["building reusable assets", "keeping source files alongside exports"], duration: 4200, move: "studio" });
    steps.push({ label: "package deliverables", outputs: ["export set organized", "dimensions and formats verified"], duration: 2200 });
  } else if (agent === "daily") {
    steps.push({ label: "review today's context", outputs: ["collecting the task and schedule context available locally"], duration: 1800 });
    steps.push({ label: "organize priorities", outputs: ["turning requests into an ordered list", "surfacing conflicts and deadlines"], duration: 2400 });
    steps.push({ label: "prepare follow-up", outputs: ["next actions prepared", "anything requiring human confirmation highlighted"], duration: 1800 });
  } else if (agent === "research") {
    steps.push({ label: "find primary sources", outputs: ["searching approved sources", "separating primary evidence from commentary"], duration: 3200, move: "war" });
    steps.push({ label: "cross-check", outputs: ["comparing evidence", "flagging uncertainty and stale information"], duration: 3200 });
    steps.push({ label: "deliver findings", outputs: ["concise findings prepared", "sources recorded for later recall"], duration: 2200 });
  } else if (agent === "analyst") {
    steps.push({ label: "inspect the data", outputs: ["schema and sample rows examined", "missing/invalid values identified"], duration: 2600 });
    steps.push({ label: "analyze", outputs: ["calculating requested metrics", "checking edge cases and denominator choices"], duration: 3600 });
    steps.push({ label: "report", outputs: ["results packaged with assumptions", "source data and method recorded"], duration: 2200 });
  } else {
    steps.push({ label: "coordinate the request", outputs: ["breaking the outcome into specialist tasks", "checking dependencies and approvals"], duration: 2200, move: "center" });
  }

  if (opts.spend && agent !== "commander") steps.splice(Math.max(0, steps.length - 1), 0, { label: "approval gate", outputs: ["external spend detected", "waiting for explicit approval"], duration: 1200, approval: { kind: "spend", title: "Approve external spend", detail: `The task may incur external cost: ${title}` } });
  return steps;
}

export function fallbackPlan(text: string): RoutePlan {
  const t = text.toLowerCase();
  const tasks: { agent: AgentId; title: string }[] = [];
  if (/video|film|reel|youtube|short/.test(t)) tasks.push({ agent: "video", title: text });
  if (/music|song|beat|sound|audio/.test(t)) tasks.push({ agent: "music", title: text });
  if (/code|website|app|bug|react|node|python|php|github|vibe/.test(t)) tasks.push({ agent: "coder", title: text });
  if (/server|linux|windows|ssh|docker|kubernetes|incident|cpu|disk|deploy/.test(t)) tasks.push({ agent: "itops", title: text });
  if (/deploy|release|vercel|ci|pipeline/.test(t)) tasks.push({ agent: "devops", title: text });
  if (/image|logo|design|thumbnail|graphic/.test(t)) tasks.push({ agent: "designer", title: text });
  if (/today|tomorrow|remind|calendar|task|schedule/.test(t)) tasks.push({ agent: "daily", title: text });
  if (/research|find|compare|investigate|latest/.test(t)) tasks.push({ agent: "research", title: text });
  if (/data|excel|spreadsheet|csv|metrics|report/.test(t)) tasks.push({ agent: "analyst", title: text });
  if (/test|qa|verify|check/.test(t)) tasks.push({ agent: "qa", title: text });
  if (!tasks.length) tasks.push({ agent: "commander", title: text });
  return { reply: `I have routed this to ${tasks.map((x) => AGENT_DEFS[x.agent].name).join(" + ")}.`, tasks: tasks.slice(0, 4) };
}

export const WARM_LINES: Record<AgentId, { kind: LineKind; text: string }[]> = Object.fromEntries(
  AGENT_ORDER.map((id) => [id, [
    { kind: "sys", text: `${AGENT_DEFS[id].name} online · capability profile loaded` },
    { kind: "ok", text: `ready · ${AGENT_DEFS[id].capabilities.slice(0, 3).join(" · ")}` },
  ]]),
) as Record<AgentId, { kind: LineKind; text: string }[]>;

export function randomIdleBubble(id: AgentId): string { return pick(IDLE_BUBBLES[id]); }
