import { CRITERIA, type CriterionAssessment, type CriterionKey, type Database, type Opportunity } from "@/lib/types";

/**
 * Transparent opportunity scoring.
 *
 * The user rates each criterion 0–5 against the rubric below and writes the
 * reasoning. criterionScore = rating / 5 × 100. The overall score is the
 * weighted sum of criterion scores, so every point can be traced to a
 * specific rating. The app never invents a rating: unrated criteria
 * contribute 0 and the score is flagged incomplete.
 */

export interface CriterionDefinition {
  key: CriterionKey;
  label: string;
  weight: number; // fraction of 1
  question: string;
  rubric: [string, string, string, string, string, string]; // index = rating 0..5
}

export const CRITERION_DEFS: Record<CriterionKey, CriterionDefinition> = {
  demand: {
    key: "demand",
    label: "Demand evidence",
    weight: 0.25,
    question: "How strong is the documented evidence that people are actively looking for this?",
    rubric: [
      "No evidence collected yet",
      "Anecdotal — a single mention or a hunch",
      "A few scattered signals (one or two forum threads, a handful of keywords)",
      "Consistent signals from more than one source",
      "Strong signals: multiple sources, existing sales/reviews on competitor listings",
      "Overwhelming, well-documented evidence across several independent sources",
    ],
  },
  pain: {
    key: "pain",
    label: "Customer pain intensity",
    weight: 0.2,
    question: "How much does this problem actually hurt the customer?",
    rubric: [
      "Not assessed",
      "Minor inconvenience, easily ignored",
      "Noticeable annoyance",
      "Real frustration that costs time or money",
      "Significant pain that people actively complain about",
      "Urgent, recurring pain people are desperate to solve",
    ],
  },
  competition: {
    key: "competition",
    label: "Competition opportunity",
    weight: 0.2,
    question: "How much room is there to enter? (Higher = less saturated or clearer gaps.)",
    rubric: [
      "Not assessed",
      "Saturated with strong, well-reviewed products — no visible gap",
      "Crowded; gaps are small or hard to exploit",
      "Competitive but with identifiable weaknesses to improve on",
      "Few strong competitors, or clear, recurring complaints about existing products",
      "Wide open, or existing products are clearly inadequate",
    ],
  },
  willingnessToPay: {
    key: "willingnessToPay",
    label: "Willingness to pay",
    weight: 0.2,
    question: "Is there evidence customers will pay for a solution, and at a viable price?",
    rubric: [
      "No evidence",
      "Customers expect this for free",
      "Low-price impulse purchase only",
      "Comparable products sell at a fair price",
      "Customers pay premium prices for comparable products",
      "Strong evidence of high spend on this problem already",
    ],
  },
  feasibility: {
    key: "feasibility",
    label: "Product feasibility",
    weight: 0.15,
    question: "How realistic is it for you to build a high-quality version of this product?",
    rubric: [
      "Not assessed",
      "Requires skills or resources you don't have",
      "Possible but a major effort",
      "Achievable with moderate effort",
      "Straightforward with your current skills and tools",
      "Quick to build and easy to iterate",
    ],
  },
};

export const CRITERION_LIST = CRITERIA.map((k) => CRITERION_DEFS[k]);

export interface CriterionResult {
  key: CriterionKey;
  label: string;
  weight: number;
  rating: number | null;
  criterionScore: number; // 0–100
  contribution: number; // weighted points toward the 0–100 total
  maxContribution: number;
  rubricText: string;
  reasoning: string;
}

export interface ScoreResult {
  total: number; // 0–100, rounded
  complete: boolean;
  assessedCount: number;
  missingReasoning: CriterionKey[];
  breakdown: CriterionResult[];
}

const clampRating = (r: number | null): number | null =>
  r === null || Number.isNaN(r) ? null : Math.max(0, Math.min(5, Math.round(r)));

