"use client";

import { useEffect, useMemo, useState } from "react";
import { Compass, Eye, Plus } from "lucide-react";
import { useCollection, useDatabase } from "@/hooks/useDatabase";
import { useOpenParam } from "@/hooks/useOpenParam";
import { PageHeader, LoadingBlock } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExportMenu, FilterSelect, SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { SortSelect } from "@/components/ui/SortSelect";
import { NicheForm } from "@/components/niches/NicheForm";
import { NicheDetail } from "@/components/niches/NicheDetail";
import { NICHE_STATUS_META, options } from "@/lib/labels";
import { countReferences } from "@/lib/store";
import { exportCsv, exportJson } from "@/lib/export";
import { matches, relativeTime } from "@/lib/format";
import type { Niche } from "@/lib/types";

const SORTS = [
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name A–Z" },
  { value: "observations", label: "Most observations" },
  { value: "created", label: "Newest first" },
];

export default function NichesPage() {
  const { db } = useDatabase();
  const { items, ready, create, update, remove } = useCollection("niches");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("updated");
  const [form, setForm] = useState<Niche | "new" | null>(null);
  const [viewId, setViewId] = useOpenParam();
  const [deleting, setDeleting] = useState<Niche | null>(null);

  const viewing = items.find((n) => n.id === viewId) ?? null;
  useEffect(() => {
    if (ready && viewId && !viewing) setViewId(null);
  }, [ready, viewId, viewing, setViewId]);

  const rows = useMemo(() => {
    const filtered = items.filter(
      (n) =>
        (!status || n.status === status) &&
        matches(query, n.name, n.description, n.subNiches, n.audiences, n.observations.map((o) => o.note)),
    );
    const sorters: Record<string, (a: Niche, b: Niche) => number> = {
      updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      created: (a, b) => b.createdAt.localeCompare(a.createdAt),
      name: (a, b) => a.name.localeCompare(b.name),
      observations: (a, b) => b.observations.length - a.observations.length,
    };
    return [...filtered].sort(sorters[sort]);
  }, [items, query, status, sort]);

  const linkedCount = (id: string) =>
    db.problems.filter((p) => p.nicheId === id).length +
    db.competitors.filter((p) => p.nicheId === id).length +
    db.keywords.filter((p) => p.nicheId === id).length;

  if (!ready) return <LoadingBlock />;

  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Niche Explorer"
        description="Map the markets you're investigating: sub-niches, who buys, and what you've observed first-hand."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setForm("new")}>New niche</Button>}
      />

      <Card>
        {items.length === 0 ? (
          <EmptyState
            icon={<Compass size={20} />}
            title="No niches yet"
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setForm("new")}>Create your first niche</Button>}
          >
            A niche is a market you want to research — for example “budget wedding planning” or “ADHD adult productivity”. Add
            sub-niches and audiences, then record observations with sources as you browse.
          </EmptyState>
        ) : (
          <>
            <Toolbar count={rows.length} total={items.length}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search niches, audiences, notes…" />
              <FilterSelect label="Status" value={status} onChange={setStatus} options={options(NICHE_STATUS_META)} />
              <SortSelect value={sort} onChange={setSort} options={SORTS} />
              <ExportMenu
                onCsv={() =>
                  exportCsv("niches", rows, [
                    { header: "Name", value: (n) => n.name },
                    { header: "Status", value: (n) => NICHE_STATUS_META[n.status].label },
                    { header: "Description", value: (n) => n.description },
                    { header: "Sub-niches", value: (n) => n.subNiches },
                    { header: "Target audiences", value: (n) => n.audiences },
                    { header: "Observations", value: (n) => n.observations.map((o) => `[${o.date}] ${o.note}${o.sourceUrl ? ` (${o.sourceUrl})` : ""}`).join(" | ") },
                    { header: "Created", value: (n) => n.createdAt },
                    { header: "Updated", value: (n) => n.updatedAt },
                  ])
                }
                onJson={() => exportJson("niches", rows)}
              />
            </Toolbar>
            {rows.length === 0 ? (
              <EmptyState compact title="No niches match" action={<Button size="sm" onClick={() => { setQuery(""); setStatus(""); }}>Clear filters</Button>}>
                Try a different search term or status.
              </EmptyState>
            ) : (
              <ul className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setViewId(n.id)}
                      className="group flex h-full w-full flex-col rounded-lg border border-line bg-paper p-4 text-left transition-all hover:-translate-y-px hover:border-line-strong hover:shadow-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-[17px] leading-snug text-ink group-hover:text-wine">{n.name}</h3>
                        <Badge tone={NICHE_STATUS_META[n.status].tone} dot>{NICHE_STATUS_META[n.status].label}</Badge>
                      </div>
                      {n.description ? (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{n.description}</p>
                      ) : (
                        <p className="mt-1.5 text-[13px] text-faint italic">No description</p>
                      )}
                      {n.subNiches.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {n.subNiches.slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
                          {n.subNiches.length > 3 && <span className="self-center text-xs text-faint">+{n.subNiches.length - 3}</span>}
                        </div>
                      )}
                      <div className="mt-auto flex items-center gap-4 border-t border-line/70 pt-3 text-xs text-faint [&:not(:first-child)]:mt-4">
                        <span className="inline-flex items-center gap-1"><Eye size={12} /> <span className="num">{n.observations.length}</span> obs.</span>
                        <span><span className="num">{n.audiences.length}</span> audiences</span>
                        <span><span className="num">{linkedCount(n.id)}</span> linked</span>
                        <span className="ml-auto">{relativeTime(n.updatedAt)}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card>

      {viewing && (
        <NicheDetail
          niche={viewing}
          db={db}
          onClose={() => setViewId(null)}
          onEdit={() => setForm(viewing)}
          onDelete={() => setDeleting(viewing)}
          onObservationsChange={(observations) => update(viewing.id, { observations })}
        />
      )}

      {form && (
        <NicheForm
          initial={form === "new" ? null : form}
          onClose={() => setForm(null)}
          onSave={(draft) => {
            if (form === "new") {
              const created = create({ ...draft, observations: [] });
              setViewId(created.id);
            } else {
              update(form.id, draft);
            }
            setForm(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete niche?"
        message={
          deleting && (
            <>
              <strong className="text-ink">{deleting.name}</strong> and its {deleting.observations.length} observation(s) will be
              permanently deleted.
              {countReferences("niches", deleting.id) > 0 &&
                ` ${countReferences("niches", deleting.id)} linked record(s) will be kept but unlinked from this niche.`}
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
