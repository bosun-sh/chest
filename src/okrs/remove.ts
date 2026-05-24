import { Effect } from "effect";
import { OKRRepository, type OKRRepositoryError } from "./ports";
import type { OKR } from "./schema";

export function removeOKR(records: OKR[], id: string): OKR[];
export function removeOKR(
  id: string,
): Effect.Effect<{ id: string }, OKRRepositoryError, OKRRepository>;
export function removeOKR(recordsOrId: OKR[] | string, id?: string) {
  if (Array.isArray(recordsOrId)) {
    return recordsOrId.filter((record) => record.id !== id);
  }

  return Effect.gen(function* () {
    const repository = yield* OKRRepository;
    yield* Effect.tryPromise({
      try: () => repository.remove(recordsOrId),
      catch: (cause) => cause as OKRRepositoryError,
    });
    return { id: recordsOrId };
  });
}
