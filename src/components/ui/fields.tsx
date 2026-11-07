"use client";

import { useId, useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { isValidUrl } from "@/lib/format";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
        {required && <span className="ml-0.5 text-wine">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-[#8f1d1d]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
};

export function TextField({ label, value, onChange, placeholder, hint, error, required, className, type = "text" }: InputProps & { type?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <input
        id={id}
        type={type}
        className="field-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
    </Field>
  );
}

export function TextArea({ label, value, onChange, placeholder, hint, error, required, className, rows = 3 }: InputProps & { rows?: number }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <textarea
        id={id}
        rows={rows}
        className="field-input resize-y leading-relaxed"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  className,
  required,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: ReactNode;
  className?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className} required={required}>
      <select id={id} className="field-input pr-8" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** 1–5 (or 0–5) segmented rating control with per-level descriptions. */
export function RatingInput({
  label,
  value,
  onChange,
  min = 1,
  descriptions,
  hint,
  allowClear,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: 0 | 1;
  descriptions?: string[]; // indexed by rating value
  hint?: ReactNode;
  allowClear?: boolean;
}) {
  const levels = Array.from({ length: 6 - min }, (_, i) => i + min);
  const desc = value !== null && descriptions ? descriptions[value] : null;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
        {allowClear && value !== null && (
          <button type="button" className="text-xs text-muted underline-offset-2 hover:underline" onClick={() => onChange(null)}>
            Clear
          </button>
        )}
      </div>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line bg-ivory p-0.5">
        {levels.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              title={descriptions?.[n]}
              onClick={() => onChange(n)}
              className={`num h-8 w-9 rounded-[5px] text-sm font-medium transition-colors ${
                active ? "bg-wine text-white shadow-sm" : "text-ink-soft hover:bg-paper"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      {desc ? <p className="mt-1.5 text-xs text-ink-soft">{desc}</p> : hint ? <p className="mt-1.5 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

/** Editable list of short strings (sub-niches, audiences, URLs). */
export function ListInput({
  label,
  values,
  onChange,
  placeholder,
  hint,
  validateUrl,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: ReactNode;
  validateUrl?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | undefined>();

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (validateUrl && !isValidUrl(v)) {
      setError("Enter a full URL starting with http:// or https://");
      return;
    }
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setError("Already added");
      return;
    }
    onChange([...values, v]);
    setDraft("");
    setError(undefined);
  };

  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <div className="flex gap-2">
        <input
          id={id}
          className="field-input"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(undefined);
          }}
          onBlur={() => {
            // Don't silently lose a typed-but-not-added value.
            if (draft.trim()) add();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          aria-label={`Add ${label.toLowerCase()}`}
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-line bg-paper text-ink-soft hover:border-line-strong hover:bg-ivory"
        >
          <Plus size={16} />
        </button>
      </div>
      {values.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li
              key={v}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-line bg-ivory py-0.5 pr-1 pl-2 text-[13px] text-ink-soft"
            >
              <span className="truncate">{v}</span>
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="rounded p-0.5 text-faint hover:bg-ivory-deep hover:text-ink"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}
