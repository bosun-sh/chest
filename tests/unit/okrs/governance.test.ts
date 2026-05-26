import { describe, expect, it } from "bun:test";
import { getOKR } from "../../../src/okrs/get";
import { listOKRs } from "../../../src/okrs/list";
import { removeOKR } from "../../../src/okrs/remove";
import { upsertOKR } from "../../../src/okrs/upsert";
import type { OKR } from "../../../src/okrs/schema";

const okrs: OKR[] = [
  {
    id: "okr-1",
    objective: "Deliver chest v1 to production",
    keyResults: [{ id: "kr-1", description: "All specs written", target: "30 files" }],
  },
  {
    id: "okr-2",
    objective: "Achieve agent self-governance",
    keyResults: [{ id: "kr-2", description: "Zero checkpoints", target: "0" }],
  },
];

describe("okrs helpers", () => {
  it("lists the records unchanged", () => {
    expect(listOKRs(okrs)).toEqual(okrs);
  });

  it("finds a record by id", () => {
    expect(getOKR(okrs, "okr-2")).toEqual(okrs[1]);
  });

  it("upserts by replacing the matching id", () => {
    const next = upsertOKR(okrs, {
      id: "okr-2",
      objective: "Updated",
      keyResults: [{ id: "kr-2", description: "Still zero", target: "0" }],
    });

    expect(next).toHaveLength(2);
    expect(next[1].objective).toBe("Updated");
  });

  it("removes by id", () => {
    expect(removeOKR(okrs, "okr-1")).toEqual([okrs[1]]);
  });
});
