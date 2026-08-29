import { office, uid, useOffice } from "./store";
import {
  AGENT_DEFS, AGENT_ORDER, SPOTS, buildSteps, detectFlags, fallbackPlan,
  greeting, randomIdleBubble,
} from "./data/scripts";
import { llmConfigured, routeWithModel } from "./llm";
import type {
  ActiveTask, AgentId, AgentState, Approval, LineKind, Packet, PlanTracker, Step, TermLine,
} from "./types";

const TICK_MS = 420;
let llmInFlight = false;

/* ------------------------------ small helpers ------------------------------ */

function pushLine(a: AgentState, kind: LineKind, text: string) {
  const line: TermLine = { id: uid(), kind, text, ts: Date.now() };
  a.lines = [...a.lines.slice(-170), line];
}

function setBubble(a: AgentState, text: string) {
  a.bubble = { text: text.length > 90 ? text.slice(0, 87) + "…" : text, ts: Date.now() };
}

const STATUS_BY_TASK = (title: string) => "on: " + (title.length > 34 ? title.slice(0, 31) + "…" : title);

function sayInTick(from: AgentId, to: AgentId, text: string, agents: Record<AgentId, AgentState>, packets: Packet[]) {
  setBubble(agents[from], text);
  pushLine(agents[from], "msg", `→ ${AGENT_DEFS[to].name}: ${text}`);
  pushLine(agents[to], "msg", `← ${AGENT_DEFS[from].name}: ${text}`);
  packets.push({ id: uid(), from, to, ts: Date.now() });
}

function assignTask(agentId: AgentId, title: string, origin: ActiveTask["origin"], planId?: string) {
  const s = office();
  const a = s.agents[agentId];
  const contended = !!a.current || a.queue.length > 0;
  const steps = buildSteps(agentId, title, {
    contended,
    ...(origin === "user" ? detectFlags(title) : { spend: false, del: false, major: false }),
  });
  const task: ActiveTask = {
    id: uid(), planId, title, from: origin === "user" ? "the boss" : origin === "warm" ? "the board" : "moss",
    origin, steps, stepIdx: 0, elapsed: 0, emitted: 0, moved: false, startedStep: false,
  };
  useOffice.setState((st) => {
    const ag = { ...st.agents[agentId], queue: [...st.agents[agentId].queue], lines: st.agents[agentId].lines };
    if (ag.current) {
      ag.queue = [...ag.queue, task];
      pushLine(ag, "sys", `queued · ${title} (hands full — no stomping)`);
    } else {
      ag.current = task;
      ag.status = "working";
      ag.statusText = STATUS_BY_TASK(title);
      ag.pos = { ...AGENT_DEFS[agentId].desk };
      pushLine(ag, "sys", `ticket · ${title} — from ${task.from}`);
    }
    return { agents: { ...st.agents, [agentId]: ag } };
  });
}

/* -------------------------------- approvals -------------------------------- */

function createApproval(agentId: AgentId, spec: NonNullable<Step["approval"]>): Approval {
  const s = office();
  const approval: Approval = {
    id: uid(), agentId, kind: spec.kind, title: spec.title, detail: spec.detail,
    amount: spec.amount, status: "pending", ts: Date.now(),
  };
  const auto = spec.kind === "spend" && spec.amount != null && s.settings.autoApproveBelow > 0 && spec.amount <= s.settings.autoApproveBelow;
  if (auto) {
    approval.status = "approved";
    approval.resolvedTs = Date.now();
    s.pushToast("ok", `Auto-approved “${spec.title}” — under your $${s.settings.autoApproveBelow} policy`);
  } else {
    s.pushToast("warn", `${AGENT_DEFS[agentId].name} needs a signature: ${spec.title}`);
  }
  useOffice.setState((st) => ({
    approvals: [approval, ...st.approvals],
    stats: { ...st.stats, approvals: st.stats.approvals + 1 },
  }));
  return approval;
}

export function resolveApproval(id: string, verdict: "approved" | "denied") {
  const s = office();
  const ap = s.approvals.find((x) => x.id === id);
  if (!ap || ap.status !== "pending") return;
  useOffice.setState((st) => ({
    approvals: st.approvals.map((x) => (x.id === id ? { ...x, status: verdict, resolvedTs: Date.now() } : x)),
  }));
  s.pushToast(verdict === "approved" ? "ok" : "warn", verdict === "approved" ? `Signed off: ${ap.title}` : `Vetoed: ${ap.title} — ${AGENT_DEFS[ap.agentId].name} will take the safe route`);
}

