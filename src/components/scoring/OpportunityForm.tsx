"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RatingInput, TextArea, TextField } from "@/components/ui/fields";
import { LinkSelect } from "@/components/ui/LinkSelect";
import { ScoreSummary } from "./ScoreBreakdown";
import { CRITERION_LIST, emptyCriteria, researchContext, scoreCriteria } from "@/lib/scoring";
import type { CriterionKey, Database, NewRecord, Opportunity } from "@/lib/types";

export type OpportunityDraft = NewRecord<Opportunity>;

export function OpportunityForm({
  initial,
  prefill,
  db,
  onSave,
  onClose,
}: {
  initial: Opportunity | null;
  prefill?: Partial<OpportunityDraft>;
  db: Database;
  onSave: (d: OpportunityDraft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<OpportunityDraft>(() =>
    initial
      ? { title: initial.title, nicheId: initial.nicheId, problemId: initial.problemId, criteria: { ...emptyCriteria(), ...initial.criteria }, notes: initial.notes }
      : { title: "", nicheId: null, problemId: null, criteria: emptyCriteria(), notes: "", ...prefill },
  );
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof OpportunityDraft>(k: K, v: OpportunityDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const setCriterion = (key: CriterionKey, patch: Partial<{ rating: number | null; reasoning: string }>) =>
    setD((p) => ({ ...p, criteria: { ...p.criteria, [key]: { ...p.criteria[key], ...patch } } }));

  const result = useMemo(() => scoreCriteria(d.criteria), [d.criteria]);
  const context = useMemo(() => researchContext(db, d.nicheId, d.problemId), [db, d.nicheId, d.problemId]);
  const problems = d.nicheId ? db.problems.filter((p) => p.nicheId === d.nicheId || p.id === d.problemId) : db.problems;
  const titleError = touched && !d.title.trim() ? "Name this opportunity" : undefined;

  const submit = () => {
    setTouched(true);
    if (!d.title.trim()) return;
    const criteria = Object.fromEntries(
      Object.entries(d.criteria).map(([k, v]) => [k, { rating: v.rating, reasoning: v.reasoning.trim() }]),
    ) as OpportunityDraft["criteria"];
    onSave({ ...d, title: d.title.trim(), notes: d.notes.trim(), criteria });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={initial ? "Edit opportunity score" : "Score an opportunity"}
      description="Rate each criterion against the rubric and explain why. Your research is shown alongside for reference."
      footer={
        <>
          <span className="mr-auto text-xs text-faint">Score updates live as you rate.</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{initial ? "Save changes" : "Save score"}</Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <TextField label="Opportunity" required value={d.title} onChange={(v) => set("title", v)} error={titleError} placeholder="e.g. Undated multi-child homeschool planner" />
          <div className="grid gap-4 sm:grid-cols-2">
            <LinkSelect
              label="Niche"
              value={d.nicheId}
              onChange={(v) => setD((p) => ({ ...p, nicheId: v, problemId: v && p.problemId && db.problems.find((x) => x.id === p.problemId)?.nicheId !== v ? null : p.problemId }))}
              options={db.niches.map((n) => ({ id: n.id, label: n.name }))}
            />
            <LinkSelect
              label="Customer problem"
              value={d.problemId}
              onChange={(v) => {
                const prob = db.problems.find((p) => p.id === v);
                setD((p) => ({ ...p, problemId: v, nicheId: p.nicheId ?? prob?.nicheId ?? null, title: p.title || prob?.title || "" }));
              }}
              options={problems.map((p) => ({ id: p.id, label: p.title }))}
              hint={d.nicheId && problems.length === 0 ? "No problems logged for this niche yet" : undefined}
            />
          </div>

          {CRITERION_LIST.map((def) => {
            const c = d.criteria[def.key];
            const facts = context.facts[def.key];
            return (
              <fieldset key={def.key} className="rounded-xl border border-line p-4 sm:p-5">
                <legend className="sr-only">{def.label}</legend>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-ink">{def.label}</h3>
                  <span className="num text-xs text-faint">Weight {Math.round(def.weight * 100)}% · up to {def.weight * 100} pts</span>
                </div>
                <p className="mt-0.5 text-[13px] text-muted">{def.question}</p>

                <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr]">
                  <RatingInput
                    label="Rating"
                    min={0}
                    value={c.rating}
                    onChange={(v) => setCriterion(def.key, { rating: v })}
                    descriptions={def.rubric}
                    hint="Not rated yet"
                    allowClear
                  />
                  <div className="rounded-lg bg-ivory/70 px-3.5 py-3 text-xs">
                    <div className="mb-1.5 flex items-center gap-1.5 font-semibold tracking-[0.06em] text-faint uppercase">
                      <BookOpen size={12} /> From your research
                    </div>
                    {facts.length ? (
                      <ul className="space-y-1 text-ink-soft">
                        {facts.map((f) => <li key={f}>• {f}</li>)}
                      </ul>
                    ) : (
                      <p className="text-faint">
                        {def.key === "feasibility" ? "Feasibility depends on your skills and tools — only you can judge this." : "Link a niche or problem to see relevant records here."}
                      </p>
                    )}
                  </div>
                </div>

                <details className="group mt-3">
                  <summary className="cursor-pointer text-xs text-muted select-none hover:text-ink">View full rubric</summary>
                  <ol className="mt-2 space-y-1 text-xs text-ink-soft">
                    {def.rubric.map((r, i) => (
                      <li key={i} className={`flex gap-2 rounded px-2 py-1 ${c.rating === i ? "bg-wine-soft text-wine" : ""}`}>
                        <span className="num w-3 shrink-0 font-semibold">{i}</span> {r}
                      </li>
                    ))}
                  </ol>
                </details>

                <div className="mt-3">
                  <TextArea
                    label="Reasoning"
                    rows={2}
                    value={c.reasoning}
                    onChange={(v) => setCriterion(def.key, { reasoning: v })}
                    placeholder="Why this rating? Point to specific evidence."
                  />
                </div>
              </fieldset>
            );
          })}

          <TextArea label="Notes" value={d.notes} onChange={(v) => set("notes", v)} placeholder="Open questions, next validation steps…" />
          <button type="submit" className="hidden" />
        </form>

        <aside className="order-first lg:order-none">
          <div className="rounded-xl border border-line bg-ivory/50 p-4 lg:sticky lg:top-0">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.12em] text-faint uppercase">Live score</p>
            <ScoreSummary result={result} />
          </div>
        </aside>
      </div>
    </Modal>
  );
}
