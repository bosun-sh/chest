import { describe, expect, it } from "bun:test";
import { listDoR } from "../../../src/dor/list";
import type { DoRCriterion } from "../../../src/dor/schema";
import { upsertDoR } from "../../../src/dor/upsert";

const criteria: DoRCriterion[] = [
  { id: "dor-1", text: "Plan includes acceptance criteria", severity: "blocking" },
  { id: "dor-2", text: "Plan identifies key risks", severity: "advisory" },
];

describe("dor helpers", () => {
  it("lists the records unchanged", () => {
    expect(listDoR(criteria)).toEqual(criteria);
  });

  it("upserts by replacing the matching id", () => {
    const next = upsertDoR(criteria, {
      id: "dor-2",
      text: "Plan identifies the main risks",
      severity: "advisory",
    });

    expect(next[1].text).toBe("Plan identifies the main risks");
  });
});
