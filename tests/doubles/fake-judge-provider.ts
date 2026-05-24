import type { JudgeProvider } from "../../src/judge/ports";
import type { JudgeRequest, JudgeResponse } from "../../src/judge/schema";

type FakeJudgeScript =
  | { response: unknown; throws?: never }
  | { response?: never; throws: unknown }
  | { steps: Array<{ response: unknown } | { throws: unknown }> };

export const createFakeJudgeProvider = (
  script: FakeJudgeScript,
): JudgeProvider & { calls: JudgeRequest[] } => {
  const calls: JudgeRequest[] = [];
  let index = 0;

  return {
    calls,
    judge: async (request: JudgeRequest): Promise<JudgeResponse> => {
      calls.push(request);

      if ("steps" in script) {
        const step = script.steps[Math.min(index, script.steps.length - 1)];
        index += 1;

        if ("throws" in step) {
          throw step.throws;
        }

        return step.response as JudgeResponse;
      }

      if ("throws" in script) {
        throw script.throws;
      }

      return script.response as JudgeResponse;
    },
  };
};
