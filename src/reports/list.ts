import type { ReportSummary } from "./schema";

export const listReports = (
  reports: ReportSummary[],
  filter?: { workflow?: string; since?: string },
): ReportSummary[] =>
  reports.filter((report) => {
    if (filter?.workflow && report.workflow !== filter.workflow) {
      return false;
    }

    if (filter?.since && report.timestamp < filter.since) {
      return false;
    }

    return true;
  });
