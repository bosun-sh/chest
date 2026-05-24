import { Effect } from "effect";
import { DoDRepository, type DoDRepositoryError } from "./ports";
import type { DoDCriterion } from "./schema";

const upsertRecord = (
  records: DoDCriterion[],
  record: DoDCriterion,
): DoDCriterion[] => {
  const index = records.findIndex(({ id }) => id === record.id);
  if (index === -1) {
    return [...records, record];
  }

  const next = records.slice();
  next[index] = record;
  return next;
};

export function upsertDoD(records: DoDCriterion[], record: DoDCriterion): DoDCriterion[];
export function upsertDoD(
  record: DoDCriterion,
): Effect.Effect<{ id: string }, DoDRepositoryError, DoDRepository>;
export function upsertDoD(recordsOrRecord: DoDCriterion[] | DoDCriterion, record?: DoDCriterion) {
  if (Array.isArray(recordsOrRecord)) {
    return upsertRecord(recordsOrRecord, record as DoDCriterion);
  }

  return Effect.gen(function* () {
    const repository = yield* DoDRepository;
    yield* Effect.tryPromise({
      try: () => repository.save(recordsOrRecord),
      catch: (cause) => cause as DoDRepositoryError,
    });
    return { id: recordsOrRecord.id };
  });
}
