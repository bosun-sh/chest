import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { reportsGetTool, reportsListTool } from "../../src/plugin/reports-tools";
import type { ValidationReport } from "../../src/validation/schema";
import { createTempDir } from "../support/temp-dir";

const tempRoot = createTempDir("chest-reports");
const chestDir = join(tempRoot, ".chest");
const reportsDir = join(chestDir, "reports");

const readyReport: ValidationReport = {
  id: "rep-2026-05-23T10-00-00Z-ready",
  workflow: "ready",
  timestamp: "2026-05-23T10:00:00Z",
  status: "passed",
  rationale: "Plan satisfies all DoR criteria.",
  evidenceRefs: [{ kind: "plan", refId: "dor-1", summary: "AC present" }],
  confidence: 0.91,
  followUps: [],
};

const doneReport: ValidationReport = {
  id: "rep-2026-05-22T09-00-00Z-done",
  workflow: "done",
  timestamp: "2026-05-22T09:00:00Z",
  status: "failed",
  rationale: "Tests failed.",
  evidenceRefs: [],
  followUps: ["Fix tests."],
};

beforeEach(async () => {
  await mkdir(reportsDir, { recursive: true });
  await writeFile(join(reportsDir, "2026-05-23T10-00-00Z-ready.yaml"), JSON.stringify(readyReport));
  await writeFile(join(reportsDir, "2026-05-22T09-00-00Z-done.yaml"), JSON.stringify(doneReport));
});

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

describe("chest.reports tools", () => {
  it("lists report summaries in timestamp order and filters by workflow", async () => {
    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const result = await reportsListTool.run(
        {},
        { toolId: "chest.reports.list", metadata: {} },
      );

      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }

      expect(result.data.items).toEqual([
        {
          id: readyReport.id,
          workflow: "ready",
          timestamp: readyReport.timestamp,
          status: readyReport.status,
        },
        {
          id: doneReport.id,
          workflow: "done",
          timestamp: doneReport.timestamp,
          status: doneReport.status,
        },
      ]);

      const filtered = await reportsListTool.run(
        { workflow: "ready" },
        { toolId: "chest.reports.list", metadata: {} },
      );

      expect(filtered.ok).toBe(true);
      if (filtered.ok) {
        expect(filtered.data.items).toHaveLength(1);
        expect(filtered.data.items[0]?.workflow).toBe("ready");
      }
    } finally {
      process.chdir(cwd);
    }
  });

  it("returns the full report by id", async () => {
    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const result = await reportsGetTool.run(
        { id: readyReport.id },
        { toolId: "chest.reports.get", metadata: {} },
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toMatchObject(readyReport);
      }
    } finally {
      process.chdir(cwd);
    }
  });

  it("surfaces a missing reports directory and malformed report content", async () => {
    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const missingDir = await reportsGetTool.run(
        { id: "rep-missing" },
        { toolId: "chest.reports.get", metadata: {} },
      );

      expect(missingDir.ok).toBe(false);
      if (!missingDir.ok) {
        expect(missingDir.error.code).toBe("ERR-CHEST-09");
      }

      await writeFile(
        join(reportsDir, "2026-05-24T10-00-00Z-ready.yaml"),
        JSON.stringify({ id: "rep-2026-05-24T10-00-00Z-ready", workflow: "ready" }),
      );
      const malformedList = await reportsListTool.run(
        {},
        { toolId: "chest.reports.list", metadata: {} },
      );

      expect(malformedList.ok).toBe(false);
      if (!malformedList.ok) {
        expect(malformedList.error.code).toBe("ERR-CHEST-08");
      }
    } finally {
      process.chdir(cwd);
    }
  });
});
