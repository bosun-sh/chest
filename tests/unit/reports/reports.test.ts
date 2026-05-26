import { describe, expect, it } from "bun:test";
import { getReport } from "../../../src/reports/get";
import { listReports } from "../../../src/reports/list";
import { writeReport } from "../../../src/reports/write";
import type { ValidationReport } from "../../../src/validation/schema";

const first: ValidationReport = {
  id: "rep-2026-05-22T09-00-00Z-done",
  workflow: "done",
  timestamp: "2026-05-22T09:00:00Z",
  status: "failed",
  rationale: "Tests failed.",
  evidenceRefs: [],
  followUps: ["Fix tests."],
};

const second: ValidationReport = {
  id: "rep-2026-05-23T10-00-00Z-ready",
  workflow: "ready",
  timestamp: "2026-05-23T10:00:00Z",
  status: "passed",
  rationale: "Plan is ready.",
  evidenceRefs: [],
  confidence: 0.91,
  followUps: [],
};

describe("reports", () => {
  it("sorts and filters report summaries", () => {
    const summaries = listReports(
      [
        { id: first.id, workflow: first.workflow, timestamp: first.timestamp, status: first.status },
        { id: second.id, workflow: second.workflow, timestamp: second.timestamp, status: second.status },
      ],
    );

    expect(summaries[0]?.id).toBe(second.id);
    expect(summaries[1]?.id).toBe(first.id);
    expect(listReports(summaries, { workflow: "ready" })).toHaveLength(1);
    expect(listReports(summaries, { since: "2026-05-23" })).toHaveLength(1);
  });

  it("retrieves a report by id", () => {
    expect(getReport([first, second], second.id)).toEqual(second);
    expect(getReport([first, second], "missing")).toBeUndefined();
  });

  it("upserts reports by id", () => {
    const updated = writeReport([first], second);

    expect(updated).toHaveLength(2);
    expect(updated.some((report) => report.id === second.id)).toBeTruthy();
  });
});
