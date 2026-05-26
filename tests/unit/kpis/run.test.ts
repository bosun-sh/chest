import { afterEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runAllKPIs } from "../../../src/kpis/run-all";
import { runKPI } from "../../../src/kpis/run";
import type { KPI } from "../../../src/kpis/schema";
import { kpisRunTool } from "../../../src/plugin/kpis-tools";
import { createTempDir } from "../../support/temp-dir";

const echoKpi: KPI = {
  id: "kpi-echo",
  name: "Echo",
  target: "print output",
  command: ["echo", "ok"],
  timeoutMs: 1000,
};

const falseKpi: KPI = {
  id: "kpi-false",
  name: "False",
  target: "fail cleanly",
  command: ["false"],
  timeoutMs: 1000,
};

const slowKpi: KPI = {
  id: "kpi-slow",
  name: "Slow",
  target: "time out",
  command: ["sleep", "1"],
  timeoutMs: 10,
};

const missingCommandKpi: KPI = {
  id: "kpi-missing",
  name: "Missing",
  target: "fail on missing command",
  command: ["__definitely_missing_command__"],
  timeoutMs: 1000,
};

const tempRoot = createTempDir("chest-kpis");
const chestDir = join(tempRoot, ".chest");

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

describe("KPI execution", () => {
  it("captures stdout, stderr, exit code, and duration for a successful KPI", async () => {
    const result = await runKPI(echoKpi);

    expect(result.kpiId).toBe("kpi-echo");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("ok");
    expect(result.stderr).toBe("");
    expect(result.timedOut).toBeFalsy();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("treats nonzero exits as evidence", async () => {
    const result = await runKPI(falseKpi);

    expect(result.kpiId).toBe("kpi-false");
    expect(result.exitCode).toBe(1);
    expect(result.timedOut).toBeFalsy();
    expect(result.stderr).toBe("");
  });

  it("marks long-running commands as timed out", async () => {
    const result = await runKPI(slowKpi);

    expect(result.kpiId).toBe("kpi-slow");
    expect(result.timedOut).toBeTruthy();
    expect(result.exitCode).toBe(-1);
  });

  it("surfaces missing commands as a command_not_found failure", async () => {
    await expect(runKPI(missingCommandKpi)).rejects.toMatchObject({
      _tag: "command_not_found",
      command: "__definitely_missing_command__",
    });
  });

  it("runs KPI checks sequentially in run-all order", async () => {
    const results = await runAllKPIs([echoKpi, falseKpi]);

    expect(results).toHaveLength(2);
    expect(results[0]?.kpiId).toBe("kpi-echo");
    expect(results[1]?.kpiId).toBe("kpi-false");
  });

  it("surfaces command-not-found as a ToolResult error from the public handler", async () => {
    await mkdir(chestDir, { recursive: true });
    await writeFile(
      join(chestDir, "kpis.yaml"),
      JSON.stringify([
        {
          id: "kpi-missing",
          name: "Missing",
          target: "fail on missing command",
          command: ["__definitely_missing_command__"],
          timeoutMs: 1000,
        },
      ]),
    );

    const cwd = process.cwd();
    process.chdir(tempRoot);

    try {
      const result = await kpisRunTool.run(
        { id: "kpi-missing" },
        { toolId: "chest.kpis.run", metadata: {} },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ERR-CHEST-06");
      }
    } finally {
      process.chdir(cwd);
    }
  });
});
