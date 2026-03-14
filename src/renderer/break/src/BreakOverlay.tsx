import { useEffect, useState } from "react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BreakOverlay() {
  const params = new URLSearchParams(window.location.search);
  const initialDuration = Number.parseInt(params.get("duration") || "300", 10);

  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.api.endBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Dismiss on any key press or click
  useEffect(() => {
    const dismiss = () => {
      if (!dismissed) {
        setDismissed(true);
        window.api.dismissBreak();
      }
    };

    document.addEventListener("keydown", dismiss);
    document.addEventListener("click", dismiss);

    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("click", dismiss);
    };
  }, [dismissed]);

  const progress = 1 - timeRemaining / initialDuration;

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg cursor-pointer select-none">
      {/* Subtle grain texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

      <div className="text-xs tracking-[0.4em] uppercase text-text-muted mb-8 font-medium">
        take a break
      </div>

      <div className="text-8xl font-bold tracking-tight tabular-nums text-text mb-8">
        {formatTime(timeRemaining)}
      </div>

      {/* Progress bar */}
      <div className="w-64 h-[2px] bg-border overflow-hidden mb-12">
        <div
          className="h-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="text-xs text-text-muted opacity-30 tracking-wide">
        press any key to dismiss
      </div>
    </div>
  );
}
