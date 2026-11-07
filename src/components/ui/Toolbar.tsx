"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Download, FileJson, FileSpreadsheet, Search, X } from "lucide-react";

export function Toolbar({ children, count, total }: { children: ReactNode; count?: number; total?: number }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
      {count !== undefined && total !== undefined && (
        <span className="num text-xs text-faint sm:ml-auto">
          {count === total ? `${total} record${total === 1 ? "" : "s"}` : `${count} of ${total}`}
        </span>
      )}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-64">
      <Search size={15} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint" />
      <input
        type="search"
        aria-label="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input h-9 py-0 pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative inline-flex w-full items-center sm:w-auto">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 w-full appearance-none truncate rounded-md border bg-paper pr-8 pl-3 text-[13px] transition-colors focus:border-wine focus:outline-none sm:w-auto sm:max-w-52 ${
          value ? "border-wine-tint text-wine" : "border-line text-ink-soft"
        }`}
      >
        <option value="">{label}: All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {label}: {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-faint" />
    </label>
  );
}

export function ExportMenu({ onCsv, onJson, disabled }: { onCsv?: () => void; onJson: () => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-ink-soft hover:bg-ivory";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-paper px-3 text-sm font-medium text-ink hover:border-line-strong hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={15} /> Export <ChevronDown size={14} className="text-faint" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1.5 w-52 rounded-lg border border-line bg-paper p-1 shadow-pop">
          {onCsv && (
            <button role="menuitem" type="button" className={item} onClick={() => { onCsv(); setOpen(false); }}>
              <FileSpreadsheet size={15} className="text-sage" /> Export as CSV
            </button>
          )}
          <button role="menuitem" type="button" className={item} onClick={() => { onJson(); setOpen(false); }}>
            <FileJson size={15} className="text-ochre" /> Export as JSON
          </button>
          <p className="px-2.5 pt-1 pb-1.5 text-[11px] text-faint">Exports records matching your search and filters.</p>
        </div>
      )}
    </div>
  );
}
