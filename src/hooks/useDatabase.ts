"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  createRecord,
  ensureLoaded,
  getServerSnapshot,
  getSnapshot,
  removeRecord,
  subscribe,
  updateRecord,
} from "@/lib/store";
import type { CollectionName, EntityOf, NewRecord } from "@/lib/types";

export function useDatabase() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    ensureLoaded();
  }, []);
  return state;
}

export function useCollection<K extends CollectionName>(collection: K) {
  const { db, ready } = useDatabase();
  const items = db[collection] as EntityOf<K>[];
  return useMemo(
    () => ({
      items,
      ready,
      create: (input: NewRecord<EntityOf<K>>) => createRecord(collection, input),
      update: (id: string, patch: Partial<NewRecord<EntityOf<K>>>) => updateRecord(collection, id, patch),
      remove: (id: string) => removeRecord(collection, id),
    }),
    [collection, items, ready],
  );
}