/* ------------------------------- plan routing ------------------------------- */

function applyPlan(userText: string, plan: { reply: string; tasks: { agent: AgentId; title: string }[] }) {
  const planId = uid();
  const titles = plan.tasks.map((t) => t.title);
  const tracker: PlanTracker = { id: planId, total: plan.tasks.length, done: 0, summary: userText, titles };
  useOffice.setState((st) => ({
    plans: [...st.plans.filter((p) => p.done < p.total).slice(-5), tracker],
    chat: [...st.chat, { id: uid(), from: "moss" as const, text: plan.reply, ts: Date.now() }],
    agents: {
      ...st.agents,
      moss: (() => {
        const m = { ...st.agents.moss, lines: st.agents.moss.lines, status: "idle" as const, statusText: "on the floor" };
        pushLine(m, "ok", `dispatched ${plan.tasks.length} ticket(s): ${plan.tasks.map((t) => AGENT_DEFS[t.agent].name).join(", ")}`);
        return m;
      })(),
    },
  }));
  const packets: Packet[] = plan.tasks.map((t) => ({ id: uid(), from: "moss" as AgentId, to: t.agent, ts: Date.now() }));
  for (const t of plan.tasks) assignTask(t.agent, t.title, "user", planId);
  useOffice.setState((st) => ({ packets: [...st.packets, ...packets] }));
}

async function routeWithLlm(text: string) {
  const s = office();
  const ledger = s.memory.slice(-4).map((m) => m.text).join(" · ");
  try {
    const plan = await routeWithModel(s.settings, text, ledger);
    if (!office().settings.liveRouting) return; // settings changed mid-flight
    applyPlan(text, plan);
    office().pushToast("info", `Routed by ${office().settings.model} (live model)`);
  } catch {
    applyPlan(text, fallbackPlan(text));
    office().pushToast("warn", "Live model unreachable — Moss routed it with the house brain instead");
    useOffice.setState((st) => ({
      agents: {
        ...st.agents,
        moss: (() => {
          const m = { ...st.agents.moss, lines: st.agents.moss.lines };
          pushLine(m, "warn", "live model unreachable · fell back to house routing");
          return m;
        })(),
      },
    }));
  } finally {
    llmInFlight = false;
  }
}

export function sendUserMessage(raw: string) {
  const text = raw.trim();
  if (!text) return;
  const s = office();
  useOffice.setState((st) => ({
    chat: [...st.chat, { id: uid(), from: "user" as const, text, ts: Date.now() }],
  }));

  const remember = /^(remember|keep in mind|note to the office)[:\s]+(.+)/i.exec(text);
  if (remember) {
    s.addMemory("shared", "note", remember[2], "you");
    useOffice.setState((st) => ({
      chat: [...st.chat, { id: uid(), from: "moss" as const, text: "Noted in the ledger — we'll act like we always knew. It survives restarts, too.", ts: Date.now() }],
      agents: {
        ...st.agents,
        moss: (() => {
          const m = { ...st.agents.moss, lines: st.agents.moss.lines };
          pushLine(m, "mem", `✎ ledger: ${remember[2]}`);
          return m;
        })(),
      },
    }));
    return;
  }

  useOffice.setState((st) => ({
    agents: {
      ...st.agents,
      moss: { ...st.agents.moss, status: "thinking", statusText: "routing your request", pos: { ...AGENT_DEFS.moss.desk } },
    },
    pendingPlans: [...st.pendingPlans, { id: uid(), ts: Date.now() + 1100, text }],
  }));

  if (llmConfigured(s.settings) && !llmInFlight) {
    llmInFlight = true;
    useOffice.setState((st) => ({ pendingPlans: st.pendingPlans.slice(0, -1) }));
    void routeWithLlm(text);
  }
}

/* --------------------------------- the tick --------------------------------- */

