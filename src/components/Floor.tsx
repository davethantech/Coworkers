import { useEffect, useRef, useState } from "react";
import { useOffice } from "../store";
import { AGENT_DEFS, AGENT_ORDER, SPOTS } from "../data/scripts";
import type { AgentId, AgentState, Packet } from "../types";
import { cx } from "../util";

const ZONES = [
  { label: "WAR ROOM", x: 4, y: 7, w: 28, h: 33 },
  { label: "BUILD BAY", x: 47, y: 6, w: 49, h: 52 },
  { label: "READING CORNER", x: 31, y: 49, w: 33, h: 44 },
  { label: "OPS CORNER", x: 3, y: 45, w: 27, h: 48 },
  { label: "BREAK", x: 70, y: 60, w: 27, h: 34 },
];

const STATUS_COLOR: Record<AgentState["status"], string> = {
  idle: "#64789c",
  working: "",
  thinking: "#f2b44c",
  blocked: "#f0796b",
  away: "#8ca1c0",
};

function Desk({ id, active }: { id: AgentId; active: boolean }) {
  const def = AGENT_DEFS[id];
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 w-[88px] select-none pointer-events-none"
      style={{ left: `${def.desk.x}%`, top: `${def.desk.y}%` }}
    >
      <div className="relative h-9 w-16 mx-auto rounded-t-md bg-ink-800 border border-line overflow-hidden">
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: active ? 0.9 : 0.18,
            background: `linear-gradient(180deg, ${def.hue}33, ${def.hue}0d 70%, transparent)`,
          }}
        />
        {active && (
          <div className="absolute inset-x-1.5 top-1.5 space-y-1">
            <div className="h-[3px] rounded-sm opacity-70" style={{ background: def.hue, width: "70%" }} />
            <div className="h-[3px] rounded-sm opacity-45" style={{ background: def.hue, width: "45%" }} />
            <div className="h-[3px] rounded-sm opacity-30 animate-pulse-soft" style={{ background: def.hue, width: "58%" }} />
          </div>
        )}
      </div>
      <div className="w-2 h-1.5 mx-auto bg-line" />
      <div className="relative h-2.5 rounded-[3px] bg-ink-750 border border-line">
        <span
          className={cx("absolute -top-1 -right-1 w-2 h-2 rounded-full border border-ink-900", active && "animate-breathe")}
          style={{ background: active ? def.hue : "#3a4d73" }}
        />
      </div>
      <div className="mt-1 text-center text-[9px] font-medium uppercase tracking-[0.14em] text-fog/80">
        {def.name}
      </div>
    </div>
  );
}

function PacketFly({ packet }: { packet: Packet }) {
  const fromAgent = useOffice((s) => s.agents[packet.from]);
  const toAgent = useOffice((s) => s.agents[packet.to]);
  const hue = AGENT_DEFS[packet.from].hue;
  const start = useRef({ ...fromAgent.pos });
  const [pos, setPos] = useState(start.current);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = 1150;
    const loop = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const to = useOffice.getState().agents[packet.to].pos;
      setPos({
        x: start.current.x + (to.x - start.current.x) * e,
        y: start.current.y + (to.y - start.current.y) * e,
      });
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [packet.to, packet.id]);

  return (
    <div
      className="absolute w-2 h-2 rounded-full pointer-events-none z-20"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%,-50%)",
        background: hue,
        boxShadow: `0 0 10px ${hue}, 0 0 22px ${hue}66`,
        opacity: toAgent ? 1 : 0,
      }}
    />
  );
}

