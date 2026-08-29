import { useEffect } from "react";
import { useOffice } from "../store";
import type { Toast } from "../types";
import { IconCheck, IconRadio, IconWarn, IconX } from "./icons";

const STYLE: Record<Toast["kind"], { cls: string; icon: React.ReactNode }> = {
  ok: { cls: "border-leaf/40 text-leaf", icon: <IconCheck size={14} /> },
  warn: { cls: "border-brass/40 text-brass", icon: <IconWarn size={14} /> },
  err: { cls: "border-coral/40 text-coral", icon: <IconX size={14} /> },
  info: { cls: "border-pool/40 text-pool", icon: <IconRadio size={14} /> },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useOffice((s) => s.dismissToast);
  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), 4600);
    return () => clearTimeout(t);
  }, [toast.id, dismiss]);

  const s = STYLE[toast.kind];
  return (
    <button
      onClick={() => dismiss(toast.id)}
      className={`flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-lg border bg-ink-800/95 shadow-xl shadow-ink-950/60 animate-rise text-left max-w-[360px] ${s.cls}`}
    >
      <span className="shrink-0">{s.icon}</span>
      <span className="text-[12px] text-paper/90 leading-snug">{toast.text}</span>
    </button>
  );
}

export function Toasts() {
  const toasts = useOffice((s) => s.toasts);
  return (
    <div className="fixed bottom-4 right-[406px] z-[60] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
