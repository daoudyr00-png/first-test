import type { Tone } from "@/components/ui/Badge";
import type { CompetitionLevel, Difficulty, NicheStatus, SearchIntent, ValidationStatus } from "@/lib/types";

export const NICHE_STATUS_META: Record<NicheStatus, { label: string; tone: Tone }> = {
  exploring: { label: "Exploring", tone: "slate" },
  promising: { label: "Promising", tone: "sage" },
  paused: { label: "Paused", tone: "ochre" },
  rejected: { label: "Rejected", tone: "neutral" },
};

export const VALIDATION_META: Record<ValidationStatus, { label: string; tone: Tone; color: string; hint: string }> = {
  idea: { label: "Idea", tone: "neutral", color: "#cfc6b8", hint: "Captured, not yet researched" },
  researching: { label: "Researching", tone: "slate", color: "#8a94a3", hint: "Collecting evidence" },
  validating: { label: "Validating", tone: "ochre", color: "#c39a4f", hint: "Testing with real customers" },
  validated: { label: "Validated", tone: "sage", color: "#6d8a6f", hint: "Evidence supports building it" },
  launched: { label: "Launched", tone: "wine", color: "#7b2337", hint: "Live on a storefront" },
  rejected: { label: "Rejected", tone: "danger", color: "#e3c3c3", hint: "Evidence says no" },
};

export const COMPETITION_META: Record<CompetitionLevel, { label: string; tone: Tone }> = {
  low: { label: "Low", tone: "sage" },
  medium: { label: "Medium", tone: "ochre" },
  high: { label: "High", tone: "danger" },
  unknown: { label: "Not assessed", tone: "neutral" },
};

export const INTENT_META: Record<SearchIntent, { label: string; hint: string }> = {
  informational: { label: "Informational", hint: "Looking to learn (how to, ideas, what is)" },
  commercial: { label: "Commercial", hint: "Comparing options before buying (best, vs, review)" },
  transactional: { label: "Transactional", hint: "Ready to buy (printable, template, download)" },
  navigational: { label: "Navigational", hint: "Looking for a specific shop or brand" },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; tone: Tone }> = {
  low: { label: "Low", tone: "sage" },
  medium: { label: "Medium", tone: "ochre" },
  high: { label: "High", tone: "danger" },
};

export const options = <K extends string>(meta: Record<K, { label: string }>) =>
  (Object.keys(meta) as K[]).map((k) => ({ value: k, label: meta[k].label }));
