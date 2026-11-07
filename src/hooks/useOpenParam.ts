"use client";

import { useEffect, useState } from "react";

/**
 * Reads `?open=<id>` once on mount so other pages can deep-link to a record
 * (e.g. dashboard → a specific opportunity). Cleans the URL afterwards.
 */
export function useOpenParam() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("open");
    if (v) {
      setId(v);
      params.delete("open");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);
  return [id, setId] as const;
}
