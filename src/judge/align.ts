import { Effect } from "effect";
import { Clock, type Clock as ClockService, systemClock } from "../shared/ports";
import type { ValidationReport } from "../validation/schema";
import { JudgeProvider, type JudgeProviderError, type JudgeProvider as JudgeProviderService } from "./ports";
import { buildJudgePrompt } from "./prompt";
import type { JudgeRequest, JudgeResponse } from "./schema";

const defaultFallbackReport = (
  request: JudgeRequest,
  clock: ClockService = systemClock,
): ValidationReport => ({
  id: clock.newId(),
  workflow: "align",
  timestamp: clock.now().toISOString(),
  status: "needs_review",
  rationale: `Judge provider unavailable for mode ${request.mode}.`,
  evidenceRefs: [],
  followUps: ["Configure a judge provider before running alignment checks."],
});

const isJudgeResponse = (value: unknown): value is JudgeResponse => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as JudgeResponse;
  return (
    (candidate.status === "passed" ||
      candidate.status === "failed" ||
      candidate.status === "needs_review") &&
    typeof candidate.rationale === "string" &&
    Array.isArray(candidate.followUps) &&
    Array.isArray(candidate.evidenceRefs) &&
    candidate.followUps.every((item) => typeof item === "string") &&
    candidate.evidenceRefs.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        typeof item.kind === "string" &&
        typeof item.refId === "string" &&
        typeof item.summary === "string",
    )
  );
};

const toReport = (
  response: JudgeResponse,
  workflow: ValidationReport["workflow"],
  clock: ClockService,
): ValidationReport => ({
  id: clock.newId(),
  workflow,
  timestamp: clock.now().toISOString(),
  status: response.status,
  rationale: response.rationale,
  evidenceRefs: response.evidenceRefs,
  confidence: response.confidence,
  followUps: response.followUps,
});

export const judgeAlignEffect = (
  request: JudgeRequest,
): Effect.Effect<ValidationReport, JudgeProviderError, JudgeProvider | Clock> =>
  Effect.gen(function* () {
    const provider = yield* JudgeProvider;
    const clock = yield* Clock;
    const prompt = buildJudgePrompt(request);
    void prompt;

    let lastRaw = "";

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = yield* Effect.tryPromise({
        try: () => provider.judge(request),
        catch: (cause) =>
          ({
            _tag: "unreachable",
            provider: "judge",
            cause,
            message:
              cause instanceof Error ? cause.message : "Judge provider unreachable.",
          }) satisfies JudgeProviderError,
      });

      lastRaw = JSON.stringify(response);

      if (isJudgeResponse(response)) {
        return toReport(response, "align", clock);
      }
    }

    return yield* Effect.fail({
      _tag: "malformed_response",
      provider: "judge",
      raw: lastRaw,
      attempt: 3,
      message: "Judge response malformed after 3 attempts.",
    } satisfies JudgeProviderError);
  });

export const judgeAlign = async (
  request: JudgeRequest,
  provider?: JudgeProviderService,
  clock: ClockService = systemClock,
): Promise<ValidationReport> => {
  if (!provider) {
    return defaultFallbackReport(request, clock);
  }

  return Effect.runPromise(
    judgeAlignEffect(request).pipe(
      Effect.provideService(JudgeProvider, provider),
      Effect.provideService(Clock, clock),
    ),
  );
};
