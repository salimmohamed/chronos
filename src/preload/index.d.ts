import type { Session, TimerConfig } from "../renderer/src/lib/types";

declare global {
  interface Window {
    api: {
      updateTray: (time: string) => void;
      notify: (title: string, body: string) => void;

      loadSessions: () => Promise<Session[]>;
      saveSession: (session: Session) => Promise<void>;
      deleteSession: (id: string) => Promise<void>;

      loadConfig: () => Promise<TimerConfig | null>;
      saveConfig: (config: TimerConfig) => Promise<void>;

      startBreak: (duration: number) => void;
      endBreak: () => void;
      dismissBreak: () => void;

      onBreakDismissed: (cb: () => void) => () => void;
    };
  }
}
