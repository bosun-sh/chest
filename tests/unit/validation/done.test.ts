import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DoDCriterion } from "../../../src/dod/schema";
import type { KPIEvidence } from "../../../src/kpis/schema";
import type { OKR } from "../../../src/okrs/schema";
import { parseYaml } from "../../../src/shared/yaml-parse";
import type { ValidationReport } from "../../../src/validation/schema";
import { createTempDir } from "../../support/temp-dir";

const fixtureRoot = join(process.cwd(), "tests/fixtures/governance/valid");
const tempRoot = createTempDir("chest-done");
const chestDir = join(tempRoot, ".chest");
const validationDonePath = join(process.cwd(), "src/validation/done.ts");
const kpiRunPath = join(process.cwd(), "src/kpis/run.ts");

const report: ValidationReport = {
  id: "rep-2026-05-23T10-00-00Z-done",
  workflow: "done",
  timestamp: "2026-05-23T10:00:00Z",
  status: "passed",
  rationale: "All DoD criteria met.",
  evidenceRefs: [{ kind: "kpi", refId: "kpi-1", summary: "exit 0, 42 tests passed" }],
  confidence: 0.94,
  followUps: [],
};

beforeEach(async () => {
  await mkdir(chestDir, { recursive: true });
  await copyFile(join(fixtureRoot, "definition-of-done.yaml"), join(chestDir, "definition-of-done.yaml"));
  await copyFile(join(fixtureRoot, "okrs.yaml"), join(chestDir, "okrs.yaml"));
  await copyFile(join(fixtureRoot, "kpis.yaml"), join(chestDir, "kpis.yaml"));
});

afterEach(async () => {
  mock.restore();
  await rm(tempRoot, { recursive: true, force: true });
});

describe("chest.validate.done handler", () => {
  it("loads DoD, runs the required KPI, embeds KPI evidence refs, and persists a report", async () => {
    const captured: Array<unknown[]> = [];
    const kpiCalls: string[] = [];

    mock.module(validationDonePath, () => ({
      validateDone: async (...args: unknown[]) => {
        captured.push(args);
        return report;
      },
    }));

    mock.module(kpiRunPath, () => ({
      runKPI: async (kpi: DoDCriterion & { command: string[]; timeoutMs: number }) => {
        kpiCalls.push(kpi.id);
        return {
          kpiId: kpi.id,
          exitCode: 0,
          stdout: "42 tests pass",
          stderr: "",
          timedOut: false,
          durationMs: 42,
        };
      },
    }));

    const { validateDoneTool } = await import("../../../src/plugin/validate-tools");
    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const result = await validateDoneTool.run(
        { work_evidence: "Implemented chest.init. All tests pass." },
        { toolId: "chest.validate.done", metadata: {} },
      );

      expect(result.ok).toBe(true);
      expect(kpiCalls).toEqual(["kpi-1"]);
      expect(captured).toHaveLength(1);
      const [, dod, okrs, kpiEvidence] = captured[0] as [string, DoDCriterion[], OKR[], KPIEvidence[]];
      expect(dod).toHaveLength(2);
      expect(okrs).toHaveLength(2);
      expect(kpiEvidence).toHaveLength(1);
      expect(kpiEvidence[0]?.kpiId).toBe("kpi-1");

      const files = await readdir(join(chestDir, "reports"));
      expect(files).toHaveLength(1);
      const persisted = parseYaml<ValidationReport>(await readFile(join(chestDir, "reports", files[0] ?? ""), "utf8"));
      expect(persisted).toMatchObject(report);
    } finally {
      process.chdir(cwd);
    }
  });

  it("uses supplied KPI results instead of rerunning commands", async () => {
    const captured: Array<unknown[]> = [];
    let runCount = 0;

    mock.module(validationDonePath, () => ({
      validateDone: async (...args: unknown[]) => {
        captured.push(args);
        return report;
      },
    }));

    mock.module(kpiRunPath, () => ({
      runKPI: async () => {
        runCount += 1;
        return {
          kpiId: "kpi-1",
          exitCode: 0,
          stdout: "42 tests pass",
          stderr: "",
          timedOut: false,
          durationMs: 42,
        };
      },
    }));

    const { validateDoneTool } = await import("../../../src/plugin/validate-tools");
    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const supplied: KPIEvidence[] = [
        {
          kpiId: "kpi-1",
          exitCode: 0,
          stdout: "42 pass",
          stderr: "",
          timedOut: false,
          durationMs: 1,
        },
      ];
      const result = await validateDoneTool.run(
        { work_evidence: "Feature complete.", kpi_results: supplied },
        { toolId: "chest.validate.done", metadata: {} },
      );

      expect(result.ok).toBe(true);
      expect(runCount).toBe(0);
      expect(captured).toHaveLength(1);
      const [, , , kpiEvidence] = captured[0] as [string, DoDCriterion[], OKR[], KPIEvidence[]];
      expect(kpiEvidence).toEqual(supplied);
    } finally {
      process.chdir(cwd);
    }
  });

  it("surfaces a missing required KPI command as ERR-CHEST-06", async () => {
    await writeFile(
      join(chestDir, "definition-of-done.yaml"),
      JSON.stringify([
        {
          id: "dod-1",
          text: "All tests pass",
          severity: "blocking",
          requiresKpi: "kpi-missing-cmd",
        },
      ]),
    );
    await writeFile(
      join(chestDir, "kpis.yaml"),
      JSON.stringify([
        {
          id: "kpi-missing-cmd",
          name: "Missing command",
          target: "fail to start",
          command: ["__no_such_cmd__"],
          timeoutMs: 5000,
        },
      ]),
    );

    mock.module(kpiRunPath, () => ({
      runKPI: async () => {
        throw { _tag: "command_not_found", command: "__no_such_cmd__" };
      },
    }));

    const { validateDoneTool } = await import(`../../../src/plugin/validate-tools?missing-kpi=${Date.now()}`);
    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const result = await validateDoneTool.run(
        { work_evidence: "Work done." },
        { toolId: "chest.validate.done", metadata: {} },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ERR-CHEST-06");
        expect(result.error.message).toContain("__no_such_cmd__");
      }
    } finally {
      process.chdir(cwd);
    }
  });
});
