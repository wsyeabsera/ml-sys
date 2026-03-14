import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "playground";
const DB_VERSION = 1;
const STORE_NAME = "sessions";

interface Session {
  id: string;
  name: string;
  commands: string[];
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_SESSION_ID = "default";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadSession(): Promise<string[]> {
  try {
    const db = await getDb();
    const session = await db.get(STORE_NAME, DEFAULT_SESSION_ID) as Session | undefined;
    return session?.commands ?? [];
  } catch {
    return [];
  }
}

export async function saveSession(commands: string[]): Promise<void> {
  try {
    const db = await getDb();
    const existing = await db.get(STORE_NAME, DEFAULT_SESSION_ID) as Session | undefined;
    const session: Session = {
      id: DEFAULT_SESSION_ID,
      name: "Default",
      commands,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    await db.put(STORE_NAME, session);
  } catch {
    // Silently fail — persistence is best-effort
  }
}

export async function clearSession(): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORE_NAME, DEFAULT_SESSION_ID);
  } catch {
    // Silently fail
  }
}
