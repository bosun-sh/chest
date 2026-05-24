import type { OKR } from "./schema";

export const getOKR = (records: OKR[], id: string): OKR | undefined =>
  records.find((record) => record.id === id);
