import type { TimerState, View } from "../lib/types";

interface ControlsProps {
  timerState: TimerState;
  view: View;
}

export function Controls({ timerState, view }: ControlsProps) {
  if (view === "log") {
    return (
      <div className="border-t border-border px-4 py-3 text-xs text-text-muted tracking-wide flex justify-center gap-6">
        <span>
          <kbd className="text-accent">enter</kbd> save
        </span>
        <span>
          <kbd className="text-accent">esc</kbd> skip
        </span>
      </div>
    );
  }

  if (view === "history") {
    return (
      <div className="border-t border-border px-4 py-3 text-xs text-text-muted tracking-wide flex justify-center gap-6">
        <span>
          <kbd className="text-accent">esc</kbd> back
        </span>
        <span>
          <kbd className="text-accent">d</kbd> delete
        </span>
      </div>
    );
  }

  return (
    <div className="border-t border-border px-4 py-3 text-xs text-text-muted tracking-wide flex justify-center gap-6">
      <span>
        <kbd className="text-accent">space</kbd>{" "}
        {timerState === "idle"
          ? "start"
          : timerState === "running" || timerState === "overtime"
            ? "pause"
            : "resume"}
      </span>
      {(timerState === "running" || timerState === "overtime") && (
        <span>
          <kbd className="text-accent">e</kbd> end
        </span>
      )}
      <span>
        <kbd className="text-accent">h</kbd> history
      </span>
      <span>
        <kbd className="text-accent">q</kbd> quit
      </span>
    </div>
  );
}