function Sprite({ agent }: { agent: AgentState }) {
  const def = AGENT_DEFS[agent.id];
  const selected = useOffice((s) => s.selected);
  const select = useOffice((s) => s.select);
  const isSel = selected === agent.id;
  const active = agent.status === "working" || agent.status === "thinking";
  const dotColor = agent.status === "working" ? def.hue : STATUS_COLOR[agent.status];
  const freshBubble = agent.bubble && Date.now() - agent.bubble.ts < 5200;

  return (
    <button
      onClick={() => select(agent.id, "terminal")}
      className="absolute z-30 -translate-x-1/2 -translate-y-1/2 group outline-none"
      style={{
        left: `${agent.pos.x}%`,
        top: `${agent.pos.y}%`,
        transition: "left 2s cubic-bezier(.45,.05,.25,1), top 2s cubic-bezier(.45,.05,.25,1)",
      }}
      title={`${def.name} — ${def.role} · ${agent.statusText}`}
    >
      {freshBubble && agent.bubble && (
        <div
          key={agent.bubble.ts}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-max max-w-[190px] px-2 py-1 rounded-md bg-ink-800 border border-line text-[10.5px] leading-snug text-paper/90 shadow-xl shadow-ink-950/50 animate-pop pointer-events-none"
        >
          {agent.bubble.text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full -mt-[3px] w-1.5 h-1.5 rotate-45 bg-ink-800 border-r border-b border-line" />
        </div>
      )}

      <span className="relative block w-8 h-8 transition-transform duration-200 group-hover:scale-110">
        {active && (
          <svg className="absolute -inset-[5px] animate-spin-slow" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18.5" stroke={def.hue} strokeOpacity="0.55" strokeWidth="1.4" strokeDasharray="4 7" />
          </svg>
        )}
        <span
          className="absolute inset-0 rounded-full bg-ink-850 border-2 flex items-center justify-center font-display font-bold text-[10px]"
          style={{
            borderColor: def.hue,
            color: def.hue,
            boxShadow: isSel ? `0 0 0 3px ${def.hue}44, 0 0 20px ${def.hue}55` : `0 2px 8px rgba(0,0,0,.4)`,
          }}
        >
          {def.initials}
        </span>
        <span
          className={cx(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-ink-900",
            (agent.status === "blocked" || agent.status === "thinking") && "animate-pulse-soft",
          )}
          style={{ background: dotColor }}
        />
      </span>

      <span
        className={cx(
          "mt-1 block text-center text-[10px] font-medium whitespace-nowrap transition-colors",
          isSel ? "text-paper" : "text-mist group-hover:text-paper",
        )}
      >
        {def.name}
      </span>
    </button>
  );
}

function CoffeeMachine() {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
      style={{ left: `${SPOTS.coffee.x + 5}%`, top: `${SPOTS.coffee.y - 1}%` }}
    >
      <div className="relative w-11 h-14 rounded-md bg-ink-750 border border-line">
        <div className="absolute top-1.5 inset-x-1.5 h-2 rounded-sm bg-ink-900/80" />
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-b-sm bg-ink-900 border border-line" />
        <span className="absolute -top-3 left-2 w-1 h-2.5 rounded-full bg-mist/40 animate-steam" />
        <span className="absolute -top-3 left-5 w-1 h-2.5 rounded-full bg-mist/30 animate-steam" style={{ animationDelay: "1.2s" }} />
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brass animate-breathe" />
      </div>
      <div className="mt-1 text-center text-[9px] uppercase tracking-[0.14em] text-fog/70">coffee</div>
    </div>
  );
}

export function Floor() {
  const agents = useOffice((s) => s.agents);
  const packets = useOffice((s) => s.packets);
  const paused = useOffice((s) => s.settings.paused);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden bg-ink-900">
      {/* ambient layers */}
      <div className="absolute inset-0 floor-grid" />
      <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(242,180,76,0.05)" }} />
      <div className="absolute -bottom-32 -right-16 w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(94,200,222,0.05)" }} />

      {/* zones */}
      {ZONES.map((z) => (
        <div
          key={z.label}
          className="absolute zone-dash rounded-xl pointer-events-none"
          style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
        >
          <span className="absolute top-2 left-3 text-[9px] font-display font-semibold tracking-[0.22em] text-fog/60">
            {z.label}
          </span>
        </div>
      ))}

      {/* war-room table */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 w-28 h-14 rounded-[50%] border border-line bg-ink-800/70 pointer-events-none"
        style={{ left: `${SPOTS.war.x}%`, top: `${SPOTS.war.y + 4}%` }}
      >
        <span className="absolute -left-1.5 top-1/2 w-2 h-2 -translate-y-1/2 rounded-full bg-ink-750 border border-line" />
        <span className="absolute -right-1.5 top-1/2 w-2 h-2 -translate-y-1/2 rounded-full bg-ink-750 border border-line" />
        <span className="absolute left-1/2 -top-1.5 w-2 h-2 -translate-x-1/2 rounded-full bg-ink-750 border border-line" />
      </div>

      <CoffeeMachine />

      {AGENT_ORDER.map((id) => (
        <Desk key={id} id={id} active={agents[id].status === "working" || agents[id].status === "thinking" || agents[id].status === "blocked"} />
      ))}

      {packets.map((p) => (
        <PacketFly key={p.id} packet={p} />
      ))}

      {AGENT_ORDER.map((id) => (
        <Sprite key={id} agent={agents[id]} />
      ))}

      {/* vignette on top of everything */}
      <div className="absolute inset-0 floor-vignette pointer-events-none" />

      {/* floor label + legend */}
      <div className="absolute top-3 left-4 pointer-events-none">
        <div className="font-display text-[10px] font-semibold tracking-[0.3em] text-fog/70">THE FLOOR</div>
        <div className="text-[10px] text-fog/50 mt-0.5">click a worker to open their terminal</div>
      </div>

      <div className="absolute bottom-2.5 left-4 flex items-center gap-3 text-[9.5px] text-fog/80 pointer-events-none">
        {[
          ["working", "#5ec8de"],
          ["thinking", "#f2b44c"],
          ["needs signature", "#f0796b"],
          ["idle / away", "#64789c"],
        ].map(([label, c]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
            {label}
          </span>
        ))}
      </div>

      {paused && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-brass/10 border border-brass/40 text-brass text-[11px] font-medium animate-pop z-40">
          Floor paused — hit play in the top bar when you're back
        </div>
      )}
    </div>
  );
}
