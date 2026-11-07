import { scoreBand, BAND_LABEL } from "@/lib/scoring";
import { Badge, type Tone } from "./Badge";

const BAND_TONE: Record<ReturnType<typeof scoreBand>, Tone> = { strong: "sage", moderate: "ochre", weak: "neutral" };
const BAND_COLOR: Record<ReturnType<typeof scoreBand>, string> = {
  strong: "var(--color-wine)",
  moderate: "var(--color-ochre)",
  weak: "var(--color-faint)",
};

/** Compact pill: "72 · Strong". */
export function ScorePill({ score, incomplete }: { score: number; incomplete?: boolean }) {
  const band = scoreBand(score);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="num font-display text-[17px] leading-none text-ink">{score}</span>
      <Badge tone={BAND_TONE[band]}>{BAND_LABEL[band]}</Badge>
      {incomplete && (
        <span className="text-[11px] text-faint" title="Not every criterion has been rated yet">
          partial
        </span>
      )}
    </span>
  );
}

/** Circular gauge for headline scores. */
export function ScoreRing({ score, size = 96, label }: { score: number; size?: number; label?: string }) {
  const stroke = size * 0.085;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ivory-deep)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={BAND_COLOR[scoreBand(score)]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          style={{ transition: "stroke-dasharray 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num font-display leading-none text-ink" style={{ fontSize: size * 0.3 }}>
          {score}
        </span>
        <span className="mt-0.5 text-[10px] tracking-wider text-faint uppercase">{label ?? "of 100"}</span>
      </div>
    </div>
  );
}

/** Horizontal bar, value 0–max. */
export function Meter({ value, max = 100, tone = "wine" }: { value: number; max?: number; tone?: "wine" | "ink" | "muted" }) {
  const color = tone === "wine" ? "bg-wine" : tone === "ink" ? "bg-ink-soft" : "bg-line-strong";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ivory-deep">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  );
}

/** Five-dot display for 1–5 research ratings. */
export function Dots({ value, max = 5, label }: { value: number; max?: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`${label ? label + ": " : ""}${value} of ${max}`} title={`${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`h-[7px] w-[7px] rounded-full ${i < value ? "bg-wine" : "bg-line"}`} />
      ))}
    </span>
  );
}
