/** JSON and CSV export helpers. Pure functions + one browser download helper. */

export type CsvColumn<T> = { header: string; value: (row: T) => unknown };

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("; ") : typeof v === "object" ? JSON.stringify(v) : String(v);
  // Neutralise spreadsheet formula injection, then quote if needed.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => cell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => cell(c.value(r))).join(","));
  return [head, ...body].join("\r\n");
}

export function toJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([mime.startsWith("text/csv") ? "﻿" + content : content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const stamp = () => new Date().toISOString().slice(0, 10);

export function exportCsv<T>(name: string, rows: T[], columns: CsvColumn<T>[]) {
  download(`${name}-${stamp()}.csv`, toCsv(rows, columns), "text/csv;charset=utf-8");
}

export function exportJson(name: string, data: unknown) {
  download(`${name}-${stamp()}.json`, toJson(data), "application/json");
}
