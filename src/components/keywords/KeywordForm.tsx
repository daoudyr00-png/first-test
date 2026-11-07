"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, SelectField, TextArea, TextField } from "@/components/ui/fields";
import { LinkSelect } from "@/components/ui/LinkSelect";
import { COMPETITION_META, INTENT_META, options } from "@/lib/labels";
import type { CompetitionLevel, Keyword, NewRecord, Niche, SearchIntent } from "@/lib/types";

export type KeywordDraft = NewRecord<Keyword>;

/** Sources people commonly use — purely suggestions for the free-text field. */
const SOURCE_SUGGESTIONS = [
  "Etsy search autocomplete",
  "Etsy search results page",
  "Google autocomplete",
  "Google Trends",
  "Pinterest search",
  "eRank",
  "Marmalead",
  "EverBee",
  "Reddit",
];

export function KeywordForm({
  initial,
  niches,
  existing,
  onSave,
  onClose,
}: {
  initial: Keyword | null;
  niches: Niche[];
  existing: Keyword[];
  onSave: (d: KeywordDraft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<KeywordDraft>(
    initial
      ? { keyword: initial.keyword, nicheId: initial.nicheId, intent: initial.intent, competition: initial.competition, source: initial.source, notes: initial.notes }
      : { keyword: "", nicheId: null, intent: "transactional", competition: "unknown", source: "", notes: "" },
  );
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof KeywordDraft>(k: K, v: KeywordDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const sourceId = useId();
  const listId = useId();

  const normalized = d.keyword.trim().toLowerCase();
  const duplicate = existing.find((k) => k.id !== initial?.id && k.keyword.trim().toLowerCase() === normalized && k.nicheId === d.nicheId);
  const keywordError = touched && !normalized ? "Enter a keyword or phrase" : duplicate ? "This keyword is already logged for this niche" : undefined;

  const submit = () => {
    setTouched(true);
    if (!normalized || duplicate) return;
    onSave({ ...d, keyword: d.keyword.trim(), source: d.source.trim(), notes: d.notes.trim() });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "Edit keyword" : "Add keyword"}
      description="A search phrase buyers use. Record where you found it and your own read of the competition."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{initial ? "Save changes" : "Save keyword"}</Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <TextField label="Keyword" required value={d.keyword} onChange={(v) => set("keyword", v)} error={keywordError} placeholder="e.g. homeschool planner printable" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField<SearchIntent> label="Search intent" value={d.intent} onChange={(v) => set("intent", v)} options={options(INTENT_META)} hint={INTENT_META[d.intent].hint} />
          <SelectField<CompetitionLevel> label="Competition (your assessment)" value={d.competition} onChange={(v) => set("competition", v)} options={options(COMPETITION_META)} hint="Based on what you saw, e.g. number and quality of results." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Source" htmlFor={sourceId} hint="Where you found or checked this keyword">
            <input id={sourceId} list={listId} className="field-input" value={d.source} onChange={(e) => set("source", e.target.value)} placeholder="e.g. Etsy search autocomplete" />
            <datalist id={listId}>{SOURCE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <LinkSelect label="Niche" value={d.nicheId} onChange={(v) => set("nicheId", v)} options={niches.map((n) => ({ id: n.id, label: n.name }))} />
        </div>
        <TextArea
          label="Evidence notes"
          rows={4}
          value={d.notes}
          onChange={(v) => set("notes", v)}
          placeholder="What you observed — e.g. result count shown, whether top results are relevant, any tool metrics you looked up (and from which tool)."
          hint="If you record numbers from a tool, note which tool and when — they change over time."
        />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
