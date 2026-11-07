"use client";

import { useEffect, useState } from "react";

/**
 * Reads a query param once on mount (e.g. `?open=<id>`) so pages can
 * deep-link to a record, then removes it from the URL.
 */
export function useQueryParam(name: string) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get(name);
    if (v) {
      setValue(v);
      params.delete(name);
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, [name]);
  return [value, setValue] as const;
}

export const useOpenParam = () => useQueryParam("open");
