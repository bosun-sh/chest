import { Effect } from "effect";
import { KPIRepository, type KPIRepositoryError } from "./ports";
import type { KPI } from "./schema";

export function getKPI(records: KPI[], id: string): KPI | undefined;
export function getKPI(
  id: string,
): Effect.Effect<KPI, KPIRepositoryError, KPIRepository>;
export function getKPI(recordsOrId: KPI[] | string, id?: string) {
  if (Array.isArray(recordsOrId)) {
    return recordsOrId.find((record) => record.id === id);
  }

  return Effect.gen(function* () {
    const repository = yield* KPIRepository;
    const record = yield* Effect.tryPromise({
      try: () => repository.findById(recordsOrId),
      catch: (cause) => cause as KPIRepositoryError,
    });

    if (!record) {
      return yield* Effect.fail({ _tag: "not_found", id: recordsOrId } as const);
    }

    return record;
  });
}
