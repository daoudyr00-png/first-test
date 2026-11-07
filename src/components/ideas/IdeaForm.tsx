"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SelectField, TextArea, TextField } from "@/components/ui/fields";
import { LinkSelect } from "@/components/ui/LinkSelect";
import { ScorePill } from "@/components/ui/Score";
import { DIFFICULTY_META, VALIDATION_META, options } from "@/lib/labels";
import { scoreOpportunity } from "@/lib/scoring";
import { PRODUCT_FORMATS, type Database, type Difficulty, type NewRecord, type ProductFormat, type ProductIdea, type ValidationStatus } from "@/lib/types";

export type IdeaDraft = NewRecord<ProductIdea>;

export const blankIdea = (): IdeaDraft => ({
  name: "",
  problemId: null,
  problemSolved: "",
  targetCustomer: "",
  solution: "",
  usp: "",
  format: "Printable PDF",
  difficulty: "medium",
  opportunityId: null,
  validationStatus: "idea",
});

export function IdeaForm({
  initial,
  prefill,
  db,
  onSave,
  onClose,
}: {
  initial: ProductIdea | null;
  prefill?: Partial<IdeaDraft>;
  db: Database;
  onSave: (d: IdeaDraft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<IdeaDraft>(() => {
    if (initial) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = initial;
      return rest;
    }
    return { ...blankIdea(), ...prefill };
  });
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof IdeaDraft>(k: K, v: IdeaDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const linkedOpp = d.opportunityId ? db.opportunities.find((o) => o.id === d.opportunityId) : null;
  const nameError = touched && !d.name.trim() ? "Give the product a working name" : undefined;

  const pickProblem = (id: string | null) => {
    const p = id ? db.problems.find((x) => x.id === id) : null;
    setD((prev) => ({
      ...prev,
      problemId: id,
      // Copy the user's own problem text in only if the fields are still empty.
      problemSolved: prev.problemSolved || (p ? p.title : ""),
      targetCustomer: prev.targetCustomer || (p?.audience ?? ""),
    }));
  };

  const submit = () => {
    setTouched(true);
    if (!d.name.trim()) return;
    const trimmed = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])) as IdeaDraft;
    onSave(trimmed);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={initial ? "Edit product idea" : "New product idea"}
      description="Shape a concrete product around a problem you've researched."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{initial ? "Save changes" : "Save idea"}</Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <TextField label="Product name" required value={d.name} onChange={(v) => set("name", v)} error={nameError} placeholder="Working title" />
          <SelectField<ValidationStatus> label="Validation status" value={d.validationStatus} onChange={(v) => set("validationStatus", v)} options={options(VALIDATION_META)} hint={VALIDATION_META[d.validationStatus].hint} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <LinkSelect label="Linked problem" value={d.problemId} onChange={pickProblem} options={db.problems.map((p) => ({ id: p.id, label: p.title }))} />
          <LinkSelect
            label="Opportunity score"
            value={d.opportunityId}
            onChange={(v) => set("opportunityId", v)}
            noneLabel="No score linked"
            options={db.opportunities.map((o) => ({ id: o.id, label: `${o.title} (${scoreOpportunity(o).total})` }))}
            hint={linkedOpp ? <span className="inline-flex items-center gap-1.5">Current: <ScorePill score={scoreOpportunity(linkedOpp).total} /></span> : "The score is read from Opportunity Scoring and stays in sync."}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label="Customer problem solved" value={d.problemSolved} onChange={(v) => set("problemSolved", v)} placeholder="The specific problem this product fixes" />
          <TextArea label="Target customer" value={d.targetCustomer} onChange={(v) => set("targetCustomer", v)} placeholder="Who exactly is this for?" />
        </div>
        <TextArea label="Proposed solution" rows={3} value={d.solution} onChange={(v) => set("solution", v)} placeholder="What the product is and what's inside it" />
        <TextArea label="Unique selling proposition" value={d.usp} onChange={(v) => set("usp", v)} placeholder="Why would someone choose this over what already exists?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField<ProductFormat> label="Suggested product format" value={d.format} onChange={(v) => set("format", v)} options={PRODUCT_FORMATS.map((f) => ({ value: f, label: f }))} />
          <SelectField<Difficulty> label="Estimated development difficulty" value={d.difficulty} onChange={(v) => set("difficulty", v)} options={options(DIFFICULTY_META)} />
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
