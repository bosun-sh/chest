import { Effect } from "effect";
import { ReportRepository, type ReportRepositoryError } from "./ports";
import type { ValidationReport } from "./schema";

const upsertReport = (
  reports: ValidationReport[],
  report: ValidationReport,
): ValidationReport[] => {
  const index = reports.findIndex(({ id }) => id === report.id);
  if (index === -1) {
    return [...reports, report];
  }

  const next = reports.slice();
  next[index] = report;
  return next;
};

export function writeReport(
  reports: ValidationReport[],
  report: ValidationReport,
): ValidationReport[];
export function writeReport(
  report: ValidationReport,
): Effect.Effect<void, ReportRepositoryError, ReportRepository>;
export function writeReport(reportsOrReport: ValidationReport[] | ValidationReport, report?: ValidationReport) {
  if (Array.isArray(reportsOrReport)) {
    return upsertReport(reportsOrReport, report as ValidationReport);
  }

  return Effect.gen(function* () {
    const repository = yield* ReportRepository;
    yield* Effect.tryPromise({
      try: () => repository.write(reportsOrReport),
      catch: (cause) => cause as ReportRepositoryError,
    });
  });
}
