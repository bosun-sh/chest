import { Effect } from "effect";
import { ReportRepository, type ReportRepositoryError } from "./ports";
import type { ReportSummary } from "./schema";

const filterReports = (
  reports: ReportSummary[],
  filter?: { workflow?: string; since?: string },
): ReportSummary[] =>
  reports
    .filter((report) => {
      if (filter?.workflow && report.workflow !== filter.workflow) {
        return false;
      }

      if (filter?.since && report.timestamp < filter.since) {
        return false;
      }

      return true;
    })
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));

export function listReports(
  reports: ReportSummary[],
  filter?: { workflow?: string; since?: string },
): ReportSummary[];
export function listReports(
  filter?: { workflow?: string; since?: string },
): Effect.Effect<ReportSummary[], ReportRepositoryError, ReportRepository>;
export function listReports(
  reportsOrFilter?: ReportSummary[] | { workflow?: string; since?: string },
  filter?: { workflow?: string; since?: string },
) {
  if (Array.isArray(reportsOrFilter)) {
    return filterReports(reportsOrFilter, filter);
  }

  return Effect.gen(function* () {
    const repository = yield* ReportRepository;
    return yield* Effect.tryPromise({
      try: () => repository.list(reportsOrFilter),
      catch: (cause) => cause as ReportRepositoryError,
    });
  });
}
