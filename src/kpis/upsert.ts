import type { KPI } from "./schema";

export const upsertKPI = (records: KPI[], record: KPI): KPI[] => {
  const index = records.findIndex(({ id }) => id === record.id);
  if (index === -1) {
    return [...records, record];
  }

  const next = records.slice();
  next[index] = record;
  return next;
};
