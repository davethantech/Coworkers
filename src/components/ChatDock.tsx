import { useEffect, useRef, useState } from "react";
import { useOffice } from "../store";
import { sendUserMessage } from "../engine";
import { AGENT_DEFS } from "../data/scripts";
import { cx } from "../util";
import { IconChevron, IconSend } from "./icons";

const SUGGESTIONS = [
  "Ship the billing fix to prod",
  "Why is checkout.spec flaky?",
  "Write docs for the webhook API",
  "Remember: staging uses .env.staging",
];

export function ChatDock() {
  const chat = useOffice((s) => s.chat);
  const mossStatus = useOffice((s) => s.agents.moss.status);
  const select = useOffice((s) => s.select);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.length, mossStatus, open]);

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    sendUserMessage(t);
    setDraft("");
  };

  const thinking = mossStatus === "thinking";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-10 shrink-0 border-t border-line bg-ink-850 flex items-center px-4 gap-2 text-mist hover:text-paper transition-colors group"
      >
        <span className="w-4 h-4 rounded-full border border-brass flex items-center justify-center font-display font-bold text-[8px] text-brass">MO</span>
        <span className="text-[12px] font-medium">Foreman's desk — talk to Moss</span>
        <span className="ml-auto text-fog text-[10px]">{chat.length} messages</span>
        <IconChevron size={14} className="rotate-180 text-fog group-hover:text-paper transition-colors" />
      </button>
    );
  }

  return (
    <div className="h-[228px] shrink-0 border-t border-line bg-ink-850 flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 h-9 shrink-0 border-b border-line-soft">
        <span className="w-4 h-4 rounded-full border border-brass flex items-center justify-center font-display font-bold text-[8px] text-brass">MO</span>
        <span className="text-[11px] font-display font-semibold tracking-[0.14em] uppercase text-mist">Foreman's desk</span>
        <span className="text-[10.5px] text-fog hidden sm:inline">— tell Moss what needs doing; he routes the floor</span>
        <button onClick={() => setOpen(false)} className="ml-auto text-fog hover:text-paper transition-colors" title="Collapse">
          <IconChevron size={14} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-2.5 space-y-2.5">
        {chat.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendUserMessage(s)}
                className="px-2.5 py-1 rounded-full border border-line-soft bg-ink-800 text-[11px] text-mist hover:text-paper hover:border-brass/50 hover:bg-brass/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {chat.map((m) => (
          <div key={m.id} className={cx("flex animate-rise", m.from === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cx(
                "max-w-[82%] rounded-lg px-3 py-1.5 text-[12.5px] leading-relaxed",
                m.from === "user"
                  ? "bg-brass/12 border border-brass/25 text-paper"
                  : "bg-ink-800 border border-line-soft text-paper/90",
              )}
            >
              {m.from === "moss" && (
                <button
                  onClick={() => select("moss", "terminal")}
                  className="block text-[9px] font-display font-bold tracking-[0.14em] text-brass uppercase mb-0.5 hover:underline"
                >
                  Moss
                </button>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start animate-rise">
            <div className="bg-ink-800 border border-line-soft rounded-lg px-3 py-2.5 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-brass animate-typing" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-3 pt-1">
        <div className="flex gap-2">
          <input
            id="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask the office for something…  (⌘K to jump here)"
            className="flex-1 min-w-0 h-9 px-3 rounded-md bg-ink-950/70 border border-line-soft text-[12.5px] placeholder:text-fog/70 outline-none focus:border-brass/50 transition-colors"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="h-9 px-3.5 rounded-md bg-brass text-ink-950 flex items-center gap-1.5 text-[12px] font-semibold font-display tracking-wide hover:brightness-110 active:scale-95 transition-all disabled:opacity-35 disabled:pointer-events-none"
          >
            <IconSend size={14} />
            Send
          </button>
        </div>
        <p className="text-[9.5px] text-fog/70 mt-1.5">
          Moss routes tickets to {["rivet", "specs", "lumen", "cricket"].map((a) => AGENT_DEFS[a as keyof typeof AGENT_DEFS].name).join(", ")}. Spending, deleting, and prod touches always ask you first.
        </p>
      </div>
    </div>
  );
}
