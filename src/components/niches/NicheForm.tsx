"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ListInput, SelectField, TextArea, TextField } from "@/components/ui/fields";
import { NICHE_STATUS_META, options } from "@/lib/labels";
import type { NewRecord, Niche } from "@/lib/types";

export type NicheDraft = Omit<NewRecord<Niche>, "observations">;

const blank: NicheDraft = { name: "", description: "", status: "exploring", subNiches: [], audiences: [] };

export function NicheForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Niche | null;
  onSave: (draft: NicheDraft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<NicheDraft>(
    initial
      ? { name: initial.name, description: initial.description, status: initial.status, subNiches: initial.subNiches, audiences: initial.audiences }
      : blank,
  );
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof NicheDraft>(k: K, v: NicheDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const nameError = touched && !d.name.trim() ? "Give the niche a name" : undefined;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (!d.name.trim()) return;
    onSave({ ...d, name: d.name.trim(), description: d.description.trim() });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "Edit niche" : "New niche"}
      description="A market segment you want to research, e.g. “Wedding planning printables”."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => submit()}>
            {initial ? "Save changes" : "Create niche"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <TextField label="Niche name" required value={d.name} onChange={(v) => set("name", v)} placeholder="e.g. Homeschool planning" error={nameError} />
          <SelectField label="Status" value={d.status} onChange={(v) => set("status", v)} options={options(NICHE_STATUS_META)} />
        </div>
        <TextArea label="Description" value={d.description} onChange={(v) => set("description", v)} placeholder="What is this niche and why are you looking at it?" />
        <ListInput
          label="Sub-niches"
          values={d.subNiches}
          onChange={(v) => set("subNiches", v)}
          placeholder="e.g. Charlotte Mason curriculum — press Enter"
          hint="Narrower segments inside this niche."
        />
        <ListInput
          label="Target audiences"
          values={d.audiences}
          onChange={(v) => set("audiences", v)}
          placeholder="e.g. First-year homeschooling parents — press Enter"
          hint="Who specifically buys in this niche."
        />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
