import type { KPI } from "./schema";

export const getKPI = (records: KPI[], id: string): KPI | undefined =>
  records.find((record) => record.id === id);
