import { useOffice } from "../store";
import { resolveApproval } from "../engine";
import { AGENT_DEFS } from "../data/scripts";
import type { ApprovalKind } from "../types";
import { timeAgo } from "../util";
import { IconCheck, IconShield, IconTrash, IconWarn, IconX, IconZap } from "./icons";

const KIND_META: Record<ApprovalKind, { label: string; color: string; icon: React.ReactNode }> = {
  spend: { label: "spends money", color: "#f2b44c", icon: <IconZap size={15} /> },
  delete: { label: "deletes data", color: "#f0796b", icon: <IconTrash size={15} /> },
  major: { label: "big change", color: "#5ec8de", icon: <IconWarn size={15} /> },
};

export function ApprovalsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const approvals = useOffice((s) => s.approvals);
  if (!open) return null;

  const pending = approvals.filter((a) => a.status === "pending");
  const history = approvals.filter((a) => a.status !== "pending").slice(0, 10);

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[400px] max-w-[92vw] bg-ink-850 border-l border-line flex flex-col animate-drawer shadow-2xl shadow-ink-950">
        <div className="flex items-center gap-2 px-4 h-12 shrink-0 border-b border-line-soft">
          <IconShield size={17} className="text-coral" />
          <span className="font-display font-bold text-[13px] tracking-[0.14em] uppercase">Signatures</span>
          {pending.length > 0 && (
            <span className="px-1.5 py-px rounded-full bg-coral text-ink-950 text-[10px] font-bold font-display">{pending.length}</span>
          )}
          <button onClick={onClose} className="ml-auto text-fog hover:text-paper transition-colors">
            <IconX size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-fog mb-2">waiting on you</h3>
            {pending.length === 0 && (
              <div className="rounded-lg border border-line-soft bg-ink-900/60 py-8 flex flex-col items-center gap-2 text-center">
                <IconShield size={26} className="text-leaf/70" />
                <p className="text-[12.5px] text-mist">All clear on the floor.</p>
                <p className="text-[10.5px] text-fog px-6">When an agent wants to spend money, delete something, or make a big change, it lands here first.</p>
              </div>
            )}
            <div className="space-y-2.5">
              {pending.map((a) => {
                const meta = KIND_META[a.kind];
                const agent = AGENT_DEFS[a.agentId];
                return (
                  <div key={a.id} className="rounded-lg border bg-ink-900/70 p-3 animate-rise" style={{ borderColor: `${meta.color}44` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span className="text-[9.5px] font-display font-semibold uppercase tracking-[0.14em]" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="ml-auto text-[10px] text-fog">{timeAgo(a.ts)}</span>
                    </div>
                    <p className="text-[13px] font-medium mt-1.5 leading-snug">{a.title}</p>
                    <p className="text-[11.5px] text-mist mt-1 leading-relaxed">{a.detail}</p>
                    <p className="text-[10.5px] text-fog mt-1.5 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center font-display font-bold text-[7px]" style={{ borderColor: agent.hue, color: agent.hue }}>
                        {agent.initials}
                      </span>
                      {agent.name} is holding position until you decide
                      {a.amount != null && <span className="ml-auto font-display font-bold text-[13px]" style={{ color: meta.color }}>${a.amount}</span>}
                    </p>
                    <div className="flex gap-2 mt-2.5">
                      <button
                        onClick={() => resolveApproval(a.id, "approved")}
                        className="flex-1 h-8 rounded-md bg-leaf/15 border border-leaf/40 text-leaf text-[12px] font-semibold font-display tracking-wide hover:bg-leaf/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                      >
                        <IconCheck size={13} /> Approve
                      </button>
                      <button
                        onClick={() => resolveApproval(a.id, "denied")}
                        className="flex-1 h-8 rounded-md bg-coral/8 border border-coral/35 text-coral text-[12px] font-semibold font-display tracking-wide hover:bg-coral/18 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                      >
                        <IconX size={13} /> Deny
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {history.length > 0 && (
            <section>
              <h3 className="text-[10px] uppercase tracking-[0.18em] text-fog mb-2">decided</h3>
              <div className="space-y-1.5">
                {history.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-md border border-line-soft bg-ink-900/40 px-3 py-2">
                    <span className={a.status === "approved" ? "text-leaf" : "text-coral"}>
                      {a.status === "approved" ? <IconCheck size={13} /> : <IconX size={13} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11.5px] text-paper/85 truncate">{a.title}</p>
                      <p className="text-[9.5px] text-fog">
                        {AGENT_DEFS[a.agentId].name} · {a.status} {a.resolvedTs ? `· ${timeAgo(a.resolvedTs)}` : ""}
                      </p>
                    </div>
                    {a.amount != null && <span className="ml-auto text-[11px] font-mono text-fog">${a.amount}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
