import { useCallback, useEffect, useState } from "react";
import type { Session } from "../lib/types";

interface UseStoreReturn {
  sessions: Session[];
  loading: boolean;
  saveSession: (session: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export function useStore(): UseStoreReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api
      .loadSessions()
      .then((data) => setSessions(data))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = useCallback(async (session: Session) => {
    await window.api.saveSession(session);
    setSessions((prev) => [session, ...prev]);
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await window.api.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sessions, loading, saveSession, deleteSession };
}
