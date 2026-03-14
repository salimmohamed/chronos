import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_CONFIG, type TimerConfig, type TimerMode, type TimerState } from "../lib/types";

function formatTime(seconds: number, overtime: boolean): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const display = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return overtime ? `+${display}` : display;
}

interface UseTimerReturn {
  timeRemaining: number;
  overtimeElapsed: number;
  timerState: TimerState;
  mode: TimerMode;
  config: TimerConfig;
  displayTime: string;
  progress: number;
  isOvertime: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
  reset: () => void;
  skip: () => void;
  setTarget: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  onLogSaved: () => void;
}

export function useTimer(): UseTimerReturn {
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG);
  const [timeRemaining, setTimeRemaining] = useState(config.focusDuration * 60);
  const [overtimeElapsed, setOvertimeElapsed] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [mode, setMode] = useState<TimerMode>("focus");
  const sessionStartRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastReminderRef = useRef(0);

  const isOvertime = timerState === "overtime";
  const targetSeconds = mode === "focus" ? config.focusDuration * 60 : config.breakDuration * 60;
  const progress = isOvertime ? 1 : 1 - timeRemaining / targetSeconds;

  const displayTime = isOvertime
    ? formatTime(overtimeElapsed, true)
    : formatTime(timeRemaining, false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    sessionStartRef.current = new Date();
    setTimerState("running");
    lastReminderRef.current = 0;
  }, []);

  const pause = useCallback(() => {
    setTimerState("paused");
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    setTimerState(isOvertime ? "overtime" : "running");
  }, [isOvertime]);

  const end = useCallback(() => {
    clearTimer();
    setTimerState("logging");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeRemaining(targetSeconds);
    setOvertimeElapsed(0);
    setTimerState("idle");
    lastReminderRef.current = 0;
    window.api.updateTray("chronos");
  }, [clearTimer, targetSeconds]);

  const skip = useCallback(() => {
    clearTimer();
    const nextMode = mode === "focus" ? "break" : "focus";
    setMode(nextMode);
    const nextDuration =
      nextMode === "focus" ? config.focusDuration * 60 : config.breakDuration * 60;
    setTimeRemaining(nextDuration);
    setOvertimeElapsed(0);
    setTimerState("idle");
    lastReminderRef.current = 0;
    window.api.updateTray("chronos");
  }, [clearTimer, mode, config]);

  const setTarget = useCallback(
    (minutes: number) => {
      if (timerState === "idle") {
        setConfig((prev) => ({ ...prev, focusDuration: minutes }));
        if (mode === "focus") {
          setTimeRemaining(minutes * 60);
        }
      }
    },
    [timerState, mode],
  );

  const setBreakDuration = useCallback(
    (minutes: number) => {
      setConfig((prev) => ({ ...prev, breakDuration: minutes }));
      if (mode === "break" && timerState === "idle") {
        setTimeRemaining(minutes * 60);
      }
    },
    [timerState, mode],
  );

  const onLogSaved = useCallback(() => {
    const nextMode = mode === "focus" ? "break" : "focus";
    setMode(nextMode);
    const nextDuration =
      nextMode === "focus" ? config.focusDuration * 60 : config.breakDuration * 60;
    setTimeRemaining(nextDuration);
    setOvertimeElapsed(0);
    setTimerState("idle");
    lastReminderRef.current = 0;
    window.api.updateTray("chronos");
  }, [mode, config]);

  // Tick effect
  useEffect(() => {
    if (timerState !== "running" && timerState !== "overtime") {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      if (timerState === "running") {
        setTimeRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            window.api.notify("Chronos", "Focus session complete. End when ready.");
            setTimerState("overtime");
            setOvertimeElapsed(0);
            return 0;
          }
          window.api.updateTray(formatTime(next, false));
          return next;
        });
      } else if (timerState === "overtime") {
        setOvertimeElapsed((prev) => {
          const next = prev + 1;
          const reminderInterval = config.overtimeReminder * 60;
          if (reminderInterval > 0 && next - lastReminderRef.current >= reminderInterval) {
            lastReminderRef.current = next;
            const mins = Math.floor(next / 60);
            window.api.notify("Chronos", `You've been in overtime for +${mins} minutes`);
          }
          window.api.updateTray(formatTime(next, true));
          return next;
        });
      }
    }, 1000);

    return clearTimer;
  }, [timerState, config.overtimeReminder, clearTimer]);

  return {
    timeRemaining,
    overtimeElapsed,
    timerState,
    mode,
    config,
    displayTime,
    progress,
    isOvertime,
    start,
    pause,
    resume,
    end,
    reset,
    skip,
    setTarget,
    setBreakDuration,
    onLogSaved,
  };
}
