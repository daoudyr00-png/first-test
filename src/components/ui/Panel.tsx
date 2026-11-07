import type { ReactNode } from "react";

/** Labelled read-only block used in detail views. */
export function Detail({ label, children, empty = "Not recorded" }: { label: string; children?: ReactNode; empty?: string }) {
  const isEmpty = children === undefined || children === null || children === "" || (Array.isArray(children) && children.length === 0);
  return (
    <div>
      <dt className="mb-1 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">{label}</dt>
      <dd className="text-[14px] leading-relaxed whitespace-pre-wrap text-ink-soft">
        {isEmpty ? <span className="text-faint italic">{empty}</span> : children}
      </dd>
    </div>
  );
}
