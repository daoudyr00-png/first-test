import { COLLECTIONS, emptyDatabase, type CollectionName, type Database, type EntityOf } from "@/lib/types";
import type { DataAdapter } from "./adapter";

const PREFIX = "pof:v1:";
const key = (c: CollectionName) => `${PREFIX}${c}`;

function read<K extends CollectionName>(c: K): Database[K] {
  if (typeof window === "undefined") return [] as Database[K];
  try {
    const raw = window.localStorage.getItem(key(c));
    if (!raw) return [] as Database[K];
    const parsed = JSON.parse(raw);
    return (Array.isArray(parsed) ? parsed : []) as Database[K];
  } catch {
    return [] as Database[K];
  }
}

function write<K extends CollectionName>(c: K, items: Database[K]) {
  window.localStorage.setItem(key(c), JSON.stringify(items));
}

export const localStorageAdapter: DataAdapter = {
  name: "localStorage",

  async loadAll() {
    const db = emptyDatabase();
    for (const c of COLLECTIONS) {
      (db as Record<CollectionName, unknown>)[c] = read(c);
    }
    return db;
  },

  async upsert(collection, record) {
    await this.upsertMany(collection, [record]);
  },

  async upsertMany<K extends CollectionName>(collection: K, records: EntityOf<K>[]) {
    const items = read(collection) as EntityOf<K>[];
    const byId = new Map(items.map((r) => [r.id, r]));
    for (const r of records) byId.set(r.id, r);
    write(collection, [...byId.values()] as Database[K]);
  },

  async remove(collection, id) {
    const items = read(collection) as { id: string }[];
    write(collection, items.filter((r) => r.id !== id) as Database[typeof collection]);
  },

  async replaceAll(db) {
    for (const c of COLLECTIONS) write(c, db[c] ?? []);
  },
};
