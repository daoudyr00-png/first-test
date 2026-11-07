import type { Problem } from "@/lib/types";

/**
 * Pain × willingness-to-pay matrix. Each bubble groups problems sharing the
 * same ratings; bubble size = number of problems, opacity = avg frequency.
 */
export function ProblemMatrix({ problems }: { problems: Problem[] }) {
  const W = 320;
  const H = 260;
  const pad = { l: 34, r: 12, t: 12, b: 34 };
  const cw = (W - pad.l - pad.r) / 5;
  const ch = (H - pad.t - pad.b) / 5;

  const cells = new Map<string, { pain: number; wtp: number; items: Problem[] }>();
  for (const p of problems) {
    const k = `${p.pain}-${p.willingnessToPay}`;
    const c = cells.get(k) ?? { pain: p.pain, wtp: p.willingnessToPay, items: [] };
    c.items.push(p);
    cells.set(k, c);
  }
  const maxCount = Math.max(1, ...[...cells.values()].map((c) => c.items.length));
  const cx = (pain: number) => pad.l + (pain - 0.5) * cw;
  const cy = (wtp: number) => pad.t + (5 - wtp + 0.5) * ch;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Problems plotted by pain and willingness to pay">
      {/* Priority zone (pain ≥4 and WTP ≥4) */}
      <rect x={pad.l + 3 * cw} y={pad.t} width={2 * cw} height={2 * ch} fill="var(--color-wine-soft)" rx={6} />
      <text x={pad.l + 5 * cw - 6} y={pad.t + 13} textAnchor="end" fontSize={9} fill="var(--color-wine)" letterSpacing="0.08em">
        PRIORITY
      </text>
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <line x1={pad.l + i * cw} x2={pad.l + i * cw} y1={pad.t} y2={H - pad.b} stroke="var(--color-line)" strokeDasharray="2 3" />
          <line x1={pad.l} x2={W - pad.r} y1={pad.t + i * ch} y2={pad.t + i * ch} stroke="var(--color-line)" strokeDasharray="2 3" />
        </g>
      ))}
      {[1, 2, 3, 4, 5].map((n) => (
        <g key={n} fontSize={10} fill="var(--color-faint)">
          <text x={cx(n)} y={H - pad.b + 14} textAnchor="middle">{n}</text>
          <text x={pad.l - 10} y={cy(n) + 3} textAnchor="middle">{n}</text>
        </g>
      ))}
      <text x={pad.l + (W - pad.l - pad.r) / 2} y={H - 4} textAnchor="middle" fontSize={10.5} fill="var(--color-muted)">
        Pain level →
      </text>
      <text transform={`translate(10 ${pad.t + (H - pad.t - pad.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={10.5} fill="var(--color-muted)">
        Willingness to pay →
      </text>
      {[...cells.values()].map((c) => {
        const avgFreq = c.items.reduce((s, p) => s + p.frequency, 0) / c.items.length;
        const r = 7 + (Math.sqrt(c.items.length / maxCount) * Math.min(cw, ch)) / 2.8;
        return (
          <g key={`${c.pain}-${c.wtp}`}>
            <circle cx={cx(c.pain)} cy={cy(c.wtp)} r={r} fill="var(--color-wine)" fillOpacity={0.25 + (avgFreq / 5) * 0.6} stroke="var(--color-paper)" strokeWidth={1.5}>
              <title>{`Pain ${c.pain}, WTP ${c.wtp} · avg frequency ${avgFreq.toFixed(1)}\n${c.items.map((p) => "• " + p.title).join("\n")}`}</title>
            </circle>
            {c.items.length > 1 && (
              <text x={cx(c.pain)} y={cy(c.wtp) + 3.5} textAnchor="middle" fontSize={10} fontWeight={600} fill="white" pointerEvents="none">
                {c.items.length}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
