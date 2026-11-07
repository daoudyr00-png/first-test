"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Open modals, innermost last — only the topmost one reacts to Escape. */
const stack: symbol[] = [];

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const token = Symbol("modal");
    stack.push(token);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack[stack.length - 1] === token) {
        e.stopImmediatePropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    // Focus the first form control as soon as the panel is mounted (the portal
    // commits with this effect). Never deferred: a delayed focus could steal
    // the caret from a field the user has already clicked into.
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const el = panel.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select, button[data-autofocus]");
      (el ?? panel).focus();
    }
    return () => {
      stack.splice(stack.indexOf(token), 1);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full ${width} flex-col rounded-t-2xl border border-line bg-paper shadow-pop sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-xl text-ink">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 rounded-md p-1.5 text-muted hover:bg-ivory-deep hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-ivory/60 px-5 py-3.5 sm:rounded-b-2xl sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
