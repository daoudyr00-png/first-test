"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, ListInput, RatingInput, TextArea, TextField } from "@/components/ui/fields";
import { LinkSelect } from "@/components/ui/LinkSelect";
import type { NewRecord, Niche, Problem, Rating } from "@/lib/types";

export type ProblemDraft = NewRecord<Problem>;

const PAIN = ["", "Minor inconvenience", "Noticeable annoyance", "Real frustration", "Significant pain", "Urgent / severe"];
const FREQ = ["", "Rarely (once a year or less)", "Occasionally (a few times a year)", "Monthly", "Weekly", "Daily"];
const WTP = ["", "Expects it free", "Would pay a token amount", "Would pay a fair price", "Already pays for alternatives", "Pays premium prices today"];

export function ProblemForm({
  initial,
  niches,
  defaultNicheId,
  onSave,
  onClose,
}: {
  initial: Problem | null;
  niches: Niche[];
  defaultNicheId?: string | null;
  onSave: (d: ProblemDraft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<ProblemDraft>(
    initial
      ? {
          title: initial.title,
          nicheId: initial.nicheId,
          audience: initial.audience,
          description: initial.description,
          pain: initial.pain,
          frequency: initial.frequency,
          willingnessToPay: initial.willingnessToPay,
          evidence: initial.evidence,
          sourceUrls: initial.sourceUrls,
        }
      : {
          title: "",
          nicheId: defaultNicheId ?? null,
          audience: "",
          description: "",
          pain: 3,
          frequency: 3,
          willingnessToPay: 3,
          evidence: "",
          sourceUrls: [],
        },
  );
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof ProblemDraft>(k: K, v: ProblemDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const audienceId = useId();
  const listId = useId();
  const audienceSuggestions = niches.find((n) => n.id === d.nicheId)?.audiences ?? [];
  const titleError = touched && !d.title.trim() ? "Describe the problem in a few words" : undefined;

  const submit = () => {
    setTouched(true);
    if (!d.title.trim()) return;
    onSave({ ...d, title: d.title.trim(), audience: d.audience.trim(), description: d.description.trim(), evidence: d.evidence.trim() });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={initial ? "Edit problem" : "Log a problem"}
      description="A specific customer problem you've found evidence for."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{initial ? "Save changes" : "Save problem"}</Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <TextField label="Problem title" required value={d.title} onChange={(v) => set("title", v)} error={titleError} placeholder="e.g. Can't keep track of multiple kids' lesson plans" />
        <div className="grid gap-4 sm:grid-cols-2">
          <LinkSelect label="Niche" value={d.nicheId} onChange={(v) => set("nicheId", v)} options={niches.map((n) => ({ id: n.id, label: n.name }))} />
          <Field label="Target audience" htmlFor={audienceId} hint={audienceSuggestions.length ? "Suggestions from the selected niche" : undefined}>
            <input id={audienceId} list={listId} className="field-input" value={d.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Who has this problem?" />
            <datalist id={listId}>
              {audienceSuggestions.map((a) => <option key={a} value={a} />)}
            </datalist>
          </Field>
        </div>
        <TextArea label="Description" value={d.description} onChange={(v) => set("description", v)} placeholder="What happens, when, and why existing solutions fall short." />

        <div className="grid gap-5 rounded-lg border border-line bg-ivory/50 p-4 sm:grid-cols-3">
          <RatingInput label="Pain level" value={d.pain} onChange={(v) => set("pain", (v ?? 3) as Rating)} descriptions={PAIN} />
          <RatingInput label="Frequency" value={d.frequency} onChange={(v) => set("frequency", (v ?? 3) as Rating)} descriptions={FREQ} />
          <RatingInput label="Willingness to pay" value={d.willingnessToPay} onChange={(v) => set("willingnessToPay", (v ?? 3) as Rating)} descriptions={WTP} />
        </div>

        <TextArea
          label="Evidence"
          rows={4}
          value={d.evidence}
          onChange={(v) => set("evidence", v)}
          placeholder="Quotes, review excerpts, forum posts — what you actually saw that supports these ratings."
          hint="Ratings are only as good as the evidence behind them."
        />
        <ListInput label="Source URLs" values={d.sourceUrls} onChange={(v) => set("sourceUrls", v)} placeholder="https://www.reddit.com/r/… — press Enter" validateUrl />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
