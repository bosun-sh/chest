import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { listDoD } from "../../../src/dod/list";
import { DoDRepository } from "../../../src/dod/ports";
import type { DoDCriterion } from "../../../src/dod/schema";
import { upsertDoD } from "../../../src/dod/upsert";
import { listDoR } from "../../../src/dor/list";
import { DoRRepository } from "../../../src/dor/ports";
import type { DoRCriterion } from "../../../src/dor/schema";
import { upsertDoR } from "../../../src/dor/upsert";
import { JudgeProvider } from "../../../src/judge/ports";
import { getKPI } from "../../../src/kpis/get";
import { listKPIs } from "../../../src/kpis/list";
import { KPIRepository, KPIRunner } from "../../../src/kpis/ports";
import { removeKPI } from "../../../src/kpis/remove";
import { runKPI } from "../../../src/kpis/run";
import { runAllKPIs } from "../../../src/kpis/run-all";
import type { KPI, KPIEvidence } from "../../../src/kpis/schema";
import { upsertKPI } from "../../../src/kpis/upsert";
import { getOKR } from "../../../src/okrs/get";
import { listOKRs } from "../../../src/okrs/list";
import { OKRRepository } from "../../../src/okrs/ports";
import { removeOKR } from "../../../src/okrs/remove";
import type { OKR } from "../../../src/okrs/schema";
import { upsertOKR } from "../../../src/okrs/upsert";
import { getReport } from "../../../src/reports/get";
import { listReports } from "../../../src/reports/list";
import { ReportRepository } from "../../../src/reports/ports";
import type { ReportSummary } from "../../../src/reports/schema";
import { writeReport } from "../../../src/reports/write";
import { Clock, Logger } from "../../../src/shared/ports";
import type { ValidationReport } from "../../../src/validation/schema";

const okrs: OKR[] = [
  { id: "okr-1", objective: "Ship", keyResults: [{ id: "kr-1", description: "Done", target: "1" }] },
];

const kpis: KPI[] = [
  { id: "kpi-1", name: "Tests", target: "0", command: ["echo", "ok"], timeoutMs: 1000 },
];

const dor: DoRCriterion[] = [
  { id: "dor-1", text: "Plan includes acceptance criteria", severity: "blocking" },
];

const dod: DoDCriterion[] = [
  { id: "dod-1", text: "Tests pass", severity: "blocking", requiresKpi: "kpi-1" },
];

const report: ValidationReport = {
  id: "rep-1",
  workflow: "ready",
  timestamp: "2026-05-24T00:00:00Z",
  status: "passed",
  rationale: "Ready.",
  evidenceRefs: [],
  followUps: [],
};

const reportSummary: ReportSummary = {
  id: report.id,
  workflow: report.workflow,
  timestamp: report.timestamp,
  status: report.status,
};

describe("Effect port contracts", () => {
  it("exports Context.GenericTag-style service ports", () => {
    expect(OKRRepository.key).toBeDefined();
    expect(KPIRepository.key).toBeDefined();
    expect(KPIRunner.key).toBeDefined();
    expect(DoRRepository.key).toBeDefined();
    expect(DoDRepository.key).toBeDefined();
    expect(JudgeProvider.key).toBeDefined();
    expect(ReportRepository.key).toBeDefined();
    expect(Clock.key).toBeDefined();
    expect(Logger.key).toBeDefined();
  });

  it("runs repository-backed OKR, DoR, DoD, and report programs through Effect services", async () => {
    const okrRepo = {
      list: async () => okrs,
      findById: async (id: string) => okrs.find((item) => item.id === id),
      save: async () => undefined,
      remove: async () => undefined,
    };
    const dorRepo = {
      list: async () => dor,
      save: async () => undefined,
    };
    const dodRepo = {
      list: async () => dod,
      save: async () => undefined,
    };
    const reportRepo = {
      list: async () => [reportSummary],
      findById: async (id: string) => (id === report.id ? report : undefined),
      write: async () => undefined,
    };

    await expect(Effect.runPromise(Effect.provideService(listOKRs(), OKRRepository, okrRepo))).resolves.toEqual(okrs);
    await expect(
      Effect.runPromise(Effect.provideService(getOKR("okr-1"), OKRRepository, okrRepo)),
    ).resolves.toEqual(okrs[0]);
    await expect(
      Effect.runPromise(Effect.provideService(upsertOKR(okrs[0]), OKRRepository, okrRepo)),
    ).resolves.toEqual({ id: "okr-1" });
    await expect(
      Effect.runPromise(Effect.provideService(removeOKR("okr-1"), OKRRepository, okrRepo)),
    ).resolves.toEqual({ id: "okr-1" });

    await expect(Effect.runPromise(Effect.provideService(listDoR(), DoRRepository, dorRepo))).resolves.toEqual(dor);
    await expect(
      Effect.runPromise(Effect.provideService(upsertDoR(dor[0]), DoRRepository, dorRepo)),
    ).resolves.toEqual({ id: "dor-1" });

    await expect(Effect.runPromise(Effect.provideService(listDoD(), DoDRepository, dodRepo))).resolves.toEqual(dod);
    await expect(
      Effect.runPromise(Effect.provideService(upsertDoD(dod[0]), DoDRepository, dodRepo)),
    ).resolves.toEqual({ id: "dod-1" });

    await expect(
      Effect.runPromise(Effect.provideService(listReports(), ReportRepository, reportRepo)),
    ).resolves.toEqual([reportSummary]);
    await expect(
      Effect.runPromise(Effect.provideService(getReport(report.id), ReportRepository, reportRepo)),
    ).resolves.toEqual(report);
    await expect(
      Effect.runPromise(Effect.provideService(writeReport(report), ReportRepository, reportRepo)),
    ).resolves.toBeUndefined();
  });

  it("runs KPI programs through repository and runner ports", async () => {
    const evidence: KPIEvidence = {
      kpiId: "kpi-1",
      exitCode: 0,
      stdout: "ok",
      stderr: "",
      timedOut: false,
      durationMs: 5,
    };
    const repo = {
      list: async () => kpis,
      findById: async (id: string) => kpis.find((item) => item.id === id),
      save: async () => undefined,
      remove: async () => undefined,
    };
    const runner = {
      run: async () => evidence,
      runAll: async () => [evidence],
    };

    const single = runKPI("kpi-1").pipe(
      Effect.provideService(KPIRepository, repo),
      Effect.provideService(KPIRunner, runner),
    );
    const batch = runAllKPIs().pipe(
      Effect.provideService(KPIRepository, repo),
      Effect.provideService(KPIRunner, runner),
    );
    const listed = Effect.provideService(listKPIs(), KPIRepository, repo);
    const found = Effect.provideService(getKPI("kpi-1"), KPIRepository, repo);
    const upserted = Effect.provideService(upsertKPI(kpis[0]), KPIRepository, repo);
    const removed = Effect.provideService(removeKPI("kpi-1"), KPIRepository, repo);

    await expect(Effect.runPromise(listed)).resolves.toEqual(kpis);
    await expect(Effect.runPromise(found)).resolves.toEqual(kpis[0]);
    await expect(Effect.runPromise(upserted)).resolves.toEqual({ id: "kpi-1" });
    await expect(Effect.runPromise(removed)).resolves.toEqual({ id: "kpi-1" });
    await expect(Effect.runPromise(single)).resolves.toEqual(evidence);
    await expect(Effect.runPromise(batch)).resolves.toEqual([evidence]);
  });
});
