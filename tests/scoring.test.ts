import { describe, expect, it } from "vitest";
import { emptyCriteria, scoreCriteria, scoreBand, CRITERION_LIST } from "@/lib/scoring";

describe("scoring", () => {
  it("weights sum to 100%", () => {
    expect(CRITERION_LIST.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1);
  });

  it("unrated opportunity scores 0 and is incomplete", () => {
    const r = scoreCriteria(emptyCriteria());
    expect(r.total).toBe(0);
    expect(r.complete).toBe(false);
    expect(r.assessedCount).toBe(0);
  });

  it("all fives score 100", () => {
    const c = emptyCriteria();
    for (const k of Object.keys(c) as (keyof typeof c)[]) c[k] = { rating: 5, reasoning: "x" };
    const r = scoreCriteria(c);
    expect(r.total).toBe(100);
    expect(r.complete).toBe(true);
    expect(r.missingReasoning).toEqual([]);
  });

  it("computes weighted contributions transparently", () => {
    const c = emptyCriteria();
    c.demand = { rating: 4, reasoning: "" }; // 80 * .25 = 20
    c.pain = { rating: 3, reasoning: "why" }; // 60 * .2 = 12
    c.competition = { rating: 2, reasoning: "why" }; // 40 * .2 = 8
    c.willingnessToPay = { rating: 5, reasoning: "why" }; // 100 * .2 = 20
    c.feasibility = { rating: 0, reasoning: "why" }; // 0
    const r = scoreCriteria(c);
    expect(r.total).toBe(60);
    expect(r.breakdown.find((b) => b.key === "demand")?.contribution).toBe(20);
    expect(r.missingReasoning).toEqual(["demand"]);
    expect(r.complete).toBe(true);
  });

  it("clamps out-of-range ratings", () => {
    const c = emptyCriteria();
    c.demand = { rating: 9, reasoning: "" };
    expect(scoreCriteria(c).breakdown[0].rating).toBe(5);
  });

  it("bands", () => {
    expect(scoreBand(80)).toBe("strong");
    expect(scoreBand(50)).toBe("moderate");
    expect(scoreBand(10)).toBe("weak");
  });
});
