import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] text-wine uppercase">{eyebrow}</p>}
        <h1 className="font-display text-[28px] leading-tight tracking-[-0.01em] text-ink sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Loading placeholder shown until local data has hydrated (avoids flashing empty states). */
export function LoadingBlock() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="h-24 animate-pulse rounded-xl bg-ivory-deep/70" />
      <div className="h-64 animate-pulse rounded-xl bg-ivory-deep/50" />
    </div>
  );
}