function stepAgent(
  a: AgentState,
  agents: Record<AgentId, AgentState>,
  packets: Packet[],
  dt: number,
  now: number,
  approvals: Approval[],
) {
  a.bubble = a.bubble && now - a.bubble.ts > 5200 ? null : a.bubble;

  /* typing stream */
  if (a.stream) {
    const chunk = 5 + Math.floor(Math.random() * 10);
    a.stream.text += a.stream.full.slice(a.stream.text.length, a.stream.text.length + chunk);
    if (a.stream.text.length >= a.stream.full.length) {
      pushLine(a, a.stream.kind, a.stream.full);
      a.stream = null;
    }
    return;
  }

  const task = a.current;
  if (task) {
    /* blocked on approval? */
    if (task.approvalId) {
      const ap = approvals.find((x) => x.id === task.approvalId);
      if (ap && ap.status !== "pending") {
        if (ap.status === "approved") {
          pushLine(a, "ok", `signature received — proceeding with: ${ap.title}`);
        } else {
          pushLine(a, "warn", `vetoed — taking the safe route around: ${ap.title}`);
          pushLine(a, "out", "logging the veto in the ledger so future-us knows why");
        }
        task.approvalId = undefined;
        a.status = "working";
        a.statusText = STATUS_BY_TASK(task.title);
      } else if (Math.random() < 0.04) {
        setBubble(a, "Waiting on a signature. No rush. Slight rush.");
      }
      return;
    }

    const step = task.steps[task.stepIdx];
    if (!task.startedStep) {
      task.startedStep = true;
      task.elapsed = 0;
      task.emitted = 0;
      pushLine(a, "sys", `▸ ${step.label}`);
      if (step.move === "war") a.pos = { ...SPOTS.war };
      else if (step.move === "coffee") a.pos = { ...SPOTS.coffee };
      else if (step.move === "center") a.pos = { ...SPOTS.center };
      else if (step.move === "desk") a.pos = { ...AGENT_DEFS[a.id].desk };
      if (step.cmd) pushLine(a, "cmd", step.cmd);
    }

    task.elapsed += dt;
    const n = step.outputs.length;
    const interval = step.duration / (n + 1);
    while (task.emitted < n && task.elapsed >= interval * (task.emitted + 1)) {
      pushLine(a, "out", step.outputs[task.emitted]);
      task.emitted++;
    }

    if (task.emitted >= n && task.elapsed >= step.duration) {
      if (step.message) sayInTick(a.id, step.message.to, step.message.text, agents, packets);
      if (step.memory) {
        office().addMemory(step.memory.scope ?? a.id, step.memory.kind, step.memory.text, a.id);
        pushLine(a, "mem", `✎ ledger: ${step.memory.text}`);
      }
      if (step.approval && !task.approvalDone) {
        task.approvalDone = true;
        const ap = createApproval(a.id, step.approval);
        if (ap.status === "pending") {
          task.approvalId = ap.id;
          a.status = "blocked";
          a.statusText = "waiting on your signature";
          setBubble(a, "Boss — need a signature before I do this part.");
          return;
        }
        pushLine(a, "ok", "auto-approved by policy — carrying on");
      }
      task.stepIdx++;
      task.startedStep = false;

      if (task.stepIdx >= task.steps.length) {
        pushLine(a, "ok", `done · ${task.title}`);
        a.current = null;
        a.status = "idle";
        a.statusText = "on the floor";
        a.done += 1;
        useOffice.setState((st) => ({ stats: { ...st.stats, tasksDone: st.stats.tasksDone + 1 } }));

        if (task.origin === "user" && task.planId) {
          const st0 = office();
          const plans = st0.plans.map((p) => (p.id === task.planId ? { ...p, done: p.done + 1 } : p));
          const plan = plans.find((p) => p.id === task.planId);
          const summaries = [...st0.pendingSummaries];
          if (plan && plan.done >= plan.total && !summaries.some((x) => x.planId === plan.id)) {
            summaries.push({
              ts: Date.now() + 1400,
              planId: plan.id,
              text: `All ${plan.total > 1 ? plan.total + " tickets" : "ticket"} wrapped: ${plan.titles.join(" · ")}. Ledger updated, board is clean. Anything else, boss?`,
            });
            office().addMemory("shared", "fact", `Shipped: ${plan.titles.join(" · ")}`, "moss");
          }
          useOffice.setState({ plans, pendingSummaries: summaries });
        }
      }
    }
    return;
  }

  /* pull from queue */
  if (a.queue.length > 0) {
    const [next, ...rest] = a.queue;
    a.queue = rest;
    a.current = next;
    a.status = "working";
    a.statusText = STATUS_BY_TASK(next.title);
    a.pos = { ...AGENT_DEFS[a.id].desk };
    pushLine(a, "sys", `pulled from queue · ${next.title}`);
    return;
  }

  /* idle wandering */
  a.idleTimer -= dt;
  if (a.idleTimer <= 0) {
    a.idleTimer = 9000 + Math.random() * 14000;
    const desk = AGENT_DEFS[a.id].desk;
    const atDesk = Math.abs(a.pos.x - desk.x) < 2 && Math.abs(a.pos.y - desk.y) < 2;
    if (!atDesk) {
      a.pos = { ...desk };
      a.status = "idle";
      a.statusText = "on the floor";
    } else if (Math.random() < 0.5) {
      const spot =
        a.id === "cricket" ? SPOTS.coffee
        : a.id === "moss" ? SPOTS.war
        : Math.random() < 0.4 ? SPOTS.coffee : Math.random() < 0.5 ? SPOTS.center : SPOTS.war;
      a.pos = { x: spot.x + (Math.random() * 4 - 2), y: spot.y + (Math.random() * 3 - 1.5) };
      a.status = "away";
      a.statusText = spot === SPOTS.coffee ? "at the coffee machine" : spot === SPOTS.war ? "at the war room" : "stretching legs";
    } else if (Math.random() < 0.4 && (!a.bubble || now - a.bubble.ts > 9000)) {
      setBubble(a, randomIdleBubble(a.id));
    }
  }
}

