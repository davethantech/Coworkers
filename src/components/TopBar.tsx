import { useEffect, useState } from "react";
import { useOffice } from "../store";
import { clock } from "../util";
import { IconGear, IconLogo, IconPause, IconPlay, IconShield, IconZap } from "./icons";

export function TopBar({ onOpenApprovals, onOpenSettings }: { onOpenApprovals: () => void; onOpenSettings: () => void }) {
  const settings = useOffice((s) => s.settings);
  const setSettings = useOffice((s) => s.setSettings);
  const stats = useOffice((s) => s.stats);
  const pending = useOffice((s) => s.approvals.filter((a) => a.status === "pending").length);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const day = 1 + Math.floor((Date.now() - stats.firstBootTs) / 86_400_000);

  return (
    <header className="h-12 shrink-0 flex items-center gap-3 px-3 border-b border-line bg-ink-850/90 relative z-20">
      {/* faux window controls */}
      <div className="flex items-center gap-1.5 pr-1">
        <span className="w-3 h-3 rounded-full bg-coral/80 hover:bg-coral transition-colors" />
        <span className="w-3 h-3 rounded-full bg-brass/80 hover:bg-brass transition-colors" />
        <span className="w-3 h-3 rounded-full bg-leaf/80 hover:bg-leaf transition-colors" />
      </div>

      <div className="flex items-center gap-2 pl-1">
        <IconLogo size={20} className="text-brass" />
        <span className="font-display font-bold tracking-[0.22em] text-[13px]">BULLPEN</span>
        <span className="text-[11px] text-fog hidden md:inline">· {settings.officeName}</span>
      </div>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-mist bg-ink-800 border border-line-soft rounded-full px-2.5 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-breathe" />
        Day {day} · local-first
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-mist bg-ink-800 border border-line-soft rounded-full px-2.5 py-1">
        <IconZap size={12} className="text-brass" />
        {stats.tasksDone} shipped
      </div>

      <button
        onClick={onOpenApprovals}
        className="relative flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-line-soft bg-ink-800 text-mist hover:text-paper hover:border-line transition-colors"
        title="Signatures needed"
      >
        <IconShield size={15} />
        {pending > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-coral text-ink-950 text-[10px] font-bold font-display flex items-center justify-center animate-breathe">
            {pending}
          </span>
        )}
      </button>

      <button
        onClick={() => setSettings({ paused: !settings.paused })}
        className={`flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${
          settings.paused
            ? "border-brass/50 text-brass bg-brass/10 hover:bg-brass/20"
            : "border-line-soft bg-ink-800 text-mist hover:text-paper hover:border-line"
        }`}
        title={settings.paused ? "Resume the floor" : "Pause the floor"}
      >
        {settings.paused ? <IconPlay size={14} /> : <IconPause size={14} />}
      </button>

      <button
        onClick={onOpenSettings}
        className="flex items-center justify-center w-8 h-8 rounded-md border border-line-soft bg-ink-800 text-mist hover:text-paper hover:border-line transition-colors"
        title="Office settings"
      >
        <IconGear size={15} />
      </button>

      <span className="font-mono text-[11px] text-fog tabular-nums pl-1 hidden lg:inline">{clock(now)}</span>
    </header>
  );
}
