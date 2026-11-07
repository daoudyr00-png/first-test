import type { CollectionName, Database, EntityOf } from "@/lib/types";

/**
 * Persistence boundary. The UI never touches storage directly — it talks to
 * the store, which talks to one DataAdapter. To move to Supabase, implement
 * this interface with supabase-js (one table per collection) and swap it in
 * `src/lib/data/index.ts`. All methods are async for that reason.
 */
export interface DataAdapter {
  readonly name: string;
  loadAll(): Promise<Database>;
  upsert<K extends CollectionName>(collection: K, record: EntityOf<K>): Promise<void>;
  /** Bulk write used for cascades (e.g. un-linking records after a delete). */
  upsertMany<K extends CollectionName>(collection: K, records: EntityOf<K>[]): Promise<void>;
  remove<K extends CollectionName>(collection: K, id: string): Promise<void>;
  /** Replace everything — used by JSON import and "clear all data". */
  replaceAll(db: Database): Promise<void>;
}
