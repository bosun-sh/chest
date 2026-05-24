import { newId } from "../shared/ids";
import { nowIso } from "../shared/time";
import type { ValidationReport } from "./schema";
import { validateDoneRules } from "./rules";

export const validateDone = (evidence: string): ValidationReport => ({
  id: newId(),
  workflow: "done",
  timestamp: nowIso(),
  status: validateDoneRules(evidence) ? "passed" : "needs_review",
  rationale: validateDoneRules(evidence)
    ? "Work evidence has a non-empty description."
    : "Work evidence is empty.",
  evidenceRefs: [],
  followUps: [],
});
