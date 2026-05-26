import { Effect } from "effect";
import { OKRRepository, type OKRRepositoryError } from "./ports";
import type { OKR } from "./schema";

export function listOKRs(records: OKR[]): OKR[];
export function listOKRs(): Effect.Effect<
  OKR[],
  OKRRepositoryError,
  OKRRepository
>;
export function listOKRs(records?: OKR[]) {
  if (records) {
    return records;
  }

  return Effect.gen(function* () {
    const repository = yield* OKRRepository;
    return yield* Effect.tryPromise({
      try: () => repository.list(),
      catch: (cause) => cause as OKRRepositoryError,
    });
  });
}
