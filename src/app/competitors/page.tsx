"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus, Swords } from "lucide-react";
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
import { CompetitorForm } from "@/components/competitors/CompetitorForm";
import { exportCsv, exportJson } from "@/lib/export";
import { formatPrice, hostname, matches } from "@/lib/format";
import { PRODUCT_FORMATS, type Competitor } from "@/lib/types";

export default function CompetitorsPage() {
  const { db } = useDatabase();
  const { items, ready, create, update, remove } = useCollection("competitors");
  const { form, setForm, viewing, setViewId, deleting, setDeleting } = useCrudState(items, ready);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [type, setType] = useState("");

  const nicheName = (id: string | null) => (id ? db.niches.find((n) => n.id === id)?.name ?? null : null);

  const rows = useMemo(
    () =>
      items.filter(
        (c) =>
          (!niche || (niche === "none" ? !c.nicheId : c.nicheId === niche)) &&
          (!type || c.productType === type) &&
          matches(query, c.competitorName, c.productName, c.strengths, c.weaknesses, c.differentiation),
      ),
    [items, niche, type, query],
  );

  const prices = rows.map((r) => r.price).filter((p): p is number => p !== null).sort((a, b) => a - b);
  const priceSummary = prices.length
    ? { min: prices[0], max: prices[prices.length - 1], median: prices.length % 2 ? prices[(prices.length - 1) / 2] : (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2 }
    : null;

  const columns: Column<Competitor>[] = useMemo(
    () => [
      {
        id: "product",
        header: "Product",
        sortValue: (c) => c.productName,
        className: "min-w-[220px]",
        cell: (c) => (
          <div>
            <div className="font-medium text-ink">{c.productName}</div>
            <div className="mt-0.5 text-xs text-muted">{c.competitorName}</div>
          </div>
        ),
      },
      { id: "price", header: "Price", align: "right", sortValue: (c) => c.price, cell: (c) => <span className="num text-ink">{formatPrice(c.price)}</span> },
      { id: "type", header: "Type", hideBelow: "md", sortValue: (c) => c.productType, cell: (c) => <Badge>{c.productType}</Badge> },
      { id: "niche", header: "Niche", hideBelow: "xl", sortValue: (c) => nicheName(c.nicheId), cell: (c) => nicheName(c.nicheId) ?? <span className="text-faint">—</span> },
      {
        id: "gap",
        header: "Differentiation opportunity",
        hideBelow: "lg",
        className: "max-w-[320px]",
        cell: (c) => (c.differentiation ? <span className="line-clamp-2 text-[13px]">{c.differentiation}</span> : <span className="text-faint">—</span>),
      },
      {
        id: "url",
        header: "Evidence",
        hideBelow: "sm",
        cell: (c) =>
          c.evidenceUrl ? (
            <a href={c.evidenceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-wine hover:underline">
              {hostname(c.evidenceUrl)} <ExternalLink size={11} />
            </a>
          ) : (
            <span className="text-xs text-faint">—</span>
          ),
      },
    ],
    [db.niches],
  );

  if (!ready) return <LoadingBlock />;

  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Competitor Research"
        description="Document existing products, what they do well, where they fall short, and how you could differentiate."
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setForm("new")}>Add competitor</Button>}
      />

      {items.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Products logged", String(rows.length)],
            ["Lowest price", priceSummary ? formatPrice(priceSummary.min) : "—"],
            ["Median price", priceSummary ? formatPrice(priceSummary.median) : "—"],
            ["Highest price", priceSummary ? formatPrice(priceSummary.max) : "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-paper px-4 py-3">
              <div className="text-xs text-muted">{label}</div>
              <div className="num mt-1 font-display text-xl text-ink">{value}</div>
            </div>
          ))}
        </div>
      )}

      <Card>
        {items.length === 0 ? (
          <EmptyState
            icon={<Swords size={20} />}
            title="No competitors recorded"
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setForm("new")}>Add your first competitor</Button>}
          >
            Search Etsy (or wherever your buyers shop) for products that solve the problem you&apos;re researching. Record the
            price, what reviewers praise and complain about, and a link to the listing.
          </EmptyState>
        ) : (
          <>
            <Toolbar count={rows.length} total={items.length}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search products, notes…" />
              <FilterSelect label="Niche" value={niche} onChange={setNiche} options={[...db.niches.map((n) => ({ value: n.id, label: n.name })), { value: "none", label: "Not linked" }]} />
              <FilterSelect label="Type" value={type} onChange={setType} options={PRODUCT_FORMATS.map((f) => ({ value: f, label: f }))} />
              <ExportMenu
                onCsv={() =>
                  exportCsv("competitors", rows, [
                    { header: "Competitor", value: (c) => c.competitorName },
                    { header: "Product", value: (c) => c.productName },
                    { header: "Price (USD)", value: (c) => c.price },
                    { header: "Product type", value: (c) => c.productType },
                    { header: "Niche", value: (c) => nicheName(c.nicheId) },
                    { header: "Strengths", value: (c) => c.strengths },
                    { header: "Weaknesses", value: (c) => c.weaknesses },
                    { header: "Differentiation opportunities", value: (c) => c.differentiation },
                    { header: "Evidence URL", value: (c) => c.evidenceUrl },
                    { header: "Created", value: (c) => c.createdAt },
                    { header: "Updated", value: (c) => c.updatedAt },
                  ])
                }
                onJson={() => exportJson("competitors", rows)}
              />
            </Toolbar>
            <DataTable
              rows={rows}
              columns={columns}
              getId={(c) => c.id}
              initialSort={{ id: "product", dir: "asc" }}
              onRowClick={(c) => setViewId(c.id)}
              actions={(c) => <RowActions label={c.productName} onEdit={() => setForm(c)} onDelete={() => setDeleting(c)} />}
              empty={<EmptyState compact title="No competitors match">Adjust your search or filters.</EmptyState>}
            />
          </>
        )}
      </Card>

      {viewing && (
        <DetailModal title={viewing.productName} record={viewing} onClose={() => setViewId(null)} onEdit={() => setForm(viewing)} onDelete={() => setDeleting(viewing)}>
          <dl className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-4">
              <Detail label="Competitor">{viewing.competitorName}</Detail>
              <Detail label="Price">{viewing.price !== null ? formatPrice(viewing.price) : ""}</Detail>
              <Detail label="Type">{viewing.productType}</Detail>
              <Detail label="Niche">{nicheName(viewing.nicheId)}</Detail>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-lg border border-[#d3e0d0] bg-sage-soft/50 p-4"><Detail label="Strengths">{viewing.strengths}</Detail></div>
              <div className="rounded-lg border border-[#f1cccc] bg-[#fbeaea]/50 p-4"><Detail label="Weaknesses">{viewing.weaknesses}</Detail></div>
            </div>
            <div className="rounded-lg border border-wine-tint bg-wine-soft/50 p-4"><Detail label="Differentiation opportunities">{viewing.differentiation}</Detail></div>
            <Detail label="Evidence URL">
              {viewing.evidenceUrl && (
                <a href={viewing.evidenceUrl} target="_blank" rel="noopener noreferrer" className="break-all text-wine hover:underline">{viewing.evidenceUrl}</a>
              )}
            </Detail>
          </dl>
        </DetailModal>
      )}

      {form && (
        <CompetitorForm
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
        title="Delete competitor?"
        message={deleting && <><strong className="text-ink">{deleting.productName}</strong> by {deleting.competitorName} will be permanently deleted.</>}
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
