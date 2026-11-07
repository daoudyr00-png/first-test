"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Gauge, Lightbulb, Plus } from "lucide-react";
import { useCollection, useDatabase } from "@/hooks/useDatabase";
import { useCrudState } from "@/hooks/useCrudState";
import { useQueryParam } from "@/hooks/useOpenParam";
import { PageHeader, LoadingBlock } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { DetailModal, RowActions } from "@/components/ui/DetailModal";
import { Detail } from "@/components/ui/Panel";
import { ScorePill, ScoreRing } from "@/components/ui/Score";
import { ExportMenu, FilterSelect, SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { OpportunityForm, type OpportunityDraft } from "@/components/scoring/OpportunityForm";
import { Methodology, ScoreTable } from "@/components/scoring/ScoreBreakdown";
import { CRITERION_LIST, scoreBand, scoreOpportunity, BAND_LABEL, type ScoreResult } from "@/lib/scoring";
import { countReferences } from "@/lib/store";
import { exportCsv, exportJson } from "@/lib/export";
import { matches, relativeTime } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

type Row = Opportunity & { score: ScoreResult };

export default function ScoringPage() {
  const { db } = useDatabase();
  const { items, ready, create, update, remove } = useCollection("opportunities");
  const { form, setForm, viewing, setViewId, deleting, setDeleting } = useCrudState(items, ready);
  const [problemParam, setProblemParam] = useQueryParam("problem");
  const [prefill, setPrefill] = useState<Partial<OpportunityDraft> | undefined>();
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [band, setBand] = useState("");
  const [completeness, setCompleteness] = useState("");
  const [showMethod, setShowMethod] = useState(false);

  // Deep link from Problem Discovery: /scoring?problem=<id>
  useEffect(() => {
    if (!ready || !problemParam) return;
    const p = db.problems.find((x) => x.id === problemParam);
    if (p) {
      setPrefill({ title: p.title, problemId: p.id, nicheId: p.nicheId });
      setForm("new");
    }
    setProblemParam(null);
  }, [ready, problemParam, db.problems, setForm, setProblemParam]);

  const nicheName = (id: string | null) => (id ? db.niches.find((n) => n.id === id)?.name ?? null : null);
  const problemTitle = (id: string | null) => (id ? db.problems.find((n) => n.id === id)?.title ?? null : null);

  const all: Row[] = useMemo(() => items.map((o) => ({ ...o, score: scoreOpportunity(o) })), [items]);
  const rows = useMemo(
    () =>
      all.filter(
        (o) =>
          (!niche || (niche === "none" ? !o.nicheId : o.nicheId === niche)) &&
          (!band || scoreBand(o.score.total) === band) &&
          (!completeness || (completeness === "complete" ? o.score.complete : !o.score.complete)) &&
          matches(query, o.title, o.notes, Object.values(o.criteria).map((c) => c.reasoning)),
      ),
    [all, niche, band, completeness, query],
  );

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Opportunity",
        sortValue: (o) => o.title,
        className: "min-w-[220px]",
        cell: (o) => (
          <div>
            <div className="font-medium text-ink">{o.title}</div>
            <div className="mt-0.5 text-xs text-muted">{[nicheName(o.nicheId), problemTitle(o.problemId)].filter(Boolean).join(" · ") || "Not linked"}</div>
          </div>
        ),
      },
      { id: "score", header: "Score", sortValue: (o) => o.score.total, cell: (o) => <ScorePill score={o.score.total} incomplete={!o.score.complete} /> },
      {
        id: "breakdown",
        header: "Breakdown",
        hideBelow: "md",
        cell: (o) => (
          <div className="flex items-end gap-1" aria-label="Criterion ratings">
            {o.score.breakdown.map((b) => (
              <div key={b.key} title={`${b.label}: ${b.rating ?? "not rated"}/5`} className="flex w-5 flex-col items-center gap-0.5">
                <div className="flex h-7 w-2.5 items-end overflow-hidden rounded-sm bg-ivory-deep">
                  <div className="w-full bg-wine" style={{ height: `${((b.rating ?? 0) / 5) * 100}%` }} />
                </div>
                <span className="text-[9px] text-faint uppercase">{b.label[0]}</span>
              </div>
            ))}
          </div>
        ),
      },
      ...CRITERION_LIST.map<Column<Row>>((def) => ({
        id: def.key,
        header: def.label.split(" ")[0],
        hideBelow: "xl",
        align: "center",
        sortValue: (o) => o.criteria[def.key]?.rating ?? null,
        cell: (o) => <span className="num">{o.criteria[def.key]?.rating ?? "—"}</span>,
      })),
      { id: "updated", header: "Updated", hideBelow: "lg", sortValue: (o) => o.updatedAt, cell: (o) => <span className="text-xs text-faint">{relativeTime(o.updatedAt)}</span> },
    ],
    [db.niches, db.problems],
  );

  if (!ready) return <LoadingBlock />;

  const viewingScore = viewing ? scoreOpportunity(viewing) : null;
  const openNew = () => {
    setPrefill(undefined);
    setForm("new");
  };

  return (
    <>
      <PageHeader
        eyebrow="Decide"
        title="Opportunity Scoring"
        description="A transparent 0–100 score built from your own ratings and reasoning across five weighted criteria."
        actions={
          <>
            <Button icon={<ChevronDown size={15} className={showMethod ? "rotate-180" : ""} />} onClick={() => setShowMethod((s) => !s)}>
              How scoring works
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={openNew}>Score opportunity</Button>
          </>
        }
      />

      {(showMethod || items.length === 0) && (
        <Card className="mb-5 p-5">
          <h2 className="mb-3 font-display text-lg text-ink">Scoring method</h2>
          <Methodology />
        </Card>
      )}

      <Card>
        {items.length === 0 ? (
          <EmptyState
            icon={<Gauge size={20} />}
            title="No opportunities scored yet"
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={openNew}>Score your first opportunity</Button>}
          >
            Once you&apos;ve logged a few problems, competitors and keywords, score the most promising ones. Link a niche or problem
            and the relevant facts from your research appear next to each criterion.
          </EmptyState>
        ) : (
          <>
            <Toolbar count={rows.length} total={items.length}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search opportunities, reasoning…" />
              <FilterSelect label="Niche" value={niche} onChange={setNiche} options={[...db.niches.map((n) => ({ value: n.id, label: n.name })), { value: "none", label: "Not linked" }]} />
              <FilterSelect label="Band" value={band} onChange={setBand} options={(["strong", "moderate", "weak"] as const).map((b) => ({ value: b, label: BAND_LABEL[b] }))} />
              <FilterSelect label="Rated" value={completeness} onChange={setCompleteness} options={[{ value: "complete", label: "All 5 criteria" }, { value: "partial", label: "Partially" }]} />
              <ExportMenu
                onCsv={() =>
                  exportCsv("opportunity-scores", rows, [
                    { header: "Opportunity", value: (o) => o.title },
                    { header: "Niche", value: (o) => nicheName(o.nicheId) },
                    { header: "Problem", value: (o) => problemTitle(o.problemId) },
                    { header: "Total score (0-100)", value: (o) => o.score.total },
                    { header: "Band", value: (o) => BAND_LABEL[scoreBand(o.score.total)] },
                    { header: "Criteria rated", value: (o) => `${o.score.assessedCount}/5` },
                    ...CRITERION_LIST.flatMap((def) => [
                      { header: `${def.label} rating (0-5)`, value: (o: Row) => o.criteria[def.key]?.rating ?? "" },
                      { header: `${def.label} points (max ${def.weight * 100})`, value: (o: Row) => o.score.breakdown.find((b) => b.key === def.key)!.contribution.toFixed(1) },
                      { header: `${def.label} reasoning`, value: (o: Row) => o.criteria[def.key]?.reasoning ?? "" },
                    ]),
                    { header: "Notes", value: (o) => o.notes },
                    { header: "Updated", value: (o) => o.updatedAt },
                  ])
                }
                onJson={() => exportJson("opportunity-scores", rows.map(({ score, ...o }) => ({ ...o, computedScore: { total: score.total, complete: score.complete, breakdown: score.breakdown } })))}
              />
            </Toolbar>
            <DataTable
              rows={rows}
              columns={columns}
              getId={(o) => o.id}
              initialSort={{ id: "score", dir: "desc" }}
              onRowClick={(o) => setViewId(o.id)}
              actions={(o) => <RowActions label={o.title} onEdit={() => setForm(o)} onDelete={() => setDeleting(o)} />}
              empty={<EmptyState compact title="No opportunities match">Adjust your search or filters.</EmptyState>}
            />
          </>
        )}
      </Card>

      {viewing && viewingScore && (
        <DetailModal
          size="xl"
          title={viewing.title}
          record={viewing}
          onClose={() => setViewId(null)}
          onEdit={() => setForm(viewing)}
          onDelete={() => setDeleting(viewing)}
          extraActions={
            <Link href={`/ideas?opportunity=${viewing.id}`} className="inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm font-medium text-wine hover:bg-wine-soft">
              <Lightbulb size={15} /> Create product idea
            </Link>
          }
        >
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="space-y-5">
              <div className="flex flex-col items-center rounded-xl border border-line bg-ivory/50 p-5 text-center">
                <ScoreRing score={viewingScore.total} size={120} />
                <div className="mt-3"><ScorePill score={viewingScore.total} incomplete={!viewingScore.complete} /></div>
                <p className="mt-2 text-xs text-muted">{viewingScore.assessedCount} of 5 criteria rated</p>
              </div>
              <dl className="space-y-4">
                <Detail label="Niche">{nicheName(viewing.nicheId)}</Detail>
                <Detail label="Problem">
                  {viewing.problemId && problemTitle(viewing.problemId) && (
                    <Link href={`/problems?open=${viewing.problemId}`} className="text-wine hover:underline">{problemTitle(viewing.problemId)}</Link>
                  )}
                </Detail>
                <Detail label="Notes">{viewing.notes}</Detail>
              </dl>
            </div>
            <div>
              <ScoreTable result={viewingScore} />
              <p className="mt-3 text-xs text-faint">Points = rating ÷ 5 × 100 × weight. Ratings and reasoning are your own assessments.</p>
            </div>
          </div>
        </DetailModal>
      )}

      {form && (
        <OpportunityForm
          initial={form === "new" ? null : form}
          prefill={form === "new" ? prefill : undefined}
          db={db}
          onClose={() => setForm(null)}
          onSave={(d) => {
            if (form === "new") {
              const created = create(d);
              setViewId(created.id);
            } else update(form.id, d);
            setForm(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete opportunity?"
        message={
          deleting && (
            <>
              <strong className="text-ink">{deleting.title}</strong> and its ratings will be permanently deleted.
              {countReferences("opportunities", deleting.id) > 0 && ` ${countReferences("opportunities", deleting.id)} product idea(s) will lose their linked score.`}
            </>
          )
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove(deleting.id);
          setViewId(null);
        }}
      />
    </>
  );
}
