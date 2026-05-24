import type { KPI, KPIEvidence } from "./schema";
import { runKPI } from "./run";

export const runAllKPIs = async (kpis: KPI[]): Promise<KPIEvidence[]> =>
  Promise.all(kpis.map((kpi) => runKPI(kpi)));
