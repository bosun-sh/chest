import type { KPI } from "./schema";

export const removeKPI = (records: KPI[], id: string): KPI[] =>
  records.filter((record) => record.id !== id);
