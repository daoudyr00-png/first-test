"use client";

import { useId, type ReactNode } from "react";
import { Field } from "./fields";

/** Select that links a record to another record (or none). */
export function LinkSelect({
  label,
  value,
  onChange,
  options,
  noneLabel = "Not linked",
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options: { id: string; label: string }[];
  noneLabel?: string;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select id={id} className="field-input" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{noneLabel}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
