import { useEffect, useRef, useState } from "react";
import type { AgentState, LineKind } from "../types";
import { AGENT_DEFS } from "../data/scripts";

const KIND_CLASS: Record<LineKind, string> = {
  cmd: "text-paper",
  out: "text-mist",
  ok: "text-leaf",
  warn: "text-brass",
  err: "text-coral",
  sys: "text-fog italic",
  msg: "text-pool",
  mem: "text-lime",
};

const KIND_PREFIX: Partial<Record<LineKind, string>> = {
  cmd: "❯",
  ok: "✓",
  warn: "▲",
  err: "✕",
};

export function Terminal({ agent }: { agent: AgentState }) {
  const def = AGENT_DEFS[agent.id];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);
  const lineCount = agent.lines.length;
  const streamLen = agent.stream?.text.length ?? 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick) el.scrollTop = el.scrollHeight;
  }, [lineCount, streamLen, stick]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-ink-950/60 border border-line-soft rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 h-8 shrink-0 border-b border-line-soft bg-ink-900/80">
        <span className="w-2 h-2 rounded-full" style={{ background: def.hue, boxShadow: `0 0 6px ${def.hue}` }} />
        <span className="font-mono text-[11px] text-fog truncate">
          {agent.id}@bullpen:~/acme-billing
        </span>
        <span className="ml-auto font-mono text-[10px] text-fog/70 uppercase tracking-wider">
          {agent.status === "working" ? "live" : agent.status === "blocked" ? "held" : "tty"}
        </span>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-[11.5px] leading-[1.65]">
        {agent.lines.length === 0 && !agent.stream && (
          <div className="h-full flex items-center justify-center text-fog/70 text-[11px]">— quiet shift so far —</div>
        )}
        {agent.lines.map((l) => (
          <div key={l.id} className={`whitespace-pre-wrap break-words ${KIND_CLASS[l.kind]}`}>
            {KIND_PREFIX[l.kind] && (
              <span className="inline-block w-4 text-[10px] opacity-80">{KIND_PREFIX[l.kind]}</span>
            )}
            {l.kind === "cmd" ? <span className="font-medium">{l.text}</span> : l.text}
          </div>
        ))}
        {agent.stream && (
          <div className={`whitespace-pre-wrap break-words ${KIND_CLASS[agent.stream.kind]}`}>
            {agent.stream.text}
            <span className="inline-block w-[7px] h-[13px] align-[-2px] ml-0.5 animate-blink" style={{ background: def.hue }} />
          </div>
        )}
        {!agent.stream && agent.status === "working" && (
          <div className="text-fog">
            <span className="inline-block w-[7px] h-[13px] align-[-2px] animate-blink" style={{ background: def.hue, opacity: 0.7 }} />
          </div>
        )}
      </div>

      {!stick && (
        <button
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollTop = el.scrollHeight;
            setStick(true);
          }}
          className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-ink-750 border border-line text-[10px] font-mono text-mist hover:text-paper transition-colors animate-pop"
        >
          ↓ latest
        </button>
      )}
    </div>
  );
}
