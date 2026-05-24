import type { DoRCriterion } from "./schema";

export const upsertDoR = (
  records: DoRCriterion[],
  record: DoRCriterion,
): DoRCriterion[] => {
  const index = records.findIndex(({ id }) => id === record.id);
  if (index === -1) {
    return [...records, record];
  }

  const next = records.slice();
  next[index] = record;
  return next;
};
