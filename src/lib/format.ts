export function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

export function formatPrice(n: number | null) {
  return n === null || n === undefined ? "—" : `$${n.toFixed(2)}`;
}

export const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function isValidUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function hostname(s: string) {
  try {
    return new URL(s).hostname.replace(/^www\./, "");
  } catch {
    return s;
  }
}

/** Case-insensitive match of a query against any of the given fields. */
export function matches(query: string, ...fields: (string | string[] | null | undefined)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) =>
    Array.isArray(f) ? f.some((x) => x.toLowerCase().includes(q)) : (f ?? "").toLowerCase().includes(q),
  );
}
