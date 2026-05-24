import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { Clock } from "../../../src/shared/ports";
import { buildJudgePrompt } from "../../../src/judge/prompt";
import { JudgeProvider } from "../../../src/judge/ports";
import { judgeAlign, judgeAlignEffect } from "../../../src/judge/align";
import type { JudgeRequest } from "../../../src/judge/schema";
import { createFakeJudgeProvider } from "../../doubles/fake-judge-provider";

const request: JudgeRequest = {
  mode: "align",
  criteria: ["acceptance criteria"],
  okrs: [{ id: "okr-1", objective: "Deliver Chest", keyResults: [] }],
  evidence: "Feature is implemented and tested.",
};

const fixedClock = {
  now: () => new Date("2026-05-24T00:00:00Z"),
  newId: () => "rep-fixed",
};

describe("judge alignment", () => {
  it("assembles a readable prompt from the request", () => {
    const prompt = buildJudgePrompt(request);

    expect(prompt.system).toContain("governance");
    expect(prompt.user).toContain('"mode": "align"');
    expect(prompt.user).toContain("acceptance criteria");
  });

  it("normalizes a valid provider response into a validation report", async () => {
    const provider = createFakeJudgeProvider({
      response: {
        status: "passed",
        rationale: "All good.",
        confidence: 0.92,
        followUps: [],
        evidenceRefs: [{ kind: "okr", refId: "okr-1", summary: "aligned" }],
      },
    });

    const report = await judgeAlign(request, provider);

    expect(provider.calls).toHaveLength(1);
    expect(report.workflow).toBe("align");
    expect(report.status).toBe("passed");
    expect(report.rationale).toBe("All good.");
    expect(report.confidence).toBe(0.92);
    expect(report.evidenceRefs).toHaveLength(1);
  });

  it("retries malformed provider responses through the provider port until a valid response arrives", async () => {
    const provider = createFakeJudgeProvider({
      steps: [
        { response: { nope: true } },
        { response: { still: "bad" } },
        {
          response: {
            status: "needs_review",
            rationale: "Need more evidence.",
            followUps: ["Add rollout notes."],
            evidenceRefs: [],
          },
        },
      ],
    });

    const report = await Effect.runPromise(
      judgeAlignEffect(request).pipe(
        Effect.provideService(JudgeProvider, provider),
        Effect.provideService(Clock, fixedClock),
      ),
    );

    expect(provider.calls).toHaveLength(3);
    expect(report.status).toBe("needs_review");
    expect(report.rationale).toBe("Need more evidence.");
  });

  it("retries malformed responses before failing", async () => {
    const provider = createFakeJudgeProvider({
      response: { not: "a valid judge response" },
    });

    const result = await Effect.runPromise(
      Effect.either(
        judgeAlignEffect(request).pipe(
          Effect.provideService(JudgeProvider, provider),
          Effect.provideService(Clock, fixedClock),
        ),
      ),
    );

    expect(result).toMatchObject({
      _tag: "Left",
      left: { _tag: "malformed_response", attempt: 3 },
    });
    expect(provider.calls).toHaveLength(3);
  });

  it("surfaces provider unreachability", async () => {
    const provider = createFakeJudgeProvider({
      throws: new Error("provider is down"),
    });

    const result = await Effect.runPromise(
      Effect.either(
        judgeAlignEffect(request).pipe(
          Effect.provideService(JudgeProvider, provider),
          Effect.provideService(Clock, fixedClock),
        ),
      ),
    );

    expect(result).toMatchObject({
      _tag: "Left",
      left: { _tag: "unreachable" },
    });
  });
});
