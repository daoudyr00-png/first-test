"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  className?: string;
  /** Hide on narrow screens to keep tables readable on mobile. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "right" | "center";
}

export type SortState = { id: string; dir: "asc" | "desc" };

const HIDE: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export function sortRows<T>(rows: T[], columns: Column<T>[], sort: SortState | null) {
  if (!sort) return rows;
  const col = columns.find((c) => c.id === sort.id);
  if (!col?.sortValue) return rows;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = col.sortValue!(a);
    const vb = col.sortValue!(b);
    const na = va === null || va === undefined || va === "";
    const nb = vb === null || vb === undefined || vb === "";
    if (na && nb) return 0;
    if (na) return 1; // empty values always last
    if (nb) return -1;
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb), undefined, { sensitivity: "base", numeric: true }) * dir;
  });
}

export function DataTable<T>({
  rows,
  columns,
  getId,
  onRowClick,
  actions,
  initialSort = null,
  empty,
}: {
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => ReactNode;
  initialSort?: SortState | null;
  empty?: ReactNode;
}) {
  const [sort, setSort] = useState<SortState | null>(initialSort);
  const sorted = useMemo(() => sortRows(rows, columns, sort), [rows, columns, sort]);

  const toggle = (id: string) =>
    setSort((s) => (s?.id !== id ? { id, dir: "asc" } : s.dir === "asc" ? { id, dir: "desc" } : null));

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-ivory/70">
            {columns.map((c) => {
              const active = sort?.id === c.id;
              const align = c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left";
              return (
                <th
                  key={c.id}
                  scope="col"
                  aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={`px-4 py-2.5 text-[11.5px] font-semibold tracking-[0.06em] text-muted uppercase ${align} ${c.hideBelow ? HIDE[c.hideBelow] : ""}`}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      className={`inline-flex items-center gap-1 uppercase hover:text-ink ${active ? "text-ink" : ""}`}
                    >
                      {c.header}
                      {active ? (
                        sort!.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
            {actions && <th className="w-px px-3 py-2.5"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={getId(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-line/70 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-ivory/60" : ""}`}
            >
              {columns.map((c) => (
                <td
                  key={c.id}
                  className={`px-4 py-3 align-top text-ink-soft ${
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""
                  } ${c.hideBelow ? HIDE[c.hideBelow] : ""} ${c.className ?? ""}`}
                >
                  {c.cell(row)}
                </td>
              ))}
              {actions && (
                <td className="px-3 py-2 align-top whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-0.5">{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
