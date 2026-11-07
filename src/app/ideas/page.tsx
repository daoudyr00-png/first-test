"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Columns3, Lightbulb, Plus, Rows3 } from "lucide-react";
import { useCollection, useDatabase } from "@/hooks/useDatabase";
import { useCrudState } from "@/hooks/useCrudState";
import { useQueryParam } from "@/hooks/useOpenParam";
import { PageHeader, LoadingBlock } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, sortRows, type Column } from "@/components/ui/DataTable";
import { DetailModal, RowActions } from "@/components/ui/DetailModal";
import { Detail } from "@/components/ui/Panel";
import { ScorePill } from "@/components/ui/Score";
import { ExportMenu, FilterSelect, SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { IdeaForm, type IdeaDraft } from "@/components/ideas/IdeaForm";
import { DIFFICULTY_META, VALIDATION_META, options } from "@/lib/labels";
import { scoreOpportunity } from "@/lib/scoring";
import { exportCsv, exportJson } from "@/lib/export";
import { matches, relativeTime } from "@/lib/format";
import { PRODUCT_FORMATS, VALIDATION_STATUSES, type ProductIdea } from "@/lib/types";

type Row = ProductIdea & { score: number | null };
const VIEW_KEY = "pof:ui:ideas-view";

export default function IdeasPage() {
  const { db } = useDatabase();
  const { items, ready, create, update, remove } = useCollection("ideas");
  const { form, setForm, viewing, setViewId, deleting, setDeleting } = useCrudState(items, ready);
  const [oppParam, setOppParam] = useQueryParam("opportunity");
  const [prefill, setPrefill] = useState<Partial<IdeaDraft> | undefined>();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [view, setView] = useState<"table" | "board">("table");

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "board" || v === "table") setView(v);
    } catch {}
  }, []);
  const changeView = (v: "table" | "board") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  // Deep link from Opportunity Scoring: /ideas?opportunity=<id>
  useEffect(() => {
    if (!ready || !oppParam) return;
    const o = db.opportunities.find((x) => x.id === oppParam);
    if (o) {
      const p = o.problemId ? db.problems.find((x) => x.id === o.problemId) : null;
      setPrefill({ name: o.title, opportunityId: o.id, problemId: o.problemId, problemSolved: p?.title ?? "", targetCustomer: p?.audience ?? "" });
      setForm("new");
    }
    setOppParam(null);
  }, [ready, oppParam, db.opportunities, db.problems, setForm, setOppParam]);

  const oppScore = (id: string | null) => {
    const o = id ? db.opportunities.find((x) => x.id === id) : null;
    return o ? scoreOpportunity(o) : null;
  };
  const problemTitle = (id: string | null) => (id ? db.problems.find((n) => n.id === id)?.title ?? null : null);

  const rows: Row[] = useMemo(
    () =>
      items
        .map((i) => ({ ...i, score: oppScore(i.opportunityId)?.total ?? null }))
        .filter(
          (i) =>
            (!status || i.validationStatus === status) &&
            (!format || i.format === format) &&
            (!difficulty || i.difficulty === difficulty) &&
            matches(query, i.name, i.problemSolved, i.targetCustomer, i.solution, i.usp),
        ),
    [items, db.opportunities, status, format, difficulty, query],
  );

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        id: "name",
        header: "Product",
        sortValue: (i) => i.name,
        className: "min-w-[220px]",
        cell: (i) => (
          <div>
            <div className="font-medium text-ink">{i.name}</div>
            {i.targetCustomer && <div className="mt-0.5 line-clamp-1 text-xs text-muted">For {i.targetCustomer}</div>}
          </div>
        ),
      },
      { id: "score", header: "Score", sortValue: (i) => i.score, cell: (i) => (i.score === null ? <span className="text-xs text-faint">Not scored</span> : <ScorePill score={i.score} />) },
      { id: "status", header: "Status", sortValue: (i) => VALIDATION_STATUSES.indexOf(i.validationStatus), cell: (i) => <Badge tone={VALIDATION_META[i.validationStatus].tone} dot>{VALIDATION_META[i.validationStatus].label}</Badge> },
      { id: "format", header: "Format", hideBelow: "md", sortValue: (i) => i.format, cell: (i) => <span className="text-[13px]">{i.format}</span> },
      { id: "difficulty", header: "Difficulty", hideBelow: "lg", sortValue: (i) => ["low", "medium", "high"].indexOf(i.difficulty), cell: (i) => <Badge tone={DIFFICULTY_META[i.difficulty].tone}>{DIFFICULTY_META[i.difficulty].label}</Badge> },
      { id: "updated", header: "Updated", hideBelow: "xl", sortValue: (i) => i.updatedAt, cell: (i) => <span className="text-xs text-faint">{relativeTime(i.updatedAt)}</span> },
    ],
    [],
  );

  if (!ready) return <LoadingBlock />;

  const openNew = () => {
    setPrefill(undefined);
    setForm("new");
  };
  const viewingScore = viewing ? oppScore(viewing.opportunityId) : null;

  return (
    <>
      <PageHeader
        eyebrow="Decide"
        title="Product Ideas"
        description="Turn validated problems into concrete product concepts and track them from idea to launch."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={openNew}>New idea</Button>}
      />

      <Card>
        {items.length === 0 ? (
          <EmptyState
            icon={<Lightbulb size={20} />}
            title="No product ideas yet"
            action={
              <>
                <Button variant="primary" icon={<Plus size={16} />} onClick={openNew}>Add a product idea</Button>
                {db.opportunities.length > 0 && <Link href="/scoring" className="inline-flex h-9 items-center px-3 text-sm font-medium text-wine hover:underline">Start from a scored opportunity</Link>}
              </>
            }
          >
            Describe the product, who it&apos;s for, and why it beats what exists. Link it to a scored opportunity to carry its
            score across, then move it through validation.
          </EmptyState>
        ) : (
          <>
            <Toolbar count={rows.length} total={items.length}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search ideas…" />
              <FilterSelect label="Status" value={status} onChange={setStatus} options={options(VALIDATION_META)} />
              <FilterSelect label="Format" value={format} onChange={setFormat} options={PRODUCT_FORMATS.map((f) => ({ value: f, label: f }))} />
              <FilterSelect label="Difficulty" value={difficulty} onChange={setDifficulty} options={options(DIFFICULTY_META)} />
              <div className="inline-flex rounded-md border border-line bg-ivory p-0.5" role="group" aria-label="View">
                {([["table", Rows3, "Table"], ["board", Columns3, "Board"]] as const).map(([v, Icon, label]) => (
                  <button key={v} type="button" aria-pressed={view === v} onClick={() => changeView(v)} className={`inline-flex h-8 items-center gap-1.5 rounded-[5px] px-2.5 text-[13px] ${view === v ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              <ExportMenu
                onCsv={() =>
                  exportCsv("product-ideas", rows, [
                    { header: "Product name", value: (i) => i.name },
                    { header: "Customer problem solved", value: (i) => i.problemSolved },
                    { header: "Linked problem", value: (i) => problemTitle(i.problemId) },
                    { header: "Target customer", value: (i) => i.targetCustomer },
                    { header: "Proposed solution", value: (i) => i.solution },
                    { header: "Unique selling proposition", value: (i) => i.usp },
                    { header: "Product format", value: (i) => i.format },
                    { header: "Development difficulty", value: (i) => DIFFICULTY_META[i.difficulty].label },
                    { header: "Opportunity score", value: (i) => i.score },
                    { header: "Validation status", value: (i) => VALIDATION_META[i.validationStatus].label },
                    { header: "Created", value: (i) => i.createdAt },
                    { header: "Updated", value: (i) => i.updatedAt },
                  ])
                }
                onJson={() => exportJson("product-ideas", rows.map(({ score, ...i }) => ({ ...i, opportunityScore: score })))}
              />
            </Toolbar>

            {view === "table" ? (
              <DataTable
                rows={rows}
                columns={columns}
                getId={(i) => i.id}
                initialSort={{ id: "score", dir: "desc" }}
                onRowClick={(i) => setViewId(i.id)}
                actions={(i) => <RowActions label={i.name} onEdit={() => setForm(i)} onDelete={() => setDeleting(i)} />}
                empty={<EmptyState compact title="No ideas match">Adjust your search or filters.</EmptyState>}
              />
            ) : (
              <div className="overflow-x-auto p-4">
                <div className="grid min-w-[960px] grid-cols-6 gap-3">
                  {VALIDATION_STATUSES.map((s) => {
                    const col = sortRows(rows.filter((i) => i.validationStatus === s), columns, { id: "score", dir: "desc" });
                    return (
                      <section key={s} className="flex flex-col rounded-lg bg-ivory/80 p-2" aria-label={VALIDATION_META[s].label}>
                        <header className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: VALIDATION_META[s].color }} />
                          <span className="text-[12.5px] font-semibold text-ink-soft">{VALIDATION_META[s].label}</span>
                          <span className="num ml-auto text-xs text-faint">{col.length}</span>
                        </header>
                        <ul className="flex flex-col gap-2">
                          {col.map((i) => (
                            <li key={i.id} className="rounded-md border border-line bg-paper p-2.5 shadow-card">
                              <button type="button" onClick={() => setViewId(i.id)} className="block w-full text-left">
                                <span className="block text-[13px] leading-snug font-medium text-ink hover:text-wine">{i.name}</span>
                                <span className="mt-1 block text-[11px] text-faint">{i.format}</span>
                              </button>
                              <div className="mt-2 flex items-center justify-between gap-1">
                                {i.score === null ? <span className="text-[11px] text-faint">Not scored</span> : <span className="num font-display text-[15px] text-ink">{i.score}</span>}
                                <select
                                  aria-label={`Move ${i.name}`}
                                  value={i.validationStatus}
                                  onChange={(e) => update(i.id, { validationStatus: e.target.value as ProductIdea["validationStatus"] })}
                                  className="max-w-[96px] rounded border border-line bg-ivory px-1 py-0.5 text-[11px] text-ink-soft"
                                >
                                  {VALIDATION_STATUSES.map((v) => <option key={v} value={v}>{VALIDATION_META[v].label}</option>)}
                                </select>
                              </div>
                            </li>
                          ))}
                          {col.length === 0 && <li className="rounded-md border border-dashed border-line-strong/70 px-2 py-4 text-center text-[11px] text-faint">Empty</li>}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {viewing && (
        <DetailModal title={viewing.name} record={viewing} onClose={() => setViewId(null)} onEdit={() => setForm(viewing)} onDelete={() => setDeleting(viewing)}>
          <dl className="space-y-5">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Detail label="Status"><Badge tone={VALIDATION_META[viewing.validationStatus].tone} dot>{VALIDATION_META[viewing.validationStatus].label}</Badge></Detail>
              <Detail label="Opportunity score" empty="Not scored">
                {viewingScore && (
                  <Link href={`/scoring?open=${viewing.opportunityId}`} className="hover:opacity-80"><ScorePill score={viewingScore.total} incomplete={!viewingScore.complete} /></Link>
                )}
              </Detail>
              <Detail label="Format">{viewing.format}</Detail>
              <Detail label="Difficulty"><Badge tone={DIFFICULTY_META[viewing.difficulty].tone}>{DIFFICULTY_META[viewing.difficulty].label}</Badge></Detail>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Detail label="Customer problem solved">{viewing.problemSolved}</Detail>
              <Detail label="Target customer">{viewing.targetCustomer}</Detail>
            </div>
            {viewing.problemId && problemTitle(viewing.problemId) && (
              <Detail label="Linked problem">
                <Link href={`/problems?open=${viewing.problemId}`} className="text-wine hover:underline">{problemTitle(viewing.problemId)}</Link>
              </Detail>
            )}
            <Detail label="Proposed solution">{viewing.solution}</Detail>
            <div className="rounded-lg border border-wine-tint bg-wine-soft/50 p-4"><Detail label="Unique selling proposition">{viewing.usp}</Detail></div>
          </dl>
        </DetailModal>
      )}

      {form && (
        <IdeaForm
          initial={form === "new" ? null : form}
          prefill={form === "new" ? prefill : undefined}
          db={db}
          onClose={() => setForm(null)}
          onSave={(d) => {
            if (form === "new") create(d);
            else update(form.id, d);
            setForm(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete product idea?"
        message={deleting && <><strong className="text-ink">{deleting.name}</strong> will be permanently deleted. Its linked problem and score are not affected.</>}
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
