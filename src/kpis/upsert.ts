import { Effect } from "effect";
import { KPIRepository, type KPIRepositoryError } from "./ports";
import type { KPI } from "./schema";

const upsertRecord = (records: KPI[], record: KPI): KPI[] => {
  const index = records.findIndex(({ id }) => id === record.id);
  if (index === -1) {
    return [...records, record];
  }

  const next = records.slice();
  next[index] = record;
  return next;
};

export function upsertKPI(records: KPI[], record: KPI): KPI[];
export function upsertKPI(
  record: KPI,
): Effect.Effect<{ id: string }, KPIRepositoryError, KPIRepository>;
export function upsertKPI(recordsOrRecord: KPI[] | KPI, record?: KPI) {
  if (Array.isArray(recordsOrRecord)) {
    return upsertRecord(recordsOrRecord, record as KPI);
  }

  return Effect.gen(function* () {
    const repository = yield* KPIRepository;
    yield* Effect.tryPromise({
      try: () => repository.save(recordsOrRecord),
      catch: (cause) => cause as KPIRepositoryError,
    });
    return { id: recordsOrRecord.id };
  });
}
