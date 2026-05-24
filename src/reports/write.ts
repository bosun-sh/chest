import type { ValidationReport } from "./schema";

export const writeReport = (reports: ValidationReport[], report: ValidationReport): ValidationReport[] => {
  const index = reports.findIndex(({ id }) => id === report.id);
  if (index === -1) {
    return [...reports, report];
  }

  const next = reports.slice();
  next[index] = report;
  return next;
};
