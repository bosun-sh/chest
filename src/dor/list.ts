import { Effect } from "effect";
import { DoRRepository, type DoRRepositoryError } from "./ports";
import type { DoRCriterion } from "./schema";

export function listDoR(records: DoRCriterion[]): DoRCriterion[];
export function listDoR(): Effect.Effect<
  DoRCriterion[],
  DoRRepositoryError,
  DoRRepository
>;
export function listDoR(records?: DoRCriterion[]) {
  if (records) {
    return records;
  }

  return Effect.gen(function* () {
    const repository = yield* DoRRepository;
    return yield* Effect.tryPromise({
      try: () => repository.list(),
      catch: (cause) => cause as DoRRepositoryError,
    });
  });
}
