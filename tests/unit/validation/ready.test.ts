import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DoRCriterion } from "../../../src/dor/schema";
import type { OKR } from "../../../src/okrs/schema";
import { parseYaml } from "../../../src/shared/yaml-parse";
import type { ValidationReport } from "../../../src/validation/schema";
import { createTempDir } from "../../support/temp-dir";

const fixtureRoot = join(process.cwd(), "tests/fixtures/governance/valid");
const tempRoot = createTempDir("chest-ready");
const chestDir = join(tempRoot, ".chest");
const validationReadyPath = join(process.cwd(), "src/validation/ready.ts");

const report: ValidationReport = {
  id: "rep-2026-05-23T10-00-00Z-ready",
  workflow: "ready",
  timestamp: "2026-05-23T10:00:00Z",
  status: "passed",
  rationale: "Plan is ready.",
  evidenceRefs: [{ kind: "plan", refId: "dor-1", summary: "Acceptance criteria present" }],
  confidence: 0.91,
  followUps: [],
};

beforeEach(async () => {
  await mkdir(chestDir, { recursive: true });
  await copyFile(join(fixtureRoot, "definition-of-ready.yaml"), join(chestDir, "definition-of-ready.yaml"));
  await copyFile(join(fixtureRoot, "okrs.yaml"), join(chestDir, "okrs.yaml"));
  await copyFile(join(fixtureRoot, "kpis.yaml"), join(chestDir, "kpis.yaml"));
});

afterEach(async () => {
  mock.restore();
  await rm(tempRoot, { recursive: true, force: true });
});

describe("chest.validate.ready handler", () => {
  it("loads DoR and OKRs from .chest, passes them to the validator, and persists a report", async () => {
    const captured: Array<unknown[]> = [];

    mock.module(validationReadyPath, () => ({
      validateReady: async (...args: unknown[]) => {
        captured.push(args);
        return report;
      },
    }));

    const { validateReadyTool } = await import("../../../src/plugin/validate-tools");
    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const result = await validateReadyTool.run(
        { plan: "Acceptance criteria are written. Risks are identified." },
        { toolId: "chest.validate.ready", metadata: {} },
      );

      expect(result.ok).toBe(true);
      expect(captured).toHaveLength(1);
      const [plan, dor, okrs] = captured[0] as [string, DoRCriterion[], OKR[]];
      expect(plan).toContain("Acceptance criteria");
      expect(dor).toHaveLength(2);
      expect(okrs).toHaveLength(2);

      const files = await readdir(join(chestDir, "reports"));
      expect(files).toHaveLength(1);
      const persisted = parseYaml<ValidationReport>(await readFile(join(chestDir, "reports", files[0] ?? ""), "utf8"));
      expect(persisted).toMatchObject(report);
    } finally {
      process.chdir(cwd);
    }
  });

  it("surfaces a missing Definition of Ready file", async () => {
    await rm(join(chestDir, "definition-of-ready.yaml"));

    const { validateReadyTool } = await import("../../../src/plugin/validate-tools");
    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const result = await validateReadyTool.run(
        { plan: "Acceptance criteria are written." },
        { toolId: "chest.validate.ready", metadata: {} },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ERR-CHEST-03");
        expect(result.error.message).toContain("definition-of-ready.yaml");
      }
    } finally {
      process.chdir(cwd);
    }
  });

  it("surfaces a malformed governance file instead of ignoring it", async () => {
    await writeFile(join(chestDir, "okrs.yaml"), "{");

    const { validateReadyTool } = await import("../../../src/plugin/validate-tools");
    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const result = await validateReadyTool.run(
        { plan: "Acceptance criteria are written." },
        { toolId: "chest.validate.ready", metadata: {} },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ERR-CHEST-01");
        expect(result.error.message).toContain("okrs.yaml");
      }
    } finally {
      process.chdir(cwd);
    }
  });
});
