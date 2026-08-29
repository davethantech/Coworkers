import { useEffect, useState } from "react";
import { startEngine } from "./engine";
import { useOffice } from "./store";
import { TopBar } from "./components/TopBar";
import { Floor } from "./components/Floor";
import { Inspector } from "./components/Inspector";
import { ChatDock } from "./components/ChatDock";
import { ApprovalsDrawer } from "./components/ApprovalsDrawer";
import { SettingsModal } from "./components/SettingsModal";
import { Toasts } from "./components/Toasts";
import { IconLogo } from "./components/icons";
import { cx } from "./util";

function BootOverlay() {
  const memCount = useOffice((s) => s.memory.length);
  const [stage, setStage] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 350);
    const t2 = setTimeout(() => setStage(2), 900);
    const t3 = setTimeout(() => setStage(3), 1400);
    const t4 = setTimeout(() => setGone(true), 2250);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  const lines = ["waking the crew…", `restoring the ledger · ${memCount} memories…`, "the floor is warm."];

  return (
    <div
      className={cx(
        "fixed inset-0 z-[70] bg-ink-950 flex flex-col items-center justify-center gap-6 transition-opacity duration-700",
        gone && "opacity-0 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-3">
        <IconLogo size={34} className="text-brass" />
        <span className="font-display font-bold tracking-[0.3em] text-2xl">BULLPEN</span>
      </div>
      <div className="font-mono text-[11.5px] text-fog space-y-1.5 w-64">
        {lines.slice(0, stage).map((l, i) => (
          <div key={l} className={cx("flex items-center gap-2 animate-rise", i === 2 && "text-leaf")}>
            <span className="text-brass">❯</span> {l}
          </div>
        ))}
        {stage < 3 && <span className="inline-block w-[7px] h-[13px] bg-brass animate-blink" />}
      </div>
      <p className="text-[10px] text-fog/60 tracking-[0.2em] uppercase">local-first · your keys · five workers on payroll</p>
    </div>
  );
}

export default function App() {
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => startEngine(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("chat-input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-ink-900 text-paper overflow-hidden">
      <TopBar onOpenApprovals={() => setApprovalsOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 flex flex-col min-w-0">
          <Floor />
          <ChatDock />
        </main>
        <Inspector />
      </div>

      <ApprovalsDrawer open={approvalsOpen} onClose={() => setApprovalsOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toasts />
      <BootOverlay />
    </div>
  );
}
