"use client";

import { adapter } from "@/lib/data";
import {
  COLLECTIONS,
  emptyDatabase,
  type BaseRecord,
  type CollectionName,
  type Database,
  type EntityOf,
  type NewRecord,
} from "@/lib/types";

/**
 * Client-side store: an immutable in-memory snapshot of the database plus
 * subscribers (consumed via useSyncExternalStore). Mutations update memory
 * first, then persist through the adapter.
 */

export interface StoreState {
  ready: boolean;
  db: Database;
  error: string | null;
}

let state: StoreState = { ready: false, db: emptyDatabase(), error: null };
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function setState(next: Partial<StoreState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const getSnapshot = () => state;
const SERVER_STATE: StoreState = { ready: false, db: emptyDatabase(), error: null };
export const getServerSnapshot = () => SERVER_STATE;

export function ensureLoaded() {
  if (state.ready || loading) return loading;
  loading = adapter
    .loadAll()
    .then((db) => setState({ db, ready: true }))
    .catch((e) => setState({ ready: true, error: String(e) }));
  return loading;
}

function persist(p: Promise<void>) {
  p.catch((e) => setState({ error: `Could not save: ${e instanceof Error ? e.message : String(e)}` }));
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const uid = newId;

export function createRecord<K extends CollectionName>(
  collection: K,
  input: NewRecord<EntityOf<K>>,
): EntityOf<K> {
  const now = new Date().toISOString();
  const record = { ...input, id: newId(), createdAt: now, updatedAt: now } as EntityOf<K>;
  setState({ db: { ...state.db, [collection]: [record, ...state.db[collection]] } });
  persist(adapter.upsert(collection, record));
  return record;
}

export function updateRecord<K extends CollectionName>(
  collection: K,
  id: string,
  patch: Partial<NewRecord<EntityOf<K>>>,
) {
  const items = state.db[collection] as EntityOf<K>[];
  const existing = items.find((r) => r.id === id);
  if (!existing) return;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() } as EntityOf<K>;
  setState({
    db: { ...state.db, [collection]: items.map((r) => (r.id === id ? updated : r)) },
  });
  persist(adapter.upsert(collection, updated));
}

/**
 * Foreign keys that point at each collection. When a parent is deleted the
 * link is cleared (set to null) rather than deleting the child — research
 * records are valuable on their own.
 */
const REFERENCES: Partial<Record<CollectionName, { collection: CollectionName; field: string }[]>> = {
  niches: [
    { collection: "problems", field: "nicheId" },
    { collection: "competitors", field: "nicheId" },
    { collection: "keywords", field: "nicheId" },
    { collection: "opportunities", field: "nicheId" },
  ],
  problems: [
    { collection: "opportunities", field: "problemId" },
    { collection: "ideas", field: "problemId" },
  ],
  opportunities: [{ collection: "ideas", field: "opportunityId" }],
};

export function removeRecord(collection: CollectionName, id: string) {
  const db: Database = {
    ...state.db,
    [collection]: (state.db[collection] as BaseRecord[]).filter((r) => r.id !== id),
  };
  const cascades: { collection: CollectionName; records: BaseRecord[] }[] = [];
  for (const ref of REFERENCES[collection] ?? []) {
    const changed: BaseRecord[] = [];
    const items = (db[ref.collection] as unknown as Record<string, unknown>[]).map((r) => {
      if (r[ref.field] !== id) return r;
      const next = { ...r, [ref.field]: null } as unknown as BaseRecord;
      changed.push(next);
      return next;
    });
    if (changed.length) {
      (db as unknown as Record<string, unknown>)[ref.collection] = items;
      cascades.push({ collection: ref.collection, records: changed });
    }
  }
  setState({ db });
  persist(
    (async () => {
      await adapter.remove(collection, id);
      for (const c of cascades) {
        await adapter.upsertMany(c.collection, c.records as EntityOf<typeof c.collection>[]);
      }
    })(),
  );
}

/** Count of records elsewhere that reference this record (for delete warnings). */
export function countReferences(collection: CollectionName, id: string) {
  let n = 0;
  for (const ref of REFERENCES[collection] ?? []) {
    n += (state.db[ref.collection] as unknown as Record<string, unknown>[]).filter(
      (r) => r[ref.field] === id,
    ).length;
  }
  return n;
}

export function replaceDatabase(db: Database) {
  setState({ db });
  persist(adapter.replaceAll(db));
}

export function clearError() {
  setState({ error: null });
}

/** Validates the shape of an imported backup file. Throws on bad input. */
export function parseBackup(text: string): Database {
  const parsed = JSON.parse(text);
  const source = parsed && typeof parsed === "object" && "data" in parsed ? parsed.data : parsed;
  if (!source || typeof source !== "object") throw new Error("File is not a Product Opportunity Finder backup.");
  const db = emptyDatabase();
  let found = 0;
  for (const c of COLLECTIONS) {
    const items = (source as Record<string, unknown>)[c];
    if (items === undefined) continue;
    if (!Array.isArray(items)) throw new Error(`"${c}" must be a list.`);
    for (const item of items) {
      if (!item || typeof item !== "object" || typeof (item as BaseRecord).id !== "string") {
        throw new Error(`A record in "${c}" is missing an id.`);
      }
    }
    (db as unknown as Record<string, unknown>)[c] = items;
    found++;
  }
  if (!found) throw new Error("No recognised collections found in this file.");
  return db;
}
