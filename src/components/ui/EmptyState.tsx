import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  children,
  action,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "px-6 py-10" : "px-6 py-16 sm:py-20"}`}>
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ivory text-wine">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {children && <div className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
