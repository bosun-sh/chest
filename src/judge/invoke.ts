import { Effect } from "effect";
import type { JudgeProvider, JudgeProviderError } from "./ports";

export const invokeJudge = <Request, Response>(
  request: Request,
  provider: JudgeProvider<Request, unknown>,
  isResponse: (value: unknown) => value is Response,
  attempts: number,
  snapshotResponse?: (value: Response) => Response,
): Effect.Effect<Response, JudgeProviderError> => Effect.gen(function* () {
  let raw = "";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = yield* Effect.tryPromise({
      try: () => provider.judge(request),
      catch: (cause): JudgeProviderError => ({
        _tag: "unreachable",
        provider: "judge",
        cause,
        message: cause instanceof Error ? cause.message : "Judge provider unreachable.",
      }),
    });
    try {
      if (isResponse(response)) {
        if (!snapshotResponse) return response;
        const snapshot = snapshotResponse(response);
        // Validate both: cloning can discard properties, and getters can change values.
        if (isResponse(snapshot)) return snapshot;
      }
    } catch {
      // Snapshot/property-access failures are malformed output, not provider outages.
    }
    try {
      raw = JSON.stringify(response) ?? String(response);
    } catch {
      raw = "[unserializable response]";
    }
  }
  return yield* Effect.fail({
    _tag: "malformed_response",
    provider: "judge",
    raw,
    attempt: attempts,
    message: `Judge response malformed after ${attempts} attempts.`,
  } satisfies JudgeProviderError);
});