export function scoreCriteria(criteria: Record<CriterionKey, CriterionAssessment>): ScoreResult {
  const breakdown = CRITERION_LIST.map((def) => {
    const a = criteria[def.key] ?? { rating: null, reasoning: "" };
    const rating = clampRating(a.rating);
    const criterionScore = rating === null ? 0 : (rating / 5) * 100;
    return {
      key: def.key,
      label: def.label,
      weight: def.weight,
      rating,
      criterionScore,
      contribution: criterionScore * def.weight,
      maxContribution: def.weight * 100,
      rubricText: rating === null ? "Not rated" : def.rubric[rating],
      reasoning: a.reasoning.trim(),
    };
  });
  const assessedCount = breakdown.filter((b) => b.rating !== null).length;
  return {
    total: Math.round(breakdown.reduce((s, b) => s + b.contribution, 0)),
    complete: assessedCount === CRITERIA.length,
    assessedCount,
    missingReasoning: breakdown.filter((b) => b.rating !== null && !b.reasoning).map((b) => b.key),
    breakdown,
  };
}

export const scoreOpportunity = (o: Opportunity) => scoreCriteria(o.criteria);

export function emptyCriteria(): Record<CriterionKey, CriterionAssessment> {
  return Object.fromEntries(CRITERIA.map((k) => [k, { rating: null, reasoning: "" }])) as Record<
    CriterionKey,
    CriterionAssessment
  >;
}

export type ScoreBand = "strong" | "moderate" | "weak";
export function scoreBand(total: number): ScoreBand {
  if (total >= 70) return "strong";
  if (total >= 45) return "moderate";
  return "weak";
}
export const BAND_LABEL: Record<ScoreBand, string> = {
  strong: "Strong",
  moderate: "Moderate",
  weak: "Weak",
};

/**
 * Facts from the user's own research records that are relevant to each
 * criterion. These are shown as reference while rating — they are counts and
 * values the user entered, never estimates.
 */
export function researchContext(db: Database, nicheId: string | null, problemId: string | null) {
  const problem = problemId ? db.problems.find((p) => p.id === problemId) ?? null : null;
  const effectiveNiche = nicheId ?? problem?.nicheId ?? null;
  const niche = effectiveNiche ? db.niches.find((n) => n.id === effectiveNiche) ?? null : null;
  const keywords = effectiveNiche ? db.keywords.filter((k) => k.nicheId === effectiveNiche) : [];
  const competitors = effectiveNiche ? db.competitors.filter((c) => c.nicheId === effectiveNiche) : [];
  const problems = effectiveNiche ? db.problems.filter((p) => p.nicheId === effectiveNiche) : [];
  const prices = competitors.map((c) => c.price).filter((p): p is number => typeof p === "number");
  const facts: Record<CriterionKey, string[]> = {
    demand: [],
    pain: [],
    competition: [],
    willingnessToPay: [],
    feasibility: [],
  };

  if (niche) {
    facts.demand.push(`${niche.observations.length} market observation(s) recorded for “${niche.name}”`);
  }
  if (effectiveNiche) {
    facts.demand.push(`${keywords.length} keyword(s) researched in this niche`);
    const sourced = problems.filter((p) => p.sourceUrls.length > 0).length;
    facts.demand.push(`${sourced} of ${problems.length} problem(s) in this niche have source URLs`);
  }
  if (problem) {
    facts.pain.push(`Problem “${problem.title}”: pain ${problem.pain}/5, frequency ${problem.frequency}/5`);
    facts.willingnessToPay.push(`Problem “${problem.title}”: willingness to pay ${problem.willingnessToPay}/5`);
    if (problem.sourceUrls.length) facts.demand.push(`Linked problem cites ${problem.sourceUrls.length} source URL(s)`);
  }
  if (effectiveNiche) {
    facts.competition.push(`${competitors.length} competitor product(s) logged in this niche`);
    const levels = keywords.reduce<Record<string, number>>((acc, k) => {
      acc[k.competition] = (acc[k.competition] ?? 0) + 1;
      return acc;
    }, {});
    if (keywords.length) {
      facts.competition.push(
        `Keyword competition you assessed: ${Object.entries(levels)
          .map(([l, n]) => `${n} ${l}`)
          .join(", ")}`,
      );
    }
    const withGaps = competitors.filter((c) => c.differentiation.trim()).length;
    if (competitors.length) facts.competition.push(`${withGaps} competitor(s) with a noted differentiation opportunity`);
  }
  if (prices.length) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const median = [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    facts.willingnessToPay.push(
      `Competitor prices you recorded: ${prices.length} listing(s), ${fmtMoney(min)}–${fmtMoney(max)} (median ${fmtMoney(median)})`,
    );
  }
  return { niche, problem, facts };
}

const fmtMoney = (n: number) => `$${n.toFixed(2)}`;
