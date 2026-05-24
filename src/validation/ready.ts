import { newId } from "../shared/ids";
import { nowIso } from "../shared/time";
import type { ValidationReport } from "./schema";
import { validateReadyRules } from "./rules";

export const validateReady = (plan: string): ValidationReport => ({
  id: newId(),
  workflow: "ready",
  timestamp: nowIso(),
  status: validateReadyRules(plan) ? "passed" : "needs_review",
  rationale: validateReadyRules(plan)
    ? "Plan has a non-empty description."
    : "Plan is empty.",
  evidenceRefs: [],
  followUps: [],
});
