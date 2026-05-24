import type { ValidationReport } from "./schema";

export const getReport = (
  reports: ValidationReport[],
  id: string,
): ValidationReport | undefined => reports.find((report) => report.id === id);
