import { Effect } from "effect";
import { KPIRepository, type KPIRepositoryError } from "./ports";
import type { KPI } from "./schema";

export function removeKPI(records: KPI[], id: string): KPI[];
export function removeKPI(
  id: string,
): Effect.Effect<{ id: string }, KPIRepositoryError, KPIRepository>;
export function removeKPI(recordsOrId: KPI[] | string, id?: string) {
  if (Array.isArray(recordsOrId)) {
    return recordsOrId.filter((record) => record.id !== id);
  }

  return Effect.gen(function* () {
    const repository = yield* KPIRepository;
    yield* Effect.tryPromise({
      try: () => repository.remove(recordsOrId),
      catch: (cause) => cause as KPIRepositoryError,
    });
    return { id: recordsOrId };
  });
}
