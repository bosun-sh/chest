import { Effect } from "effect";
import { OKRRepository, type OKRRepositoryError } from "./ports";
import type { OKR } from "./schema";

export function getOKR(records: OKR[], id: string): OKR | undefined;
export function getOKR(
  id: string,
): Effect.Effect<OKR, OKRRepositoryError, OKRRepository>;
export function getOKR(recordsOrId: OKR[] | string, id?: string) {
  if (Array.isArray(recordsOrId)) {
    return recordsOrId.find((record) => record.id === id);
  }

  return Effect.gen(function* () {
    const repository = yield* OKRRepository;
    const record = yield* Effect.tryPromise({
      try: () => repository.findById(recordsOrId),
      catch: (cause) => cause as OKRRepositoryError,
    });

    if (!record) {
      return yield* Effect.fail({ _tag: "not_found", id: recordsOrId } as const);
    }

    return record;
  });
}
