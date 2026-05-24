import { Effect } from "effect";
import { DoDRepository, type DoDRepositoryError } from "./ports";
import type { DoDCriterion } from "./schema";

export function listDoD(records: DoDCriterion[]): DoDCriterion[];
export function listDoD(): Effect.Effect<
  DoDCriterion[],
  DoDRepositoryError,
  DoDRepository
>;
export function listDoD(records?: DoDCriterion[]) {
  if (records) {
    return records;
  }

  return Effect.gen(function* () {
    const repository = yield* DoDRepository;
    return yield* Effect.tryPromise({
      try: () => repository.list(),
      catch: (cause) => cause as DoDRepositoryError,
    });
  });
}
