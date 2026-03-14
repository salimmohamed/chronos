import { useCallback, useEffect, useRef, useState } from "react";
import { Controls } from "./components/Controls";
import { History } from "./components/History";
import { SessionLog } from "./components/SessionLog";
import { Timer } from "./components/Timer";
import { useStore } from "./hooks/useStore";
import { useTimer } from "./hooks/useTimer";
import type { View } from "./lib/types";

const isOverlay = new URLSearchParams(window.location.search).get("overlay") === "true";

function OverlayApp() {
  const [phase, setPhase] = useState<"break-idle" | "break-running">("break-idle");
  const [breakRemaining, setBreakRemaining] = useState(5 * 60);
  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startBreak = useCallback(() => {
    setPhase("break-running");
    breakIntervalRef.current = setInterval(() => {
      setBreakRemaining((prev) => {
        if (prev <= 1) {
          if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
          breakIntervalRef.current = null;
          window.api.notify("Chronos", "Break over. Ready to focus?");
          window.api.exitFullscreen();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const endBreakEarly = useCallback(() => {
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }
    window.api.exitFullscreen();
  }, []);

  useEffect(() => {
    return () => {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase === "break-idle") {
        if (e.key === " ") {
          e.preventDefault();
          startBreak();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          endBreakEarly();
        }
      }
      if (phase === "break-running") {
        if (e.key === "Escape") {
          e.preventDefault();
          endBreakEarly();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [phase, startBreak, endBreakEarly]);

  const breakProgress = phase === "break-running" ? 1 - breakRemaining / (5 * 60) : 0;

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg select-none">
      {/* Subtle grain */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      {phase === "break-idle" && (
        <>
          <div className="text-xs tracking-[0.4em] uppercase text-text-muted mb-8 font-medium">
            break time
          </div>
          <div className="text-8xl font-bold tracking-tight tabular-nums text-text mb-8">
            {formatTime(breakRemaining)}
          </div>
          <button
            type="button"
            onClick={startBreak}
            className="px-8 py-3 bg-accent text-bg text-sm font-medium tracking-wide hover:opacity-90 transition-opacity mb-4"
          >
            start break
          </button>
          <div className="text-xs text-text-muted opacity-30 tracking-wide">
            space to start {"\u00b7"} esc to dismiss
          </div>
        </>
      )}

      {phase === "break-running" && (
        <>
          <div className="text-xs tracking-[0.4em] uppercase text-text-muted mb-8 font-medium">
            take a break
          </div>
          <div className="text-8xl font-bold tracking-tight tabular-nums text-text mb-8">
            {formatTime(breakRemaining)}
          </div>
          <div className="relative w-32 h-32 mb-10">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 120 120"
              role="img"
              aria-label="Break progress"
            >
              <circle cx="60" cy="60" r="54" fill="none" stroke="#262626" strokeWidth="3" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - breakProgress)}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
          </div>
          <button
            type="button"
            onClick={endBreakEarly}
            className="px-6 py-2 border border-border text-text-muted text-xs tracking-wide hover:border-text-muted transition-colors"
          >
            end break early
          </button>
        </>
      )}
    </div>
  );
}

function MainApp() {
  const [view, setView] = useState<View>("timer");
  const timer = useTimer();
  const store = useStore();
  const sessionStartRef = useRef<Date | null>(null);

  // When timer enters "logging" state, show the session log
  useEffect(() => {
    if (timer.timerState === "logging") {
      setView("log");
    }
  }, [timer.timerState]);

  // Track session start time
  useEffect(() => {
    if (timer.timerState === "running" && !sessionStartRef.current) {
      sessionStartRef.current = new Date();
    }
    if (timer.timerState === "idle") {
      sessionStartRef.current = null;
    }
  }, [timer.timerState]);

  const handleSaveLog = useCallback(
    async (note: string) => {
      const now = new Date();
      const targetSeconds =
        timer.mode === "focus" ? timer.config.focusDuration * 60 : timer.config.breakDuration * 60;
      const actualSeconds = targetSeconds + timer.overtimeElapsed;

      await store.saveSession({
        id: crypto.randomUUID(),
        startedAt: sessionStartRef.current?.toISOString() ?? now.toISOString(),
        endedAt: now.toISOString(),
        targetDuration: targetSeconds,
        actualDuration: actualSeconds,
        mode: timer.mode,
        note,
        completed: true,
      });

      timer.onLogSaved();
      setView("timer");
      // Open the overlay for break
      window.api.enterFullscreen();
    },
    [timer, store],
  );

  const handleSkipLog = useCallback(() => {
    timer.onLogSaved();
    setView("timer");
    // Open the overlay for break
    window.api.enterFullscreen();
  }, [timer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "TEXTAREA" || target.tagName === "INPUT";

      if (view === "log") {
        if (e.key === "Escape" && !isTyping) {
          e.preventDefault();
          handleSkipLog();
        }
        return;
      }

      if (e.key === "Escape") {
        if (view === "history") setView("timer");
        return;
      }

      if (isTyping) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (timer.timerState === "idle") timer.start();
          else if (timer.timerState === "running" || timer.timerState === "overtime") timer.pause();
          else if (timer.timerState === "paused") timer.resume();
          break;
        case "e":
          if (timer.timerState === "running" || timer.timerState === "overtime") timer.end();
          break;
        case "r":
          if (timer.timerState === "paused") timer.reset();
          break;
        case "s":
          timer.skip();
          break;
        case "h":
          setView(view === "history" ? "timer" : "history");
          break;
        case "1":
          if (timer.timerState === "idle") timer.setTarget(25);
          break;
        case "2":
          if (timer.timerState === "idle") timer.setTarget(50);
          break;
        case "3":
          if (timer.timerState === "idle") timer.setTarget(90);
          break;
        case "q":
          window.close();
          break;
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [view, timer, handleSkipLog]);

  return (
    <div className="h-screen flex flex-col">
      <div className="h-8 shrink-0" />

      {view === "timer" && (
        <Timer
          displayTime={timer.displayTime}
          mode={timer.mode}
          timerState={timer.timerState}
          progress={timer.progress}
          isOvertime={timer.isOvertime}
          config={timer.config}
        />
      )}

      {view === "log" && (
        <SessionLog
          mode={timer.mode}
          targetDuration={
            timer.mode === "focus"
              ? timer.config.focusDuration * 60
              : timer.config.breakDuration * 60
          }
          actualDuration={
            (timer.mode === "focus"
              ? timer.config.focusDuration * 60
              : timer.config.breakDuration * 60) + timer.overtimeElapsed
          }
          onSave={handleSaveLog}
          onSkip={handleSkipLog}
        />
      )}

      {view === "history" && (
        <History
          sessions={store.sessions}
          onDelete={store.deleteSession}
          onBack={() => setView("timer")}
        />
      )}

      <Controls timerState={timer.timerState} view={view} />
    </div>
  );
}

export function App() {
  if (isOverlay) return <OverlayApp />;
  return <MainApp />;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
