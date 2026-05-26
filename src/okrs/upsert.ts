import { Effect } from "effect";
import { OKRRepository, type OKRRepositoryError } from "./ports";
import type { OKR } from "./schema";

const upsertRecord = (records: OKR[], record: OKR): OKR[] => {
  const index = records.findIndex(({ id }) => id === record.id);
  if (index === -1) {
    return [...records, record];
  }

  const next = records.slice();
  next[index] = record;
  return next;
};

export function upsertOKR(records: OKR[], record: OKR): OKR[];
export function upsertOKR(
  record: OKR,
): Effect.Effect<{ id: string }, OKRRepositoryError, OKRRepository>;
export function upsertOKR(recordsOrRecord: OKR[] | OKR, record?: OKR) {
  if (Array.isArray(recordsOrRecord)) {
    return upsertRecord(recordsOrRecord, record as OKR);
  }

  return Effect.gen(function* () {
    const repository = yield* OKRRepository;
    yield* Effect.tryPromise({
      try: () => repository.save(recordsOrRecord),
      catch: (cause) => cause as OKRRepositoryError,
    });
    return { id: recordsOrRecord.id };
  });
}
