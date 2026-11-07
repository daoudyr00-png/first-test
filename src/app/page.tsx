"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Check, Compass, Gauge, KeyRound, Lightbulb, Swords, Target } from "lucide-react";
import { useDatabase } from "@/hooks/useDatabase";
import { PageHeader, LoadingBlock } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Meter, ScorePill, ScoreRing } from "@/components/ui/Score";
import { ProblemMatrix } from "@/components/charts/ProblemMatrix";
import { StackedBar } from "@/components/charts/StackedBar";
import { CRITERION_LIST, scoreOpportunity } from "@/lib/scoring";
import { VALIDATION_META } from "@/lib/labels";
import { relativeTime } from "@/lib/format";
import { VALIDATION_STATUSES, type CollectionName } from "@/lib/types";

const TYPE_META: Record<CollectionName, { label: string; href: string }> = {
  niches: { label: "Niche", href: "/niches" },
  problems: { label: "Problem", href: "/problems" },
  competitors: { label: "Competitor", href: "/competitors" },
  keywords: { label: "Keyword", href: "/keywords" },
  opportunities: { label: "Opportunity", href: "/scoring" },
  ideas: { label: "Product idea", href: "/ideas" },
};

export default function DashboardPage() {
  const { db, ready } = useDatabase();

  const scored = useMemo(
    () =>
      db.opportunities
        .map((o) => ({ o, s: scoreOpportunity(o) }))
        .sort((a, b) => b.s.total - a.s.total),
    [db.opportunities],
  );

  const recent = useMemo(() => {
    const items: { type: CollectionName; id: string; title: string; updatedAt: string; created: boolean }[] = [];
    const push = (type: CollectionName, id: string, title: string, createdAt: string, updatedAt: string) =>
      items.push({ type, id, title, updatedAt, created: createdAt === updatedAt });
    db.niches.forEach((r) => push("niches", r.id, r.name, r.createdAt, r.updatedAt));
    db.problems.forEach((r) => push("problems", r.id, r.title, r.createdAt, r.updatedAt));
    db.competitors.forEach((r) => push("competitors", r.id, `${r.productName || "Untitled"} — ${r.competitorName}`, r.createdAt, r.updatedAt));
    db.keywords.forEach((r) => push("keywords", r.id, r.keyword, r.createdAt, r.updatedAt));
    db.opportunities.forEach((r) => push("opportunities", r.id, r.title, r.createdAt, r.updatedAt));
    db.ideas.forEach((r) => push("ideas", r.id, r.name, r.createdAt, r.updatedAt));
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);
  }, [db]);

  const criterionAverages = useMemo(
    () =>
      CRITERION_LIST.map((def) => {
        const rated = db.opportunities.map((o) => o.criteria[def.key]?.rating).filter((r): r is number => r !== null && r !== undefined);
        return { def, avg: rated.length ? rated.reduce((s, r) => s + r, 0) / rated.length : null, n: rated.length };
      }),
    [db.opportunities],
  );

  if (!ready) return <LoadingBlock />;

  const totalRecords = Object.values(db).reduce((s, l) => s + l.length, 0);
  const avgScore = scored.length ? Math.round(scored.reduce((s, x) => s + x.s.total, 0) / scored.length) : null;
  const validated = db.ideas.filter((i) => i.validationStatus === "validated" || i.validationStatus === "launched").length;
  const sourcedProblems = db.problems.filter((p) => p.sourceUrls.length > 0).length;

  const stats = [
    { label: "Researched niches", value: db.niches.length, sub: `${db.niches.filter((n) => n.status === "promising").length} marked promising`, href: "/niches", icon: Compass },
    { label: "Identified problems", value: db.problems.length, sub: `${sourcedProblems} with source URLs`, href: "/problems", icon: Target },
    { label: "Scored opportunities", value: db.opportunities.length, sub: avgScore === null ? "No scores yet" : `Average score ${avgScore}`, href: "/scoring", icon: Gauge },
    { label: "Product ideas", value: db.ideas.length, sub: `${validated} validated or launched`, href: "/ideas", icon: Lightbulb },
  ];

  const steps = [
    { done: db.niches.length > 0, label: "Define a niche you want to explore", href: "/niches", icon: Compass },
    { done: db.problems.length > 0, label: "Log a customer problem you found evidence for", href: "/problems", icon: Target },
    { done: db.competitors.length > 0, label: "Record an existing competitor product", href: "/competitors", icon: Swords },
    { done: db.keywords.length > 0, label: "Note a keyword buyers search for", href: "/keywords", icon: KeyRound },
    { done: db.opportunities.length > 0, label: "Score an opportunity against the rubric", href: "/scoring", icon: Gauge },
    { done: db.ideas.length > 0, label: "Shape a product idea", href: "/ideas", icon: Lightbulb },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Research overview"
        description="Everything here is calculated from records you've entered. Nothing is estimated or pulled from outside sources."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-xl border border-line bg-paper p-4 shadow-card transition-colors hover:border-line-strong sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-muted">{s.label}</span>
              <s.icon size={16} className="text-faint transition-colors group-hover:text-wine" />
            </div>
            <div className="num mt-3 font-display text-[34px] leading-none text-ink">{s.value}</div>
            <div className="mt-2 text-xs text-faint">{s.sub}</div>
          </Link>
        ))}
      </div>

      {totalRecords === 0 ? (
        <Card className="mt-6">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-wine uppercase">Start here</p>
              <h2 className="mt-2 font-display text-2xl text-ink">Build your evidence base</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Good digital products start from real problems, not guesses. Work through the research steps, then score
                opportunities using a transparent rubric. The dashboard fills in as you go.
              </p>
            </div>
            <ol className="space-y-1.5">
              {steps.map((s, i) => (
                <li key={s.href}>
                  <Link href={s.href} className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-2.5 text-[13.5px] text-ink-soft transition-colors hover:border-line-strong hover:bg-ivory">
                    <span className="num flex h-6 w-6 items-center justify-center rounded-full border border-line bg-ivory text-[11px] text-muted">{i + 1}</span>
                    <span className="flex-1">{s.label}</span>
                    <ArrowRight size={15} className="text-faint" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <Card>
              <CardHeader
                title="Best opportunities"
                description="Ranked by weighted opportunity score"
                action={<Link href="/scoring" className="text-[13px] font-medium text-wine hover:underline">View all</Link>}
              />
              {scored.length === 0 ? (
                <EmptyState compact icon={<Gauge size={18} />} title="No opportunities scored yet" action={<Link href="/scoring" className="text-[13px] font-medium text-wine hover:underline">Score your first opportunity →</Link>}>
                  Score a niche or problem against the five criteria to see it ranked here.
                </EmptyState>
              ) : (
                <div>
                  <div className="flex items-center gap-5 border-b border-line px-5 py-5">
                    <ScoreRing score={scored[0].s.total} size={88} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.12em] text-faint uppercase">Top ranked</p>
                      <Link href={`/scoring?open=${scored[0].o.id}`} className="mt-1 block truncate font-display text-xl text-ink hover:text-wine">
                        {scored[0].o.title}
                      </Link>
                      <p className="mt-1 text-[13px] text-muted">
                        {scored[0].s.assessedCount}/5 criteria rated
                        {(() => {
                          const n = db.niches.find((x) => x.id === scored[0].o.nicheId);
                          return n ? ` · ${n.name}` : "";
                        })()}
                      </p>
                    </div>
                  </div>
                  <ul>
                    {scored.slice(1, 6).map(({ o, s }, i) => (
                      <li key={o.id} className="border-b border-line/70 last:border-0">
                        <Link href={`/scoring?open=${o.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-ivory/60">
                          <span className="num w-4 text-xs text-faint">{i + 2}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-medium text-ink">{o.title}</span>
                            <span className="mt-1.5 block max-w-56"><Meter value={s.total} tone={i < 2 ? "wine" : "muted"} /></span>
                          </span>
                          <ScorePill score={s.total} incomplete={!s.complete} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Recent research" description="Latest records you created or edited" />
              <ul>
                {recent.map((r) => (
                  <li key={`${r.type}-${r.id}`} className="border-b border-line/70 last:border-0">
                    <Link href={`${TYPE_META[r.type].href}?open=${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ivory/60">
                      <span className="w-[84px] shrink-0 text-[11px] font-medium tracking-wide text-faint uppercase">{TYPE_META[r.type].label}</span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{r.title || "Untitled"}</span>
                      <span className="shrink-0 text-xs text-faint">{r.created ? "Added" : "Edited"} {relativeTime(r.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader title="Problem matrix" description="Pain vs. willingness to pay, from your ratings" />
              <div className="p-5">
                {db.problems.length === 0 ? (
                  <EmptyState compact title="No problems logged">Problems you log will be plotted here.</EmptyState>
                ) : (
                  <>
                    <ProblemMatrix problems={db.problems} />
                    <p className="mt-2 text-xs text-faint">Darker bubbles = more frequent problems. Hover for titles.</p>
                  </>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Criterion averages" description="Mean rating (0–5) across scored opportunities" />
              <div className="space-y-4 p-5">
                {scored.length === 0 ? (
                  <EmptyState compact title="Nothing scored yet">Averages appear once you rate opportunities.</EmptyState>
                ) : (
                  criterionAverages.map(({ def, avg, n }) => (
                    <div key={def.key}>
                      <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                        <span className="text-ink-soft">
                          {def.label} <span className="text-faint">· {Math.round(def.weight * 100)}%</span>
                        </span>
                        <span className="num font-medium text-ink">{avg === null ? "—" : avg.toFixed(1)}</span>
                      </div>
                      <Meter value={avg ?? 0} max={5} />
                      {n < scored.length && <p className="mt-1 text-[11px] text-faint">{scored.length - n} not yet rated</p>}
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Idea pipeline" description="Product ideas by validation status" />
              <div className="p-5">
                {db.ideas.length === 0 ? (
                  <EmptyState compact title="No product ideas yet">Ideas you add will be tracked through validation here.</EmptyState>
                ) : (
                  <StackedBar
                    segments={VALIDATION_STATUSES.map((s) => ({
                      key: s,
                      label: VALIDATION_META[s].label,
                      value: db.ideas.filter((i) => i.validationStatus === s).length,
                      color: VALIDATION_META[s].color,
                    }))}
                  />
                )}
              </div>
            </Card>
          </div>

          {steps.some((s) => !s.done) && (
            <Card className="mt-6">
              <CardHeader title="Research checklist" description="Modules you haven't used yet" />
              <ul className="grid gap-1.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {steps.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] hover:bg-ivory">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${s.done ? "bg-sage text-white" : "border border-line-strong"}`}>
                        {s.done && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className={s.done ? "text-faint line-through" : "text-ink-soft"}>{s.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </>
  );
}
