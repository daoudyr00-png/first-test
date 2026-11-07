"use client";

import { useMemo, useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { useCollection, useDatabase } from "@/hooks/useDatabase";
import { useCrudState } from "@/hooks/useCrudState";
import { PageHeader, LoadingBlock } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { DetailModal, RowActions } from "@/components/ui/DetailModal";
import { Detail } from "@/components/ui/Panel";
import { ExportMenu, FilterSelect, SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { KeywordForm } from "@/components/keywords/KeywordForm";
import { COMPETITION_META, INTENT_META, options } from "@/lib/labels";
import { exportCsv, exportJson } from "@/lib/export";
import { matches, relativeTime } from "@/lib/format";
import { COMPETITION_LEVELS, SEARCH_INTENTS, type Keyword } from "@/lib/types";

const COMPETITION_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, unknown: 3 };

export default function KeywordsPage() {
  const { db } = useDatabase();
  const { items, ready, create, update, remove } = useCollection("keywords");
  const { form, setForm, viewing, setViewId, deleting, setDeleting } = useCrudState(items, ready);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [intent, setIntent] = useState("");
  const [competition, setCompetition] = useState("");

  const nicheName = (id: string | null) => (id ? db.niches.find((n) => n.id === id)?.name ?? null : null);

  const rows = useMemo(
    () =>
      items.filter(
        (k) =>
          (!niche || (niche === "none" ? !k.nicheId : k.nicheId === niche)) &&
          (!intent || k.intent === intent) &&
          (!competition || k.competition === competition) &&
          matches(query, k.keyword, k.source, k.notes),
      ),
    [items, niche, intent, competition, query],
  );

  const columns: Column<Keyword>[] = useMemo(
    () => [
      { id: "keyword", header: "Keyword", sortValue: (k) => k.keyword, className: "min-w-[200px]", cell: (k) => <span className="font-medium text-ink">{k.keyword}</span> },
      { id: "intent", header: "Intent", sortValue: (k) => k.intent, cell: (k) => <span className="text-[13px]">{INTENT_META[k.intent].label}</span> },
      { id: "competition", header: "Competition", sortValue: (k) => COMPETITION_ORDER[k.competition], cell: (k) => <Badge tone={COMPETITION_META[k.competition].tone}>{COMPETITION_META[k.competition].label}</Badge> },
      { id: "source", header: "Source", hideBelow: "md", sortValue: (k) => k.source, cell: (k) => k.source || <span className="text-faint">—</span> },
      { id: "niche", header: "Niche", hideBelow: "lg", sortValue: (k) => nicheName(k.nicheId), cell: (k) => nicheName(k.nicheId) ?? <span className="text-faint">—</span> },
      { id: "notes", header: "Evidence notes", hideBelow: "xl", className: "max-w-[280px]", cell: (k) => (k.notes ? <span className="line-clamp-2 text-[13px]">{k.notes}</span> : <span className="text-faint">—</span>) },
      { id: "updated", header: "Updated", hideBelow: "xl", sortValue: (k) => k.updatedAt, cell: (k) => <span className="text-xs text-faint">{relativeTime(k.updatedAt)}</span> },
    ],
    [db.niches],
  );

  if (!ready) return <LoadingBlock />;

  const intentCounts = SEARCH_INTENTS.map((i) => ({ i, n: rows.filter((k) => k.intent === i).length }));
  const compCounts = COMPETITION_LEVELS.map((c) => ({ c, n: rows.filter((k) => k.competition === c).length }));

  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Keyword Research"
        description="Log the phrases buyers search for, their intent, and your own assessment of competition — with sources."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setForm("new")}>Add keyword</Button>}
      />

      {items.length > 0 && (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-paper px-4 py-3">
            <div className="mb-2 text-xs text-muted">By intent</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
              {intentCounts.map(({ i, n }) => (
                <span key={i} className="text-ink-soft">{INTENT_META[i].label} <span className="num font-medium text-ink">{n}</span></span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-paper px-4 py-3">
            <div className="mb-2 text-xs text-muted">By competition (your assessment)</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
              {compCounts.map(({ c, n }) => (
                <span key={c} className="text-ink-soft">{COMPETITION_META[c].label} <span className="num font-medium text-ink">{n}</span></span>
              ))}
            </div>
          </div>
        </div>
      )}

      <Card>
        {items.length === 0 ? (
          <EmptyState
            icon={<KeyRound size={20} />}
            title="No keywords yet"
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setForm("new")}>Add your first keyword</Button>}
          >
            Start typing a product idea into Etsy or Google search and note the autocomplete suggestions. For each, record the
            search intent, how crowded the results looked, and where you found it.
          </EmptyState>
        ) : (
          <>
            <Toolbar count={rows.length} total={items.length}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search keywords, sources…" />
              <FilterSelect label="Niche" value={niche} onChange={setNiche} options={[...db.niches.map((n) => ({ value: n.id, label: n.name })), { value: "none", label: "Not linked" }]} />
              <FilterSelect label="Intent" value={intent} onChange={setIntent} options={options(INTENT_META)} />
              <FilterSelect label="Competition" value={competition} onChange={setCompetition} options={options(COMPETITION_META)} />
              <ExportMenu
                onCsv={() =>
                  exportCsv("keywords", rows, [
                    { header: "Keyword", value: (k) => k.keyword },
                    { header: "Search intent", value: (k) => INTENT_META[k.intent].label },
                    { header: "Competition", value: (k) => COMPETITION_META[k.competition].label },
                    { header: "Source", value: (k) => k.source },
                    { header: "Niche", value: (k) => nicheName(k.nicheId) },
                    { header: "Evidence notes", value: (k) => k.notes },
                    { header: "Created", value: (k) => k.createdAt },
                    { header: "Updated", value: (k) => k.updatedAt },
                  ])
                }
                onJson={() => exportJson("keywords", rows)}
              />
            </Toolbar>
            <DataTable
              rows={rows}
              columns={columns}
              getId={(k) => k.id}
              initialSort={{ id: "keyword", dir: "asc" }}
              onRowClick={(k) => setViewId(k.id)}
              actions={(k) => <RowActions label={k.keyword} onEdit={() => setForm(k)} onDelete={() => setDeleting(k)} />}
              empty={<EmptyState compact title="No keywords match">Adjust your search or filters.</EmptyState>}
            />
          </>
        )}
      </Card>

      {viewing && (
        <DetailModal size="md" title={viewing.keyword} record={viewing} onClose={() => setViewId(null)} onEdit={() => setForm(viewing)} onDelete={() => setDeleting(viewing)}>
          <dl className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Detail label="Search intent">{INTENT_META[viewing.intent].label}</Detail>
              <Detail label="Competition"><Badge tone={COMPETITION_META[viewing.competition].tone}>{COMPETITION_META[viewing.competition].label}</Badge></Detail>
              <Detail label="Source">{viewing.source}</Detail>
              <Detail label="Niche">{nicheName(viewing.nicheId)}</Detail>
            </div>
            <Detail label="Evidence notes">{viewing.notes}</Detail>
          </dl>
        </DetailModal>
      )}

      {form && (
        <KeywordForm
          initial={form === "new" ? null : form}
          niches={db.niches}
          existing={items}
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
        title="Delete keyword?"
        message={deleting && <>“<strong className="text-ink">{deleting.keyword}</strong>” will be permanently deleted.</>}
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
