import type { OKR } from "./schema";

export const removeOKR = (records: OKR[], id: string): OKR[] =>
  records.filter((record) => record.id !== id);
