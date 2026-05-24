import type { JudgeProvider } from "../../ports";
import type { JudgeRequest, JudgeResponse } from "../../schema";

export const createOpenAIJudgeAdapter = (): JudgeProvider => ({
  judge: async (_request: JudgeRequest): Promise<JudgeResponse> => ({
    status: "needs_review",
    rationale: "OpenAI judge adapter is scaffolded but not wired.",
    followUps: ["Configure the provider and prompt assembly."],
    evidenceRefs: [],
  }),
});
