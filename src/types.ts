export type AgentId = "moss" | "rivet" | "specs" | "lumen" | "cricket";

export type AgentStatus = "idle" | "thinking" | "working" | "blocked" | "away";

export type LineKind = "cmd" | "out" | "ok" | "warn" | "err" | "sys" | "msg" | "mem";

export interface TermLine {
  id: string;
  kind: LineKind;
  text: string;
  ts: number;
}

export interface StreamChunk {
  full: string;
  text: string;
  kind: LineKind;
}

export type ApprovalKind = "spend" | "delete" | "major";

export interface ApprovalSpec {
  kind: ApprovalKind;
  title: string;
  detail: string;
  amount?: number;
}

export interface Step {
  label: string;
  cmd?: string;
  outputs: string[];
  duration: number; // simulated ms
  approval?: ApprovalSpec;
  message?: { to: AgentId; text: string };
  memory?: { kind: MemKind; text: string; scope?: AgentId | "shared" };
  move?: "desk" | "war" | "coffee" | "center";
}

export interface ActiveTask {
  id: string;
  planId?: string;
  title: string;
  from: string;
  origin: "user" | "warm" | "internal";
  steps: Step[];
  stepIdx: number;
  elapsed: number;
  emitted: number;
  moved: boolean;
  startedStep: boolean;
  approvalId?: string;
  approvalDone?: boolean;
}

export interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  hue: string;
  initials: string;
  desk: { x: number; y: number };
  blurb: string;
}

export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  statusText: string;
  pos: { x: number; y: number };
  bubble: { text: string; ts: number } | null;
  stream: StreamChunk | null;
  lines: TermLine[];
  current: ActiveTask | null;
  queue: ActiveTask[];
  done: number;
  idleTimer: number;
}

export interface ChatMsg {
  id: string;
  from: "user" | "moss";
  text: string;
  ts: number;
}

export interface Packet {
  id: string;
  from: AgentId;
  to: AgentId;
  ts: number;
}

export type MemKind = "fact" | "decision" | "preference" | "note";

export interface MemEntry {
  id: string;
  scope: AgentId | "shared";
  kind: MemKind;
  text: string;
  ts: number;
  by: string;
}

export interface Approval {
  id: string;
  agentId: AgentId;
  kind: ApprovalKind;
  title: string;
  detail: string;
  amount?: number;
  status: "pending" | "approved" | "denied";
  ts: number;
  resolvedTs?: number;
}

export interface Toast {
  id: string;
  kind: "ok" | "warn" | "err" | "info";
  text: string;
}

export interface Settings {
  officeName: string;
  speed: number; // 0.5 | 1 | 2
  autoApproveBelow: number; // dollars; 0 = always ask
  baseUrl: string;
  apiKey: string;
  model: string;
  liveRouting: boolean;
  paused: boolean;
}

export interface PlanTracker {
  id: string;
  total: number;
  done: number;
  summary: string;
  titles: string[];
}

export interface InspectorTab {
  value: "terminal" | "queue" | "memory";
}

export interface RoutePlan {
  reply: string;
  tasks: { agent: AgentId; title: string }[];
}
