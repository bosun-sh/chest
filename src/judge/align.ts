import { newId } from "../shared/ids";
import { nowIso } from "../shared/time";
import type { ValidationReport } from "../validation/schema";
import type { JudgeRequest } from "./schema";

export const judgeAlign = async (request: JudgeRequest): Promise<ValidationReport> => ({
  id: newId(),
  workflow: "judge",
  timestamp: nowIso(),
  status: "needs_review",
  rationale: `Scaffold judge alignment placeholder for mode ${request.mode}.`,
  evidenceRefs: [],
  followUps: ["Implement judge provider integration."],
});
