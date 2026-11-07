export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Single horizontal stacked bar with a legend; segments with 0 are omitted from the bar but kept in the legend. */
export function StackedBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ivory-deep" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div key={s.key} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} className="h-full border-r-2 border-paper last:border-0" title={`${s.label}: ${s.value}`} />
            ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
            <span className="flex-1 text-ink-soft">{s.label}</span>
            <span className="num font-medium text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
