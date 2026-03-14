export type TimerMode = "focus" | "break";
export type TimerState = "idle" | "running" | "paused" | "overtime" | "logging";
export type View = "timer" | "log" | "history";

export interface TimerConfig {
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  overtimeReminder: number; // minutes between reminders
  fullScreenBreak: boolean;
}

export interface Session {
  id: string;
  startedAt: string; // ISO 8601
  endedAt: string; // ISO 8601
  targetDuration: number; // seconds
  actualDuration: number; // seconds (including overtime)
  mode: TimerMode;
  note: string;
  completed: boolean; // did timer reach target?
}

export const DEFAULT_CONFIG: TimerConfig = {
  focusDuration: 25,
  breakDuration: 5,
  overtimeReminder: 5,
  fullScreenBreak: true,
};
