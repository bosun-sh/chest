import { describe, expect, it } from "bun:test";
import { listDoD } from "../../../src/dod/list";
import { upsertDoD } from "../../../src/dod/upsert";
import type { DoDCriterion } from "../../../src/dod/schema";

const criteria: DoDCriterion[] = [
  { id: "dod-1", text: "All tests pass", severity: "blocking", requiresKpi: "kpi-1" },
  { id: "dod-2", text: "Implementation matches plan", severity: "blocking" },
];

describe("dod helpers", () => {
  it("lists the records unchanged", () => {
    expect(listDoD(criteria)).toEqual(criteria);
  });

  it("upserts by inserting a new criterion", () => {
    const next = upsertDoD(criteria, {
      id: "dod-3",
      text: "Docs updated",
      severity: "info",
    });

    expect(next).toHaveLength(3);
    expect(next[2].id).toBe("dod-3");
  });
});
