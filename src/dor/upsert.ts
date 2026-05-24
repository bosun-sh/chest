import { Effect } from "effect";
import { DoRRepository, type DoRRepositoryError } from "./ports";
import type { DoRCriterion } from "./schema";

const upsertRecord = (
  records: DoRCriterion[],
  record: DoRCriterion,
): DoRCriterion[] => {
  const index = records.findIndex(({ id }) => id === record.id);
  if (index === -1) {
    return [...records, record];
  }

  const next = records.slice();
  next[index] = record;
  return next;
};

export function upsertDoR(records: DoRCriterion[], record: DoRCriterion): DoRCriterion[];
export function upsertDoR(
  record: DoRCriterion,
): Effect.Effect<{ id: string }, DoRRepositoryError, DoRRepository>;
export function upsertDoR(recordsOrRecord: DoRCriterion[] | DoRCriterion, record?: DoRCriterion) {
  if (Array.isArray(recordsOrRecord)) {
    return upsertRecord(recordsOrRecord, record as DoRCriterion);
  }

  return Effect.gen(function* () {
    const repository = yield* DoRRepository;
    yield* Effect.tryPromise({
      try: () => repository.save(recordsOrRecord),
      catch: (cause) => cause as DoRRepositoryError,
    });
    return { id: recordsOrRecord.id };
  });
}
