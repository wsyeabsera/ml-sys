import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "playground";
const DB_VERSION = 2;
const SESSIONS_STORE = "sessions";
const OUTPUTS_STORE = "outputs";

// --- Shared DB connection ---

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(OUTPUTS_STORE)) {
          const store = db.createObjectStore(OUTPUTS_STORE, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

// --- Sessions ---

interface Session {
  id: string;
  name: string;
  commands: string[];
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_SESSION_ID = "default";

export async function loadSession(): Promise<string[]> {
  try {
    const db = await getDb();
    const session = await db.get(SESSIONS_STORE, DEFAULT_SESSION_ID) as Session | undefined;
    return session?.commands ?? [];
  } catch {
    return [];
  }
}

export async function saveSession(commands: string[], maxHistory?: number): Promise<void> {
  try {
    const db = await getDb();
    const existing = await db.get(SESSIONS_STORE, DEFAULT_SESSION_ID) as Session | undefined;
    const trimmed = maxHistory && commands.length > maxHistory
      ? commands.slice(-maxHistory)
      : commands;
    const session: Session = {
      id: DEFAULT_SESSION_ID,
      name: "Default",
      commands: trimmed,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    await db.put(SESSIONS_STORE, session);
  } catch { /* best effort */ }
}

export async function clearSession(): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(SESSIONS_STORE, DEFAULT_SESSION_ID);
  } catch { /* best effort */ }
}

// --- Outputs ---

export interface StoredOutput {
  id: string;
  input: string;
  output: string;
  parsed: unknown | null;
  type: string;
  timestamp: number;
  isError: boolean;
  hasRichViz: boolean;
}

export function generateOutputId(): string {
  return crypto.randomUUID();
}

export async function storeOutput(output: StoredOutput): Promise<void> {
  try {
    const db = await getDb();
    await db.put(OUTPUTS_STORE, output);
  } catch { /* best effort */ }
}

export async function loadOutput(id: string): Promise<StoredOutput | null> {
  try {
    const db = await getDb();
    return (await db.get(OUTPUTS_STORE, id)) ?? null;
  } catch {
    return null;
  }
}

export async function listOutputs(limit = 50): Promise<StoredOutput[]> {
  try {
    const db = await getDb();
    const all = await db.getAllFromIndex(OUTPUTS_STORE, "timestamp");
    return all.reverse().slice(0, limit);
  } catch {
    return [];
  }
}
