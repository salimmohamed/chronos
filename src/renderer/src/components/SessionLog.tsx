import { useEffect, useRef, useState } from "react";
import type { TimerMode } from "../lib/types";

interface SessionLogProps {
  mode: TimerMode;
  targetDuration: number; // seconds
  actualDuration: number; // seconds
  onSave: (note: string) => void;
  onSkip: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionLog({
  mode,
  targetDuration,
  actualDuration,
  onSave,
  onSkip,
}: SessionLogProps) {
  const [note, setNote] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave(note);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onSkip();
    }
  };

  const overtime = actualDuration > targetDuration;
  const overtimeAmount = actualDuration - targetDuration;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 gap-6">
      <div className="text-xs tracking-[0.3em] uppercase text-text-muted font-medium">
        {mode} complete
      </div>

      {/* Duration summary */}
      <div className="flex items-baseline gap-2 text-sm text-text-muted">
        <span>{formatDuration(targetDuration)} target</span>
        <span className="text-border">\u2192</span>
        <span className={overtime ? "text-overtime" : "text-accent"}>
          {formatDuration(actualDuration)} actual
        </span>
        {overtime && (
          <span className="text-overtime text-xs opacity-60">
            (+{formatDuration(overtimeAmount)})
          </span>
        )}
      </div>

      {/* Note input */}
      <div className="w-full">
        <div className="text-sm text-text mb-3">what did you work on?</div>
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full bg-surface border border-border text-text text-sm px-3 py-2 resize-none focus:border-accent transition-colors duration-150"
          placeholder="..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onSave(note)}
          className="px-4 py-1.5 bg-accent text-bg text-xs font-medium tracking-wide hover:opacity-90 transition-opacity"
        >
          save
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-1.5 border border-border text-text-muted text-xs tracking-wide hover:border-text-muted transition-colors"
        >
          skip
        </button>
      </div>
    </div>
  );
}
