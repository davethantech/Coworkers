import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentId, AgentState, Approval, ChatMsg, MemEntry, MemKind, Packet, PlanTracker, Settings, TermLine, Toast } from "./types";
import { AGENT_DEFS, AGENT_ORDER, SEED_MEMORY, WARM_LINES } from "./data/scripts";

export const uid = (): string => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
const seedTs = Date.now() - 1000 * 60 * 60 * 26;

function makeAgent(id: AgentId): AgentState {
  const def = AGENT_DEFS[id];
  const lines: TermLine[] = (WARM_LINES[id] || []).map((l, i) => ({ id: uid(), kind: l.kind, text: l.text, ts: seedTs + i * 1200 }));
  return { id, status: "idle", statusText: "ready", pos: { ...def.desk }, bubble: null, stream: null, lines, current: null, queue: [], done: 0, idleTimer: 4000 + Math.random() * 8000 };
}

const DEFAULT_SETTINGS: Settings = {
  officeName: "Coworkers",
  speed: 1,
  autoApproveBelow: 0,
  baseUrl: "",
  apiKey: "",
  model: "",
  provider: "auto",
  liveRouting: false,
  paused: false,
  executionMode: "real",
  workspaceRoot: "",
  allowNetwork: true,
  allowShell: true,
  allowBrowser: true,
  allowMedia: true,
  maxParallelAgents: 6,
};

export interface OfficeState {
  agents: Record<AgentId, AgentState>;
  selected: AgentId;
  inspectorTab: "terminal" | "queue" | "memory" | "tools" | "activity";
  chat: ChatMsg[];
  packets: Packet[];
  approvals: Approval[];
  memory: MemEntry[];
  plans: PlanTracker[];
  pendingPlans: { id: string; ts: number; text: string }[];
  pendingSummaries: { ts: number; text: string; planId: string }[];
  toasts: Toast[];
  settings: Settings;
  stats: { tasksDone: number; approvals: number; firstBootTs: number };
  everBooted: boolean;
  bootedThisSession: boolean;
  select: (id: AgentId, tab?: OfficeState["inspectorTab"]) => void;
  setSettings: (patch: Partial<Settings>) => void;
  pushToast: (kind: Toast["kind"], text: string) => void;
  dismissToast: (id: string) => void;
  addMemory: (scope: AgentId | "shared", kind: MemKind, text: string, by: string) => void;
  deleteMemory: (id: string) => void;
  markBooted: () => void;
}

export const useOffice = create<OfficeState>()(
  persist(
    (set) => ({
      agents: Object.fromEntries(AGENT_ORDER.map((id) => [id, makeAgent(id)])) as Record<AgentId, AgentState>,
      selected: "commander",
      inspectorTab: "terminal",
      chat: [],
      packets: [],
      approvals: [],
      memory: SEED_MEMORY.map((m) => ({ ...m, id: uid(), ts: seedTs + Math.random() * 900000 })),
      plans: [],
      pendingPlans: [],
      pendingSummaries: [],
      toasts: [],
      settings: DEFAULT_SETTINGS,
      stats: { tasksDone: 0, approvals: 0, firstBootTs: Date.now() },
      everBooted: false,
      bootedThisSession: false,
      select: (id, tab) => set((s) => ({ selected: id, inspectorTab: tab ?? s.inspectorTab })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      pushToast: (kind, text) => set((s) => ({ toasts: [...s.toasts.slice(-7), { id: uid(), kind, text }] })),
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      addMemory: (scope, kind, text, by) => set((s) => ({ memory: [...s.memory, { id: uid(), scope, kind, text, ts: Date.now(), by }] })),
      deleteMemory: (id) => set((s) => ({ memory: s.memory.filter((m) => m.id !== id) })),
      markBooted: () => set({ everBooted: true, bootedThisSession: true }),
    }),
    {
      name: "coworkers.v2",
      version: 2,
      partialize: (s) => ({
        chat: s.chat,
        memory: s.memory,
        settings: { ...s.settings, apiKey: "", paused: false },
        stats: s.stats,
        everBooted: s.everBooted,
        approvals: s.approvals.slice(-30),
      }),
    },
  ),
);

export const office = () => useOffice.getState();
