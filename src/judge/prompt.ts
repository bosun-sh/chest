import type { JudgeRequest } from "./schema";

export const buildJudgePrompt = (request: JudgeRequest): { system: string; user: string } => {
  const system = [
    "You are a governance validation judge.",
    "Evaluate the supplied governance criteria and evidence objectively.",
    "Return JSON with status, rationale, confidence, followUps, and evidenceRefs.",
  ].join(" ");

  const user = JSON.stringify(
    {
      mode: request.mode,
      criteria: request.criteria,
      okrs: request.okrs,
      evidence: request.evidence,
      kpiEvidence: request.kpiEvidence,
    },
    null,
    2,
  );

  return { system, user };
};
