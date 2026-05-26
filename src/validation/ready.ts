import { newId } from "../shared/ids";
import { nowIso } from "../shared/time";
import type { DoRCriterion } from "../dor/schema";
import type { JudgeProvider } from "../judge/ports";
import { judgeAlign } from "../judge/align";
import type { OKR } from "../okrs/schema";
import type { ValidationReport } from "./schema";
import { ruleBasedReadinessCheck, validateReadyRules } from "./rules";

const fallbackReadyReport = (plan: string, dor: DoRCriterion[]): ValidationReport => {
  const response = ruleBasedReadinessCheck(plan, dor);

  return {
    id: newId(),
    workflow: "ready",
    timestamp: nowIso(),
    status: response.status,
    rationale: response.rationale,
    evidenceRefs: response.evidenceRefs,
    followUps: response.followUps,
  };
};

export const validateReady = async (
  plan: string,
  dor: DoRCriterion[] = [],
  okrs: OKR[] = [],
  provider?: JudgeProvider,
): Promise<ValidationReport> => {
  if (!validateReadyRules(plan) || !provider) {
    return fallbackReadyReport(plan, dor);
  }

  try {
    const report = await judgeAlign(
      {
        mode: "ready",
        criteria: dor,
        okrs,
        evidence: plan,
      },
      provider,
    );

    return {
      ...report,
      workflow: "ready",
    };
  } catch (error) {
    if (error && typeof error === "object" && (error as { _tag?: string })._tag === "unreachable") {
      return fallbackReadyReport(plan, dor);
    }

    throw error;
  }
};
