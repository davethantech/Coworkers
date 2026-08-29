import { useEffect, useState } from "react";
import { useOffice } from "../store";
import { testConnection } from "../llm";
import type { Settings } from "../types";
import { cx } from "../util";
import { IconCheck, IconEye, IconEyeOff, IconKey, IconRadio, IconTrash, IconWarn, IconX } from "./icons";

const PRESETS: { name: string; baseUrl: string; model: string; hint: string }[] = [
  { name: "OpenAI", baseUrl: "https://api.openai.com", model: "gpt-4o-mini", hint: "your OpenAI key" },
  { name: "OpenRouter", baseUrl: "https://openrouter.ai/api", model: "openai/gpt-4o-mini", hint: "one key, many models" },
  { name: "Ollama", baseUrl: "http://localhost:11434", model: "llama3.1", hint: "local, no key needed" },
  { name: "LM Studio", baseUrl: "http://localhost:1234", model: "local-model", hint: "local server" },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cx("relative w-9 h-5 rounded-full border transition-colors", on ? "bg-leaf/30 border-leaf/60" : "bg-ink-750 border-line")}
      role="switch"
      aria-checked={on}
    >
      <span
        className={cx("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-all", on ? "left-[18px] bg-leaf" : "left-[3px] bg-fog")}
      />
    </button>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useOffice((s) => s.settings);
  const setSettings = useOffice((s) => s.setSettings);
  const pushToast = useOffice((s) => s.pushToast);
  const [draft, setDraft] = useState<Settings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; detail: string } | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setTestResult(null);
      setConfirmWipe(false);
    }
  }, [open, settings]);

  if (!open) return null;

  const patch = (p: Partial<Settings>) => setDraft((d) => ({ ...d, ...p }));
  const inputCls =
    "w-full h-9 px-3 rounded-md bg-ink-950/70 border border-line-soft text-[12.5px] outline-none focus:border-line transition-colors placeholder:text-fog/60";

  const save = () => {
    setSettings(draft);
    pushToast("ok", "Settings saved — they persist in this browser");
    onClose();
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const r = await testConnection(draft);
    setTestResult(r);
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-[580px] max-w-full max-h-[88vh] overflow-y-auto rounded-xl border border-line bg-ink-850 shadow-2xl shadow-ink-950 animate-modal">
        <div className="flex items-center gap-2 px-5 h-13 py-3.5 border-b border-line-soft sticky top-0 bg-ink-850 z-10">
          <h2 className="font-display font-bold text-[14px] tracking-[0.12em] uppercase">Office settings</h2>
          <button onClick={onClose} className="ml-auto text-fog hover:text-paper transition-colors">
            <IconX size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* the office */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-fog mb-2.5">The office</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] text-mist block mb-1">Office name</span>
                <input className={inputCls} value={draft.officeName} onChange={(e) => patch({ officeName: e.target.value })} />
              </label>
              <div>
                <span className="text-[11px] text-mist block mb-1">Floor speed</span>
                <div className="flex rounded-md border border-line-soft overflow-hidden h-9">
                  {[0.5, 1, 2].map((sp) => (
                    <button
                      key={sp}
                      onClick={() => patch({ speed: sp })}
                      className={cx(
                        "flex-1 text-[12px] font-medium font-display transition-colors",
                        draft.speed === sp ? "bg-brass/15 text-brass" : "bg-ink-950/50 text-fog hover:text-mist",
                      )}
                    >
                      {sp === 0.5 ? "½×" : `${sp}×`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-mist">Auto-approve spending under</span>
                <span className="font-display font-bold text-[12px] text-brass">
                  {draft.autoApproveBelow === 0 ? "always ask me" : `$${draft.autoApproveBelow}`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={draft.autoApproveBelow}
                onChange={(e) => patch({ autoApproveBelow: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-[10px] text-fog mt-1">Deletes and prod changes always ask, no matter what. This only applies to small spends.</p>
            </div>
          </section>

          {/* model */}
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-fog mb-2.5 flex items-center gap-2">
              <IconKey size={13} /> Brain supply — your keys, your models
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    patch({ baseUrl: p.baseUrl, model: p.model, liveRouting: true });
                    setTestResult(null);
                  }}
                  className="px-2.5 py-1 rounded-full border border-line-soft bg-ink-900 text-[11px] text-mist hover:text-paper hover:border-line transition-colors"
                  title={p.hint}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="space-y-2.5">
              <input className={inputCls} placeholder="Base URL — e.g. http://localhost:11434 (Ollama) or https://api.openai.com" value={draft.baseUrl} onChange={(e) => { patch({ baseUrl: e.target.value }); setTestResult(null); }} />
              <div className="grid grid-cols-[1fr_150px] gap-2.5">
                <div className="relative">
                  <input
                    className={cx(inputCls, "pr-9")}
                    type={showKey ? "text" : "password"}
                    placeholder="API key (blank is fine for local servers)"
                    value={draft.apiKey}
                    onChange={(e) => { patch({ apiKey: e.target.value }); setTestResult(null); }}
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fog hover:text-paper transition-colors">
                    {showKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                  </button>
                </div>
                <input className={inputCls} placeholder="Model name" value={draft.model} onChange={(e) => { patch({ model: e.target.value }); setTestResult(null); }} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Toggle on={draft.liveRouting} onChange={(v) => patch({ liveRouting: v })} />
              <span className="text-[12px] text-mist flex items-center gap-1.5">
                <IconRadio size={13} className={draft.liveRouting ? "text-leaf" : "text-fog"} />
                Route tickets with the live model
              </span>
              <button
                onClick={runTest}
                disabled={testing || !draft.baseUrl.trim()}
                className="ml-auto h-8 px-3 rounded-md border border-line-soft bg-ink-800 text-[11.5px] text-mist hover:text-paper hover:border-line transition-colors disabled:opacity-40"
              >
                {testing ? "Pinging…" : "Test connection"}
              </button>
            </div>
            {testResult && (
              <p className={cx("text-[11px] mt-2 flex items-center gap-1.5 animate-rise", testResult.ok ? "text-leaf" : "text-coral")}>
                {testResult.ok ? <IconCheck size={12} /> : <IconWarn size={12} />} {testResult.detail}
              </p>
            )}
            <p className="text-[10px] text-fog mt-2 leading-relaxed">
              Anything OpenAI-compatible works — OpenAI, OpenRouter, Ollama, LM Studio, vLLM. Keys never leave this machine; settings live in localStorage.
              Without a model, Moss routes with the built-in house brain.
            </p>
          </section>

          {/* danger */}
          <section className="rounded-lg border border-coral/25 bg-coral/[0.04] p-3.5">
            <h3 className="text-[10px] uppercase tracking-[0.18em] text-coral/80 mb-1.5">Danger corner</h3>
            {!confirmWipe ? (
              <button
                onClick={() => setConfirmWipe(true)}
                className="flex items-center gap-1.5 text-[11.5px] text-mist hover:text-coral transition-colors"
              >
                <IconTrash size={13} /> Reset the office — wipes memory, chat and settings
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-rise">
                <span className="text-[11.5px] text-coral">Sure? The ledger, chat and settings are gone for good.</span>
                <button
                  onClick={() => {
                    localStorage.removeItem("bullpen.v1");
                    location.reload();
                  }}
                  className="ml-auto h-7 px-2.5 rounded-md bg-coral text-ink-950 text-[11px] font-bold font-display hover:brightness-110 transition-all"
                >
                  Wipe it
                </button>
                <button onClick={() => setConfirmWipe(false)} className="h-7 px-2.5 rounded-md border border-line text-[11px] text-mist hover:text-paper transition-colors">
                  Keep
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line-soft sticky bottom-0 bg-ink-850">
          <button onClick={onClose} className="h-9 px-4 rounded-md border border-line text-[12.5px] text-mist hover:text-paper transition-colors">
            Cancel
          </button>
          <button onClick={save} className="h-9 px-5 rounded-md bg-brass text-ink-950 text-[12.5px] font-semibold font-display tracking-wide hover:brightness-110 active:scale-[0.98] transition-all">
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
