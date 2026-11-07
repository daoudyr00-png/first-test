import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/export";
import { parseBackup } from "@/lib/store";

describe("csv", () => {
  it("escapes quotes, commas, newlines and formulas", () => {
    const csv = toCsv(
      [{ a: 'He said "hi", ok', b: "=SUM(A1)", c: ["x", "y"] }],
      [
        { header: "A", value: (r) => r.a },
        { header: "B", value: (r) => r.b },
        { header: "C", value: (r) => r.c },
      ],
    );
    expect(csv).toBe('A,B,C\r\n"He said ""hi"", ok",\'=SUM(A1),x; y');
  });
});

describe("backup import", () => {
  it("accepts a wrapped backup", () => {
    const db = parseBackup(JSON.stringify({ app: "x", data: { niches: [{ id: "1" }] } }));
    expect(db.niches).toHaveLength(1);
    expect(db.problems).toEqual([]);
  });
  it("rejects garbage", () => {
    expect(() => parseBackup("{}")).toThrow();
    expect(() => parseBackup(JSON.stringify({ niches: [{}] }))).toThrow();
  });
});
