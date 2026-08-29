import type { RoutePlan, Settings } from "./types";
import { AGENT_ORDER } from "./data/scripts";

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
    clearTimeout(timer);
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status} from ${base}/models` };
    const data = await res.json().catch(() => null);
    const count = Array.isArray(data?.data) ? data.data.length : null;
    return { ok: true, detail: count != null ? `Reachable · ${count} model(s) listed` : "Reachable" };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, detail: e instanceof DOMException && e.name === "AbortError" ? "Timed out after 8s" : "Could not reach the endpoint" };
  }
}

const ROUTER_SYSTEM = `You are Moss, foreman of a tiny AI dev office. Workers: rivet (writes code), specs (tests & reviews), lumen (docs & research), cricket (ops, deploys, infra). Given the boss's request, reply with ONLY compact JSON:
{"reply": string, "tasks": [{"agent": "rivet"|"specs"|"lumen"|"cricket", "title": string}]}
- reply: one short sentence to the boss, in Moss's dry, competent voice.
- 1-2 tasks max, no duplicate agents, titles under 60 chars, concrete.
No markdown fences, no commentary.`;

export async function routeWithModel(s: Settings, userText: string, ledgerHint: string): Promise<RoutePlan> {
  const base = normalizeBase(s.baseUrl);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(s.apiKey ? { Authorization: `Bearer ${s.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: s.model.trim(),
        temperature: 0.4,
        max_tokens: 300,
        messages: [
          { role: "system", content: ROUTER_SYSTEM },
          { role: "user", content: `Office memory hints: ${ledgerHint}\n\nBoss says: ${userText}` },
        ],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in response");
    const parsed = JSON.parse(raw.slice(start, end + 1)) as RoutePlan;
    if (!parsed.reply || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) throw new Error("Malformed plan");
    const allowed = new Set(AGENT_ORDER);
    parsed.tasks = parsed.tasks.filter((t) => allowed.has(t.agent)).slice(0, 2);
    if (parsed.tasks.length === 0) throw new Error("No valid tasks");
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}
