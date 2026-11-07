"use client";

import { ArrowDownUp, ChevronDown } from "lucide-react";

export function SortSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative inline-flex w-full items-center sm:w-auto">
      <span className="sr-only">Sort by</span>
      <ArrowDownUp size={14} className="pointer-events-none absolute left-2.5 text-faint" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-line bg-paper pr-8 pl-8 text-[13px] text-ink-soft focus:border-wine focus:outline-none sm:w-auto"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-faint" />
    </label>
  );
}
