"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SelectField, TextArea, TextField } from "@/components/ui/fields";
import { LinkSelect } from "@/components/ui/LinkSelect";
import { isValidUrl } from "@/lib/format";
import { PRODUCT_FORMATS, type Competitor, type NewRecord, type Niche, type ProductFormat } from "@/lib/types";

export type CompetitorDraft = NewRecord<Competitor>;

export function CompetitorForm({
  initial,
  niches,
  onSave,
  onClose,
}: {
  initial: Competitor | null;
  niches: Niche[];
  onSave: (d: CompetitorDraft) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<CompetitorDraft>(
    initial
      ? {
          competitorName: initial.competitorName,
          productName: initial.productName,
          price: initial.price,
          productType: initial.productType,
          nicheId: initial.nicheId,
          strengths: initial.strengths,
          weaknesses: initial.weaknesses,
          differentiation: initial.differentiation,
          evidenceUrl: initial.evidenceUrl,
        }
      : {
          competitorName: "",
          productName: "",
          price: null,
          productType: "Printable PDF",
          nicheId: null,
          strengths: "",
          weaknesses: "",
          differentiation: "",
          evidenceUrl: "",
        },
  );
  const [priceText, setPriceText] = useState(initial?.price != null ? String(initial.price) : "");
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof CompetitorDraft>(k: K, v: CompetitorDraft[K]) => setD((p) => ({ ...p, [k]: v }));

  const priceNum = priceText.trim() === "" ? null : Number(priceText.replace(/[$,\s]/g, ""));
  const errors = {
    competitorName: touched && !d.competitorName.trim() ? "Enter the shop or brand name" : undefined,
    productName: touched && !d.productName.trim() ? "Enter the product name" : undefined,
    price: priceNum !== null && (Number.isNaN(priceNum) || priceNum < 0) ? "Enter a valid price, e.g. 12.99" : undefined,
    evidenceUrl: d.evidenceUrl.trim() && !isValidUrl(d.evidenceUrl.trim()) ? "Enter a full URL (https://…)" : undefined,
  };

  const submit = () => {
    setTouched(true);
    if (!d.competitorName.trim() || !d.productName.trim() || errors.price || errors.evidenceUrl) return;
    onSave({
      ...d,
      competitorName: d.competitorName.trim(),
      productName: d.productName.trim(),
      price: priceNum === null ? null : Math.round(priceNum * 100) / 100,
      evidenceUrl: d.evidenceUrl.trim(),
      strengths: d.strengths.trim(),
      weaknesses: d.weaknesses.trim(),
      differentiation: d.differentiation.trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={initial ? "Edit competitor" : "Add competitor"}
      description="An existing product you found. Record what you actually observed on the listing."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>{initial ? "Save changes" : "Save competitor"}</Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Competitor (shop / brand)" required value={d.competitorName} onChange={(v) => set("competitorName", v)} error={errors.competitorName} placeholder="e.g. PaperNestStudio" />
          <TextField label="Product name" required value={d.productName} onChange={(v) => set("productName", v)} error={errors.productName} placeholder="As shown on the listing" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Price (USD)" value={priceText} onChange={setPriceText} error={errors.price} placeholder="e.g. 8.50" hint="Leave blank if not recorded" />
          <SelectField<ProductFormat> label="Product type" value={d.productType} onChange={(v) => set("productType", v)} options={PRODUCT_FORMATS.map((f) => ({ value: f, label: f }))} />
          <LinkSelect label="Niche" value={d.nicheId} onChange={(v) => set("nicheId", v)} options={niches.map((n) => ({ id: n.id, label: n.name }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label="Strengths" value={d.strengths} onChange={(v) => set("strengths", v)} placeholder="What do they do well? What do reviews praise?" />
          <TextArea label="Weaknesses" value={d.weaknesses} onChange={(v) => set("weaknesses", v)} placeholder="Gaps, complaints in reviews, dated design…" />
        </div>
        <TextArea label="Differentiation opportunities" value={d.differentiation} onChange={(v) => set("differentiation", v)} placeholder="How could your product be meaningfully better or different?" />
        <TextField label="Evidence URL" value={d.evidenceUrl} onChange={(v) => set("evidenceUrl", v)} error={errors.evidenceUrl} placeholder="https://www.etsy.com/listing/…" />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
