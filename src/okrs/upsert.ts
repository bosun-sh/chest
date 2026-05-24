import type { OKR } from "./schema";

export const upsertOKR = (records: OKR[], record: OKR): OKR[] => {
  const index = records.findIndex(({ id }) => id === record.id);
  if (index === -1) {
    return [...records, record];
  }

  const next = records.slice();
  next[index] = record;
  return next;
};
