import type { ReactNode } from "react";

export type Tone = "neutral" | "wine" | "sage" | "ochre" | "slate" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-ivory-deep text-ink-soft ring-line",
  wine: "bg-wine-soft text-wine ring-wine-tint",
  sage: "bg-sage-soft text-sage ring-[#d3e0d0]",
  ochre: "bg-ochre-soft text-ochre ring-[#ecdab8]",
  slate: "bg-slate-soft text-slate ring-[#dde1e6]",
  danger: "bg-[#fbeaea] text-[#8f1d1d] ring-[#f1cccc]",
};

export function Badge({ tone = "neutral", children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${TONES[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
