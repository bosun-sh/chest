import type { JudgeRequest } from "./schema";

export const buildJudgePrompt = (request: JudgeRequest): { system: string; user: string } => ({
  system: "You are a governance validation judge.",
  user: JSON.stringify(request, null, 2),
});
