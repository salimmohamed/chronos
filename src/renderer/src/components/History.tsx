import { useState } from "react";
import type { Session } from "../lib/types";

interface HistoryProps {
  sessions: Session[];
  onDelete: (id: string) => void;
  onBack: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimeRange(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  return `${fmt(start)} \u2013 ${fmt(end)}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

export function History({ sessions, onDelete }: HistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group by date
  const grouped = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    const date = formatDate(s.startedAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {});

  if (sessions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="text-text-muted text-sm">no sessions yet</div>
        <div className="text-xs text-text-muted opacity-40">
          <kbd className="text-accent">esc</kbd> back
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 border-b border-border">
        <span className="text-xs tracking-[0.3em] uppercase text-text-muted font-medium">
          history
        </span>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {Object.entries(grouped).map(([date, dateSessions]) => (
          <div key={date} className="mb-4">
            <div className="text-xs text-text-muted opacity-40 mb-2 tracking-wide">{date}</div>
            {dateSessions.map((session) => {
              const isExpanded = expandedId === session.id;
              const overtime = session.actualDuration > session.targetDuration;

              return (
                <button
                  key={session.id}
                  type="button"
                  className="group w-full text-left border-b border-border/50 py-2 cursor-pointer hover:bg-surface-hover transition-colors duration-150 bg-transparent border-0 border-b"
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] uppercase tracking-wider ${session.mode === "focus" ? "text-accent" : "text-text-muted"}`}
                      >
                        {session.mode}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatTimeRange(session.startedAt, session.endedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${overtime ? "text-overtime" : "text-text-muted"}`}>
                        {formatDuration(session.actualDuration)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-danger text-xs transition-opacity"
                      >
                        \u00d7
                      </button>
                    </div>
                  </div>

                  {/* Expanded note */}
                  {isExpanded && session.note && (
                    <div className="mt-2 text-xs text-text-muted pl-12 pr-4 leading-relaxed">
                      {session.note}
                    </div>
                  )}

                  {/* Note preview (collapsed) */}
                  {!isExpanded && session.note && (
                    <div className="mt-1 text-xs text-text-muted opacity-40 pl-12 truncate">
                      {session.note}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
