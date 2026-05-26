import { Effect } from "effect";
import { ReportRepository, type ReportRepositoryError } from "./ports";
import type { ValidationReport } from "./schema";

export function getReport(
  reports: ValidationReport[],
  id: string,
): ValidationReport | undefined;
export function getReport(
  id: string,
): Effect.Effect<ValidationReport, ReportRepositoryError, ReportRepository>;
export function getReport(reportsOrId: ValidationReport[] | string, id?: string) {
  if (Array.isArray(reportsOrId)) {
    return reportsOrId.find((report) => report.id === id);
  }

  return Effect.gen(function* () {
    const repository = yield* ReportRepository;
    const report = yield* Effect.tryPromise({
      try: () => repository.findById(reportsOrId),
      catch: (cause) => cause as ReportRepositoryError,
    });

    if (!report) {
      return yield* Effect.fail({ _tag: "not_found", id: reportsOrId } as const);
    }

    return report;
  });
}
