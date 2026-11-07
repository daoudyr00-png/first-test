"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Detail } from "@/components/ui/Panel";
import { TextArea, TextField } from "@/components/ui/fields";
import { NICHE_STATUS_META } from "@/lib/labels";
import { formatDate, hostname, isValidUrl } from "@/lib/format";
import { uid } from "@/lib/store";
import type { Database, Niche, Observation } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

function ObservationEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Observation;
  onSave: (o: Observation) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState(initial?.note ?? "");
  const [url, setUrl] = useState(initial?.sourceUrl ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [touched, setTouched] = useState(false);
  const urlError = url.trim() && !isValidUrl(url.trim()) ? "Enter a full URL (https://…)" : undefined;
  const noteError = touched && !note.trim() ? "Describe what you observed" : undefined;

  return (
    <div className="space-y-3 rounded-lg border border-wine-tint bg-wine-soft/40 p-4">
      <TextArea label="Observation" required rows={3} value={note} onChange={setNote} error={noteError} placeholder="What did you see? e.g. “Several top listings have reviews complaining the planner isn’t undated.”" />
      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <TextField label="Source URL" value={url} onChange={setUrl} placeholder="https://" error={urlError} />
        <TextField label="Date observed" type="date" value={date} onChange={setDate} />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setTouched(true);
            if (!note.trim() || urlError) return;
            onSave({ id: initial?.id ?? uid(), note: note.trim(), sourceUrl: url.trim(), date: date || today() });
          }}
        >
          {initial ? "Save observation" : "Add observation"}
        </Button>
      </div>
    </div>
  );
}

export function NicheDetail({
  niche,
  db,
  onClose,
  onEdit,
  onDelete,
  onObservationsChange,
}: {
  niche: Niche;
  db: Database;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onObservationsChange: (obs: Observation[]) => void;
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const linked = [
    { label: "Problems", n: db.problems.filter((p) => p.nicheId === niche.id).length, href: "/problems" },
    { label: "Competitors", n: db.competitors.filter((p) => p.nicheId === niche.id).length, href: "/competitors" },
    { label: "Keywords", n: db.keywords.filter((p) => p.nicheId === niche.id).length, href: "/keywords" },
    { label: "Scored", n: db.opportunities.filter((p) => p.nicheId === niche.id).length, href: "/scoring" },
  ];
  const observations = [...niche.observations].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={niche.name}
      description={`Added ${formatDate(niche.createdAt)} · Updated ${formatDate(niche.updatedAt)}`}
      footer={
        <>
          <Button variant="ghost" icon={<Trash2 size={15} />} onClick={onDelete} className="mr-auto text-[#8f1d1d] hover:bg-[#fbeaea] hover:text-[#8f1d1d]">
            Delete
          </Button>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" icon={<Pencil size={14} />} onClick={onEdit}>Edit niche</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={NICHE_STATUS_META[niche.status].tone} dot>{NICHE_STATUS_META[niche.status].label}</Badge>
        </div>

        <dl className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Detail label="Description">{niche.description}</Detail></div>
          <Detail label="Sub-niches" empty="None added">
            {niche.subNiches.length > 0 && (
              <span className="flex flex-wrap gap-1.5">{niche.subNiches.map((s) => <Badge key={s}>{s}</Badge>)}</span>
            )}
          </Detail>
          <Detail label="Target audiences" empty="None added">
            {niche.audiences.length > 0 && (
              <span className="flex flex-wrap gap-1.5">{niche.audiences.map((s) => <Badge key={s} tone="wine">{s}</Badge>)}</span>
            )}
          </Detail>
        </dl>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {linked.map((l) => (
            <Link key={l.label} href={l.href} className="rounded-lg border border-line bg-ivory/60 px-3 py-2.5 hover:border-line-strong">
              <div className="num font-display text-xl text-ink">{l.n}</div>
              <div className="text-xs text-muted">{l.label} linked</div>
            </Link>
          ))}
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">
              Market observations <span className="num ml-1 font-normal text-faint">{niche.observations.length}</span>
            </h3>
            {editing !== "new" && (
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing("new")}>Add observation</Button>
            )}
          </div>

          {editing === "new" && (
            <div className="mb-3">
              <ObservationEditor
                onCancel={() => setEditing(null)}
                onSave={(o) => {
                  onObservationsChange([o, ...niche.observations]);
                  setEditing(null);
                }}
              />
            </div>
          )}

          {observations.length === 0 && editing !== "new" ? (
            <div className="rounded-lg border border-dashed border-line-strong px-5 py-8 text-center text-[13px] text-muted">
              No observations yet. Record what you see while browsing listings, reviews, forums or social posts — with a link so you can find it again.
            </div>
          ) : (
            <ol className="relative space-y-3 border-l border-line pl-5">
              {observations.map((o) =>
                editing === o.id ? (
                  <li key={o.id}>
                    <ObservationEditor
                      initial={o}
                      onCancel={() => setEditing(null)}
                      onSave={(next) => {
                        onObservationsChange(niche.observations.map((x) => (x.id === o.id ? next : x)));
                        setEditing(null);
                      }}
                    />
                  </li>
                ) : (
                  <li key={o.id} className="group relative">
                    <span className="absolute top-1.5 -left-[25px] h-2 w-2 rounded-full border-2 border-paper bg-wine" />
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-faint">{formatDate(o.date + "T12:00:00")}</p>
                        <p className="mt-0.5 text-[14px] leading-relaxed whitespace-pre-wrap text-ink-soft">{o.note}</p>
                        {o.sourceUrl && (
                          <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-wine hover:underline">
                            {hostname(o.sourceUrl)} <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                        <IconButton label="Edit observation" onClick={() => setEditing(o.id)}><Pencil size={14} /></IconButton>
                        <IconButton label="Delete observation" tone="danger" onClick={() => onObservationsChange(niche.observations.filter((x) => x.id !== o.id))}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                ),
              )}
            </ol>
          )}
        </section>
      </div>
    </Modal>
  );
}
