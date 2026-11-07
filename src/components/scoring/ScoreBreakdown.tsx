import type { ScoreResult } from "@/lib/scoring";
import { CRITERION_DEFS } from "@/lib/scoring";
import { ScoreRing } from "@/components/ui/Score";
import { AlertTriangle } from "lucide-react";

/** Live / static breakdown showing exactly how the total is built. */
export function ScoreSummary({ result }: { result: ScoreResult }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <ScoreRing score={result.total} size={92} />
        <div className="text-[13px] leading-relaxed text-muted">
          <div className="font-medium text-ink">{result.assessedCount} of 5 criteria rated</div>
          {!result.complete && <div>Unrated criteria count as 0.</div>}
          {result.missingReasoning.length > 0 && (
            <div className="mt-1 flex items-start gap-1.5 text-[#a45a12]">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{result.missingReasoning.length} rating(s) without reasoning</span>
            </div>
          )}
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {result.breakdown.map((b) => (
          <li key={b.key}>
            <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
              <span className="text-ink-soft">{b.label}</span>
              <span className="num text-faint">
                <span className="font-medium text-ink">{b.contribution.toFixed(1)}</span> / {b.maxContribution}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ivory-deep">
              <div className="h-full rounded-full bg-wine transition-[width] duration-300" style={{ width: `${(b.contribution / b.maxContribution) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Full audit table for the detail view. */
export function ScoreTable({ result }: { result: ScoreResult }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-ivory/70 text-left text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">
            <th className="px-3 py-2">Criterion</th>
            <th className="px-3 py-2 text-right">Weight</th>
            <th className="px-3 py-2 text-right">Rating</th>
            <th className="px-3 py-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {result.breakdown.map((b) => (
            <tr key={b.key} className="border-b border-line/70 align-top last:border-0">
              <td className="px-3 py-3">
                <div className="font-medium text-ink">{b.label}</div>
                <div className="mt-0.5 text-xs text-muted">{b.rubricText}</div>
                <div className={`mt-2 text-[13px] leading-relaxed whitespace-pre-wrap ${b.reasoning ? "text-ink-soft" : "text-faint italic"}`}>
                  {b.reasoning || (b.rating === null ? "Not yet assessed" : "No reasoning recorded")}
                </div>
              </td>
              <td className="num px-3 py-3 text-right text-muted">{Math.round(b.weight * 100)}%</td>
              <td className="num px-3 py-3 text-right text-ink">{b.rating === null ? "—" : `${b.rating}/5`}</td>
              <td className="num px-3 py-3 text-right font-medium text-ink">{b.contribution.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line bg-ivory/50">
            <td className="px-3 py-2.5 text-[13px] font-medium text-ink" colSpan={3}>Total opportunity score</td>
            <td className="num px-3 py-2.5 text-right font-display text-lg text-ink">{result.total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function Methodology() {
  return (
    <div className="grid gap-5 text-[13px] leading-relaxed text-ink-soft lg:grid-cols-[1fr_1.4fr]">
      <div>
        <p>
          You rate each criterion from <strong>0 to 5</strong> against a written rubric and record your reasoning. Each rating becomes a
          criterion score (<span className="num">rating ÷ 5 × 100</span>), which is multiplied by its weight. The weighted points add up
          to a score out of 100.
        </p>
        <p className="mt-2 text-muted">
          The app never invents a rating. Facts from your own research records are shown next to each criterion for reference only.
          Scores of 70+ are labelled <em>Strong</em>, 45–69 <em>Moderate</em>, below 45 <em>Weak</em>.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {Object.values(CRITERION_DEFS).map((c) => (
          <li key={c.key} className="rounded-lg border border-line bg-ivory/50 px-3 py-2.5">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-ink">{c.label}</span>
              <span className="num text-wine">{Math.round(c.weight * 100)}%</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">{c.question}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