function tick() {
  const now = Date.now();

  /* apply due fallback plans first so the snapshot below already reflects them */
  const pre = office();
  if (!pre.settings.paused) {
    const due = pre.pendingPlans.filter((p) => now >= p.ts);
    if (due.length > 0) {
      useOffice.setState((st) => ({ pendingPlans: st.pendingPlans.filter((p) => now < p.ts) }));
      for (const p of due) applyPlan(p.text, fallbackPlan(p.text));
    }
  }

  const s = office();
  if (s.settings.paused) return;
  const dt = TICK_MS * s.settings.speed;

  /* clone every agent up-front; all mid-tick writes go to these clones */
  const agents = {} as Record<AgentId, AgentState>;
  for (const id of AGENT_ORDER) {
    const prev = s.agents[id];
    agents[id] = {
      ...prev,
      pos: { ...prev.pos },
      queue: [...prev.queue],
      current: prev.current ? { ...prev.current } : null,
      stream: prev.stream ? { ...prev.stream } : null,
    };
  }
  const packets: Packet[] = [];
  for (const id of AGENT_ORDER) stepAgent(agents[id], agents, packets, dt, now, s.approvals);

  /* moss summaries */
  const sumsDue = s.pendingSummaries.filter((x) => now >= x.ts);
  for (let i = 0; i < sumsDue.length; i++) pushLine(agents.moss, "ok", "summary delivered · plan closed");

  const latest = office();
  useOffice.setState({
    agents,
    pendingSummaries: latest.pendingSummaries.filter((x) => now < x.ts),
    ...(sumsDue.length > 0
      ? { chat: [...latest.chat, ...sumsDue.map((x) => ({ id: uid(), from: "moss" as const, text: x.text, ts: Date.now() }))] }
      : {}),
    packets: [...latest.packets.filter((p) => now - p.ts < 1600), ...packets],
  });
}

/* --------------------------------- boot --------------------------------- */

let warmed = false;

export function warmBoot() {
  if (warmed) return;
  warmed = true;
  const s = office();
  const persisted = s.everBooted;
  const memCount = s.memory.length;

  /* approvals left pending when the office closed have expired */
  useOffice.setState((st) => ({
    approvals: st.approvals.map((ap) =>
      ap.status === "pending" ? { ...ap, status: "denied" as const, resolvedTs: Date.now() } : ap,
    ),
    chat: [...st.chat, { id: uid(), from: "moss" as const, text: greeting(persisted, memCount), ts: Date.now() }],
  }));
  s.markBooted();
  assignTask("rivet", "Refactor the session store behind an interface", "warm");
  assignTask("specs", "Triage the flaky checkout test", "warm");
  assignTask("lumen", "Digest RFC-042 and flag contradictions", "warm");
}

export function startEngine(): () => void {
  warmBoot();
  const iv = setInterval(tick, TICK_MS);
  return () => clearInterval(iv);
}
