import type { TimerMode, TimerState } from "../lib/types";

interface TimerProps {
  displayTime: string;
  mode: TimerMode;
  timerState: TimerState;
  progress: number;
  isOvertime: boolean;
  config: { focusDuration: number; breakDuration: number };
}

function getStatusHint(timerState: TimerState): string {
  switch (timerState) {
    case "idle":
      return "space to start";
    case "running":
      return "space to pause \u00b7 e to end";
    case "paused":
      return "space to resume \u00b7 r to reset";
    case "overtime":
      return "overtime \u2014 e to end session";
    default:
      return "";
  }
}

function getTargetPresets(mode: TimerMode): string {
  if (mode === "focus") return "1\u00b725  2\u00b750  3\u00b790";
  return "";
}

export function Timer({ displayTime, mode, timerState, progress, isOvertime, config }: TimerProps) {
  const targetMinutes = mode === "focus" ? config.focusDuration : config.breakDuration;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      {/* Mode label */}
      <div className="flex items-center gap-3">
        <span className="text-xs tracking-[0.3em] uppercase text-text-muted font-medium">
          {mode}
        </span>
        {timerState === "idle" && mode === "focus" && (
          <span className="text-xs text-text-muted opacity-40">{targetMinutes}m</span>
        )}
      </div>

      {/* Time display */}
      <div
        className={`text-7xl font-bold tracking-tight tabular-nums transition-colors duration-300 ${
          isOvertime ? "text-overtime animate-overtime" : "text-text"
        }`}
      >
        {displayTime}
      </div>

      {/* Progress bar */}
      <div className="w-48 h-[2px] bg-border overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isOvertime ? "bg-overtime animate-overtime" : "bg-accent"
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Target presets (idle only) */}
      {timerState === "idle" && mode === "focus" && (
        <div className="text-xs text-text-muted opacity-30 tracking-widest">
          {getTargetPresets(mode)}
        </div>
      )}

      {/* Status hint */}
      <div className="text-xs text-text-muted opacity-50 tracking-wide">
        {getStatusHint(timerState)}
      </div>
    </div>
  );
}
