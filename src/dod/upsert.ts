import type { DoDCriterion } from "./schema";

export const upsertDoD = (
  records: DoDCriterion[],
  record: DoDCriterion,
): DoDCriterion[] => {
  const index = records.findIndex(({ id }) => id === record.id);
  if (index === -1) {
    return [...records, record];
  }

  const next = records.slice();
  next[index] = record;
  return next;
};
