// Offline write-queue backed by IndexedDB.
// When the network is down, mutations enqueue here and drain on reconnect.
// This is the foundation of the "Fortress" data sovereignty story without
// the iframe/preview pitfalls of a full service worker.
import { openDB, type IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';

type QueuedOp = {
  id?: number;
  table: string;
  op: 'insert' | 'update' | 'delete';
  payload: any;
  match?: Record<string, any>;
  created_at: number;
};

const DB_NAME = 'stratedgeos-offline';
const STORE = 'mutation_queue';
let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueOp(op: Omit<QueuedOp, 'id' | 'created_at'>) {
  const db = await getDB();
  await db.add(STORE, { ...op, created_at: Date.now() });
}

export async function pendingCount(): Promise<number> {
  try {
    const db = await getDB();
    return (await db.count(STORE)) || 0;
  } catch {
    return 0;
  }
}

export async function drainQueue(): Promise<{ ok: number; failed: number }> {
  const db = await getDB();
  const all = (await db.getAll(STORE)) as QueuedOp[];
  let ok = 0, failed = 0;
  for (const op of all) {
    try {
      let q: any = supabase.from(op.table);
      if (op.op === 'insert') q = q.insert(op.payload);
      if (op.op === 'update') {
        q = q.update(op.payload);
        for (const [k, v] of Object.entries(op.match || {})) q = q.eq(k, v);
      }
      if (op.op === 'delete') {
        q = q.delete();
        for (const [k, v] of Object.entries(op.match || {})) q = q.eq(k, v);
      }
      const { error } = await q;
      if (error) throw error;
      await db.delete(STORE, op.id!);
      ok++;
    } catch (e) {
      console.warn('drain op failed', op, e);
      failed++;
    }
  }
  return { ok, failed };
}
