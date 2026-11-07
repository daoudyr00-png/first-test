"use client";

import { useEffect, useState } from "react";
import { useOpenParam } from "./useOpenParam";

/** Shared UI state for list pages: form (new/edit), detail view, and pending delete. */
export function useCrudState<T extends { id: string }>(items: T[], ready: boolean) {
  const [form, setForm] = useState<T | "new" | null>(null);
  const [viewId, setViewId] = useOpenParam();
  const [deleting, setDeleting] = useState<T | null>(null);
  const viewing = items.find((i) => i.id === viewId) ?? null;

  useEffect(() => {
    if (ready && viewId && !viewing) setViewId(null);
  }, [ready, viewId, viewing, setViewId]);

  return { form, setForm, viewing, setViewId, deleting, setDeleting };
}
