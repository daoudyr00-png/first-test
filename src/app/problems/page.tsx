"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Gauge, Link2, Plus, Target } from "lucide-react";
import { useCollection, useDatabase } from "@/hooks/useDatabase";
import { useCrudState } from "@/hooks/useCrudState";
import { PageHeader, LoadingBlock } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { DetailModal, RowActions, UrlList } from "@/components/ui/DetailModal";
import { Detail } from "@/components/ui/Panel";
import { Dots } from "@/components/ui/Score";
import { ExportMenu, FilterSelect, SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { ProblemForm } from "@/components/problems/ProblemForm";
import { countReferences } from "@/lib/store";
import { exportCsv, exportJson } from "@/lib/export";
import { matches, relativeTime } from "@/lib/format";
import type { Problem } from "@/lib/types";

export default function ProblemsPage() {
  const { db } = useDatabase();
  const { items, ready, create, update, remove } = useCollection("problems");
  const { form, setForm, viewing, setViewId, deleting, setDeleting } = useCrudState(items, ready);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [minPain, setMinPain] = useState("");
  const [sourced, setSourced] = useState("");

  const nicheName = (id: string | null) => (id ? db.niches.find((n) => n.id === id)?.name ?? null : null);

  const rows = useMemo(
    () =>
      items.filter(
        (p) =>
          (!niche || (niche === "none" ? !p.nicheId : p.nicheId === niche)) &&
          (!minPain || p.pain >= Number(minPain)) &&
          (!sourced || (sourced === "yes" ? p.sourceUrls.length > 0 : p.sourceUrls.length === 0)) &&
          matches(query, p.title, p.audience, p.description, p.evidence),
      ),
    [items, niche, minPain, sourced, query],
  );

  const columns: Column<Problem>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Problem",
        sortValue: (p) => p.title,
        className: "min-w-[220px]",
        cell: (p) => (
          <div>
            <div className="font-medium text-ink">{p.title}</div>
            {p.audience && <div className="mt-0.5 text-xs text-muted">{p.audience}</div>}
          </div>
        ),
      },
      {
        id: "niche",
        header: "Niche",
        hideBelow: "lg",
        sortValue: (p) => nicheName(p.nicheId),
        cell: (p) => (nicheName(p.nicheId) ? <Badge>{nicheName(p.nicheId)}</Badge> : <span className="text-faint">—</span>),
      },
      { id: "pain", header: "Pain", sortValue: (p) => p.pain, cell: (p) => <Dots value={p.pain} label="Pain" /> },
      { id: "freq", header: "Frequency", hideBelow: "md", sortValue: (p) => p.frequency, cell: (p) => <Dots value={p.frequency} label="Frequency" /> },
      { id: "wtp", header: "Will pay", hideBelow: "sm", sortValue: (p) => p.willingnessToPay, cell: (p) => <Dots value={p.willingnessToPay} label="Willingness to pay" /> },
      {
        id: "sources",
        header: "Sources",
        hideBelow: "md",
        align: "center",
        sortValue: (p) => p.sourceUrls.length,
        cell: (p) =>
          p.sourceUrls.length ? (
            <span className="num inline-flex items-center gap-1 text-ink-soft"><Link2 size={12} className="text-faint" />{p.sourceUrls.length}</span>
          ) : (
            <span className="text-xs text-[#a45a12]" title="No source URLs — consider adding evidence">none</span>
          ),
      },
      { id: "updated", header: "Updated", hideBelow: "xl", sortValue: (p) => p.updatedAt, cell: (p) => <span className="text-xs text-faint">{relativeTime(p.updatedAt)}</span> },
    ],
    [db.niches],
  );

  if (!ready) return <LoadingBlock />;

  const filtersActive = !!(query || niche || minPain || sourced);

  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Problem Discovery"
        description="Capture real customer problems with your ratings and the evidence behind them."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setForm("new")}>Log problem</Button>}
      />

      <Card>
        {items.length === 0 ? (
          <EmptyState
            icon={<Target size={20} />}
            title="No problems logged yet"
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setForm("new")}>Log your first problem</Button>}
          >
            Look for recurring complaints in product reviews, Reddit threads, Facebook groups and Q&amp;A sites. Log each one with
            how painful, frequent and pay-worthy it seems — and link to where you found it.
          </EmptyState>
        ) : (
          <>
            <Toolbar count={rows.length} total={items.length}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search problems, evidence…" />
              <FilterSelect label="Niche" value={niche} onChange={setNiche} options={[...db.niches.map((n) => ({ value: n.id, label: n.name })), { value: "none", label: "Not linked" }]} />
              <FilterSelect label="Pain" value={minPain} onChange={setMinPain} options={[5, 4, 3, 2].map((n) => ({ value: String(n), label: n === 5 ? "5 only" : `${n}+` }))} />
              <FilterSelect label="Sources" value={sourced} onChange={setSourced} options={[{ value: "yes", label: "Has URLs" }, { value: "no", label: "Missing URLs" }]} />
              <ExportMenu
                onCsv={() =>
                  exportCsv("problems", rows, [
                    { header: "Title", value: (p) => p.title },
                    { header: "Niche", value: (p) => nicheName(p.nicheId) },
                    { header: "Target audience", value: (p) => p.audience },
                    { header: "Description", value: (p) => p.description },
                    { header: "Pain (1-5)", value: (p) => p.pain },
                    { header: "Frequency (1-5)", value: (p) => p.frequency },
                    { header: "Willingness to pay (1-5)", value: (p) => p.willingnessToPay },
                    { header: "Evidence", value: (p) => p.evidence },
                    { header: "Source URLs", value: (p) => p.sourceUrls },
                    { header: "Created", value: (p) => p.createdAt },
                    { header: "Updated", value: (p) => p.updatedAt },
                  ])
                }
                onJson={() => exportJson("problems", rows)}
              />
            </Toolbar>
            <DataTable
              rows={rows}
              columns={columns}
              getId={(p) => p.id}
              initialSort={{ id: "updated", dir: "desc" }}
              onRowClick={(p) => setViewId(p.id)}
              actions={(p) => <RowActions label={p.title} onEdit={() => setForm(p)} onDelete={() => setDeleting(p)} />}
              empty={
                <EmptyState compact title="No problems match" action={filtersActive && <Button size="sm" onClick={() => { setQuery(""); setNiche(""); setMinPain(""); setSourced(""); }}>Clear filters</Button>}>
                  Adjust your search or filters.
                </EmptyState>
              }
            />
          </>
        )}
      </Card>

      {viewing && (
        <DetailModal
          title={viewing.title}
          record={viewing}
          onClose={() => setViewId(null)}
          onEdit={() => setForm(viewing)}
          onDelete={() => setDeleting(viewing)}
          extraActions={
            <Link href={`/scoring?problem=${viewing.id}`} className="inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm font-medium text-wine hover:bg-wine-soft">
              <Gauge size={15} /> Score this problem
            </Link>
          }
        >
          <dl className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {([
                ["Pain", viewing.pain],
                ["Frequency", viewing.frequency],
                ["Willingness to pay", viewing.willingnessToPay],
              ] as const).map(([label, v]) => (
                <div key={label} className="rounded-lg border border-line bg-ivory/60 px-3 py-3">
                  <div className="text-[11px] font-semibold tracking-[0.08em] text-faint uppercase">{label}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="num font-display text-xl text-ink">{v}</span>
                    <span className="text-xs text-faint">/ 5</span>
                  </div>
                  <div className="mt-1"><Dots value={v} /></div>
                </div>
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Detail label="Niche">{nicheName(viewing.nicheId)}</Detail>
              <Detail label="Target audience">{viewing.audience}</Detail>
            </div>
            <Detail label="Description">{viewing.description}</Detail>
            <Detail label="Evidence" empty="No evidence written up yet">{viewing.evidence}</Detail>
            <Detail label="Source URLs" empty="No sources linked">{viewing.sourceUrls.length > 0 && <UrlList urls={viewing.sourceUrls} />}</Detail>
          </dl>
        </DetailModal>
      )}

      {form && (
        <ProblemForm
          initial={form === "new" ? null : form}
          niches={db.niches}
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
        title="Delete problem?"
        message={
          deleting && (
            <>
              <strong className="text-ink">{deleting.title}</strong> will be permanently deleted.
              {countReferences("problems", deleting.id) > 0 && ` ${countReferences("problems", deleting.id)} linked opportunity/idea record(s) will be kept but unlinked.`}
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
