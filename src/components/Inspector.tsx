import { useState } from "react";
import { useOffice } from "../store";
import { AGENT_DEFS, AGENT_ORDER } from "../data/scripts";
import type { AgentId, MemKind } from "../types";
import { cx, timeAgo } from "../util";
import { Terminal } from "./Terminal";
import { IconCheck, IconChip, IconInbox, IconQueue, IconTerminal, IconTrash } from "./icons";

const KIND_CHIP: Record<MemKind, { label: string; cls: string }> = {
  fact: { label: "fact", cls: "text-pool border-pool/30 bg-pool/10" },
  decision: { label: "decision", cls: "text-brass border-brass/30 bg-brass/10" },
  preference: { label: "preference", cls: "text-leaf border-leaf/30 bg-leaf/10" },
  note: { label: "note", cls: "text-coral border-coral/30 bg-coral/10" },
};

function QueueTab({ id }: { id: AgentId }) {
  const agent = useOffice((s) => s.agents[id]);
  const def = AGENT_DEFS[id];
  const task = agent.current;
  const step = task ? task.steps[task.stepIdx] : null;
  const frac = task && step ? Math.min(1, task.elapsed / step.duration) : 0;
  const overall = task ? ((task.stepIdx + (task.startedStep ? frac : 0)) / task.steps.length) * 100 : 0;

  if (!task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <span className="w-12 h-12 rounded-full border border-line flex items-center justify-center text-fog">
          <IconInbox size={22} />
        </span>
        <p className="text-[12.5px] text-mist">{def.name} is clear.</p>
        <p className="text-[11px] text-fog -mt-1.5">Toss {def.id === "moss" ? "the crew" : def.id === "specs" ? "her" : "him"} some work from the foreman's desk below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
      <div className="rounded-lg border border-line-soft bg-ink-900/70 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-fog">in progress · from {task.from}</div>
            <div className="text-[13px] font-medium mt-0.5 leading-snug">{task.title}</div>
          </div>
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9.5px] font-display font-semibold uppercase tracking-wider border"
            style={{ color: def.hue, borderColor: `${def.hue}55`, background: `${def.hue}14` }}>
            {agent.status === "blocked" ? "held" : "live"}
          </span>
        </div>
        <div className="mt-2.5 h-1.5 rounded-full bg-ink-750 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${overall}%`, background: def.hue }} />
        </div>
        <ul className="mt-3 space-y-1.5">
          {task.steps.map((s, i) => (
            <li key={i} className={cx("flex items-center gap-2 text-[11.5px]", i < task.stepIdx ? "text-mist" : i === task.stepIdx ? "text-paper" : "text-fog/70")}>
              {i < task.stepIdx ? (
                <IconCheck size={12} className="text-leaf shrink-0" />
              ) : i === task.stepIdx ? (
                <span className="w-3 h-3 shrink-0 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: def.hue }} />
                </span>
              ) : (
                <span className="w-3 h-3 shrink-0 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-fog/50" />
                </span>
              )}
              <span className={i === task.stepIdx ? "font-medium" : ""}>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {agent.queue.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-fog px-1 mb-1.5">up next · {agent.queue.length}</div>
          <div className="space-y-1.5">
            {agent.queue.map((q) => (
              <div key={q.id} className="rounded-md border border-line-soft bg-ink-900/50 px-3 py-2 text-[12px] text-mist">
                {q.title}
                <span className="block text-[10px] text-fog mt-0.5">queued · from {q.from}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryTab({ id }: { id: AgentId }) {
  const memory = useOffice((s) => s.memory);
  const addMemory = useOffice((s) => s.addMemory);
  const deleteMemory = useOffice((s) => s.deleteMemory);
  const pushToast = useOffice((s) => s.pushToast);
  const def = AGENT_DEFS[id];
  const [draft, setDraft] = useState("");

  const entries = memory
    .filter((m) => m.scope === id || m.scope === "shared")
    .sort((a, b) => b.ts - a.ts);

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    addMemory(id, "note", t, "you");
    pushToast("ok", `Note left for ${def.name} — it survives restarts`);
    setDraft("");
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={`Leave a note for ${def.name}…`}
            className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-ink-950/70 border border-line-soft text-[12px] placeholder:text-fog/70 outline-none focus:border-line transition-colors"
          />
          <button
            onClick={submit}
            className="h-8 px-3 rounded-md bg-ink-750 border border-line text-[11.5px] font-medium text-mist hover:text-paper hover:border-fog/40 transition-colors"
          >
            Pin it
          </button>
        </div>
        <p className="text-[10px] text-fog mt-1.5">Stored locally. {def.name} reads the ledger before every job — this persists across sessions.</p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-1.5">
        {entries.length === 0 && (
          <div className="h-full flex items-center justify-center text-fog/70 text-[11.5px]">Nothing remembered yet.</div>
        )}
        {entries.map((m) => {
          const chip = KIND_CHIP[m.kind];
          return (
            <div key={m.id} className="group rounded-md border border-line-soft bg-ink-900/50 px-3 py-2 hover:border-line transition-colors">
              <div className="flex items-center gap-1.5">
                <span className={cx("px-1.5 py-px rounded text-[9px] font-display font-semibold uppercase tracking-wider border", chip.cls)}>{chip.label}</span>
                {m.scope === "shared" && (
                  <span className="px-1.5 py-px rounded text-[9px] font-display font-semibold uppercase tracking-wider border text-mist border-line bg-ink-800">shared</span>
                )}
                <button
                  onClick={() => {
                    deleteMemory(m.id);
                    pushToast("info", "Memory struck from the ledger");
                  }}
                  className="ml-auto opacity-0 group-hover:opacity-100 text-fog hover:text-coral transition-all"
                  title="Forget this"
                >
                  <IconTrash size={13} />
                </button>
              </div>
              <p className="text-[12px] text-paper/90 leading-snug mt-1.5">{m.text}</p>
              <p className="text-[10px] text-fog mt-1">
                by {m.by === "you" ? "you" : AGENT_DEFS[m.by as AgentId]?.name ?? m.by} · {timeAgo(m.ts)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Inspector() {
  const selected = useOffice((s) => s.selected);
  const select = useOffice((s) => s.select);
  const tab = useOffice((s) => s.inspectorTab);
  const agents = useOffice((s) => s.agents);
  const memory = useOffice((s) => s.memory);
  const agent = agents[selected];
  const def = AGENT_DEFS[selected];

  const tabs = [
    { id: "terminal" as const, label: "Terminal", icon: <IconTerminal size={13} /> },
    { id: "queue" as const, label: agent.queue.length > 0 ? `Queue · ${agent.queue.length + (agent.current ? 1 : 0)}` : "Queue", icon: <IconQueue size={13} /> },
    { id: "memory" as const, label: `Memory · ${memory.filter((m) => m.scope === selected || m.scope === "shared").length}`, icon: <IconChip size={13} /> },
  ];

  const statusLabel =
    agent.status === "working" ? "working" :
    agent.status === "thinking" ? "thinking" :
    agent.status === "blocked" ? "needs signature" :
    agent.status === "away" ? "away from desk" : "idle";

  return (
    <aside className="w-[390px] shrink-0 border-l border-line bg-ink-850 flex flex-col min-h-0">
      {/* agent switcher */}
      <div className="flex items-center gap-1.5 px-3 pt-3">
        {AGENT_ORDER.map((id) => {
          const d = AGENT_DEFS[id];
          const a = agents[id];
          const sel = id === selected;
          return (
            <button
              key={id}
              onClick={() => select(id)}
              className={cx(
                "relative w-9 h-9 rounded-full border-2 flex items-center justify-center font-display font-bold text-[11px] transition-all duration-200",
                sel ? "scale-105" : "opacity-55 hover:opacity-90 hover:scale-105",
              )}
              style={{
                borderColor: d.hue,
                color: d.hue,
                background: sel ? `${d.hue}18` : "var(--color-ink-900)",
                boxShadow: sel ? `0 0 14px ${d.hue}44` : undefined,
              }}
              title={`${d.name} — ${a.statusText}`}
            >
              {d.initials}
              <span
                className={cx("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-ink-850", (a.status === "blocked" || a.status === "thinking") && "animate-pulse-soft")}
                style={{ background: a.status === "working" ? d.hue : a.status === "blocked" ? "#f0796b" : a.status === "thinking" ? "#f2b44c" : "#64789c" }}
              />
            </button>
          );
        })}
        <span className="ml-auto text-[10px] text-fog font-mono">{agent.done} done</span>
      </div>

      {/* header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-line-soft">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display font-bold text-lg tracking-wide">{def.name}</h2>
          <span
            className="px-1.5 py-px rounded text-[9px] font-display font-semibold uppercase tracking-[0.12em] border"
            style={{ color: def.hue, borderColor: `${def.hue}50`, background: `${def.hue}12` }}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-[11.5px] text-mist mt-0.5">{def.role}</p>
        <p className="text-[11px] text-fog mt-0.5">{agent.statusText}</p>
      </div>

      {/* tabs */}
      <div className="flex px-2 border-b border-line-soft shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => select(selected, t.id)}
            className={cx(
              "flex items-center gap-1.5 px-3 py-2 text-[11.5px] font-medium border-b-2 -mb-px transition-colors",
              tab === t.id ? "text-paper" : "text-fog hover:text-mist border-transparent",
            )}
            style={tab === t.id ? { borderColor: def.hue } : undefined}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "terminal" && (
        <div className="flex-1 min-h-0 flex flex-col p-3">
          <Terminal agent={agent} />
        </div>
      )}
      {tab === "queue" && <QueueTab id={selected} />}
      {tab === "memory" && <MemoryTab id={selected} />}
    </aside>
  );
}
