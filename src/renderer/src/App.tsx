import { useCallback, useEffect, useRef, useState } from "react";
import { Controls } from "./components/Controls";
import { History } from "./components/History";
import { SessionLog } from "./components/SessionLog";
import { Timer } from "./components/Timer";
import { useStore } from "./hooks/useStore";
import { useTimer } from "./hooks/useTimer";
import type { View } from "./lib/types";

export function App() {
  const [view, setView] = useState<View>("timer");
  const timer = useTimer();
  const store = useStore();
  const sessionStartRef = useRef<Date | null>(null);

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
    },
    [timer, store],
  );

  const handleSkipLog = useCallback(() => {
    timer.onLogSaved();
    setView("timer");
  }, [timer]);

  // Transition to log view when timer enters logging state
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "TEXTAREA" || target.tagName === "INPUT";

      // Always handle Escape
      if (e.key === "Escape") {
        if (view === "log") {
          handleSkipLog();
        } else if (view === "history") {
          setView("timer");
        }
        return;
      }

      // Don't capture shortcuts when typing
      if (isTyping) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (timer.timerState === "idle") {
            timer.start();
          } else if (timer.timerState === "running" || timer.timerState === "overtime") {
            timer.pause();
          } else if (timer.timerState === "paused") {
            timer.resume();
          }
          break;
        case "e":
          if (timer.timerState === "running" || timer.timerState === "overtime") {
            timer.end();
          }
          break;
        case "r":
          if (timer.timerState === "paused") {
            timer.reset();
          }
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

  // Start break overlay when break starts
  useEffect(() => {
    if (timer.mode === "break" && timer.timerState === "running" && timer.config.fullScreenBreak) {
      window.api.startBreak(timer.config.breakDuration * 60);
    }
  }, [timer.mode, timer.timerState, timer.config.breakDuration, timer.config.fullScreenBreak]);

  return (
    <div className="h-screen flex flex-col">
      {/* Drag region / title bar spacer */}
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
