import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { Session, TimerConfig } from "../renderer/src/lib/types";

const CHRONOS_DIR = path.join(os.homedir(), ".chronos");
const SESSIONS_PATH = path.join(CHRONOS_DIR, "sessions.json");
const CONFIG_PATH = path.join(CHRONOS_DIR, "config.json");

function ensureDir(): void {
  if (!fs.existsSync(CHRONOS_DIR)) {
    fs.mkdirSync(CHRONOS_DIR, { recursive: true });
  }
}

export function readSessions(): Session[] {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function writeSessions(sessions: Session[]): void {
  ensureDir();
  fs.writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2));
}

export function saveSession(session: Session): void {
  const sessions = readSessions();
  sessions.unshift(session);
  writeSessions(sessions);
}

export function deleteSession(id: string): void {
  const sessions = readSessions().filter((s) => s.id !== id);
  writeSessions(sessions);
}

export function readConfig(): TimerConfig | null {
  ensureDir();
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return null;
  }
}

export function writeConfig(config: TimerConfig): void {
  ensureDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
