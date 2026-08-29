import type { AgentId, RoutePlan, Settings } from "./types";

export function normalizeBase(url: string): string {
  let u = url.trim().replace(/\/+$/, "");
  if (!u) return u;
  if (!/^https?:\/\//.test(u)) u = "http://" + u;
  if (!/\/v\d+$/.test(u)) u += "/v1";
  return u;
}

export function llmConfigured(s: Settings): boolean {
  return s.liveRouting && !!normalizeBase(s.baseUrl) && !!s.model.trim();
}

export async function testConnection(s: Settings): Promise<{ ok: boolean; detail: string }> {
  const base = normalizeBase(s.baseUrl);
  if (!base) return { ok: false, detail: "No base URL set" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${base}/models`, {
      headers: s.apiKey ? { Authorization: `Bearer ${s.apiKey}` } : {},
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status} from ${base}/models` };
    const data = await res.json().catch(() => null);
    const count = Array.isArray(data?.data) ? data.data.length : null;
    return { ok: true, detail: count != null ? `Reachable · ${count} model(s) listed` : "Reachable" };
  } catch (e) {
    return { ok: false, detail: e instanceof DOMException && e.name === "AbortError" ? "Timed out after 8s" : "Could not reach the endpoint" };
  } finally {
    clearTimeout(timer);
  }
}

const WORKER_ROLES: Record<AgentId, string> = {
  commander: "chief of staff: decompose requests, coordinate workers, manage priorities, verify completion, escalate risky actions",
  coder: "vibe coder: implement software, debug, refactor, use Git and local repositories",
  qa: "quality engineer: run tests, lint, browser checks, regressions, security checks, verify claims with evidence",
  itops: "IT operations engineer: diagnose and operate Linux, Windows, SSH, PowerShell, Docker, Kubernetes, networking and services",
  devops: "DevOps engineer: CI/CD, deployments, releases, cloud configuration and rollback/verification",
  music: "music producer: create music plans, MIDI/audio workflows, stems, arrangements and renders using available local tools",
  video: "video producer: scripts, storyboards, assets, voice, editing, captions and rendering using available local tools",
  designer: "designer: UI assets, graphics, thumbnails, brand systems and visual production",
  daily: "personal operations assistant: planning, reminders, task follow-up and approved personal workflows",
  research: "researcher: web/document research, source tracking, comparison and synthesis",
  analyst: "analyst: data analysis, spreadsheets, reports, metrics and decision support",
};

const ROUTER_SYSTEM = `You are the Commander of a local AI workforce. Decide who should do the work.
Return ONLY JSON matching:
{"reply": string, "tasks": [{"agent": AgentId, "title": string}]}
Allowed agents: commander, coder, qa, itops, devops, music, video, designer, daily, research, analyst.
Assign 1-4 concrete tasks. Use different specialists when useful. Do not invent completion claims. A task means work that an actual local agent/tool can perform.
Specialist roles:
${Object.entries(WORKER_ROLES).map(([id, role]) => `- ${id}: ${role}`).join("\n")}`;

function extractJson(raw: string): RoutePlan {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  const parsed = JSON.parse(raw.slice(start, end + 1)) as RoutePlan;
  if (!parsed.reply || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) throw new Error("Malformed plan");
  const allowed = new Set(Object.keys(WORKER_ROLES));
  parsed.tasks = parsed.tasks
    .filter((t) => allowed.has(t.agent))
    .slice(0, 4)
    .map((t) => ({ agent: t.agent, title: String(t.title).slice(0, 100) }));
  if (parsed.tasks.length === 0) throw new Error("No valid tasks");
  return parsed;
}

export async function routeWithModel(s: Settings, userText: string, ledgerHint: string): Promise<RoutePlan> {
  const base = normalizeBase(s.baseUrl);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(s.apiKey ? { Authorization: `Bearer ${s.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: s.model.trim(),
        temperature: 0.2,
        max_tokens: 600,
        messages: [
          { role: "system", content: ROUTER_SYSTEM },
          { role: "user", content: `Recent memory: ${ledgerHint}\n\nRequest: ${userText}` },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return extractJson(data?.choices?.[0]?.message?.content ?? "");
  } finally {
    clearTimeout(timer);
  }
}
