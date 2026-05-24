import type { KPI, KPIEvidence } from "./schema";

export const runKPI = async (kpi: KPI): Promise<KPIEvidence> => ({
  kpiId: kpi.id,
  exitCode: 0,
  stdout: "",
  stderr: "",
  timedOut: false,
  durationMs: 0,
});
