import { Effect } from "effect";
import { KPIRepository, type KPIRepositoryError } from "./ports";
import type { KPI } from "./schema";

export function listKPIs(records: KPI[]): KPI[];
export function listKPIs(): Effect.Effect<
  KPI[],
  KPIRepositoryError,
  KPIRepository
>;
export function listKPIs(records?: KPI[]) {
  if (records) {
    return records;
  }

  return Effect.gen(function* () {
    const repository = yield* KPIRepository;
    return yield* Effect.tryPromise({
      try: () => repository.list(),
      catch: (cause) => cause as KPIRepositoryError,
    });
  });
}
