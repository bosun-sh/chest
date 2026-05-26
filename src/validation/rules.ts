import type { DoRCriterion } from "../dor/schema";
import type { JudgeResponse, ValidationReport } from "./schema";

export const validateReadyRules = (plan: string): boolean => plan.trim().length > 0;

export const validateDoneRules = (evidence: string): boolean =>
  evidence.trim().length > 0;

export const isValidValidationReport = (
  report: ValidationReport,
): boolean =>
  report.id.trim().length > 0 &&
  report.rationale.trim().length > 0 &&
  Array.isArray(report.evidenceRefs) &&
  Array.isArray(report.followUps);

const normalize = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

export const ruleBasedReadinessCheck = (
  plan: string,
  criteria: DoRCriterion[],
): JudgeResponse => {
  const blocking = criteria.filter((criterion) => criterion.severity === "blocking");
  const normalizedPlan = normalize(plan);
  const missing = blocking.filter((criterion) => !normalizedPlan.includes(normalize(criterion.text)));
  const satisfied = blocking.filter((criterion) => !missing.some((item) => item.id === criterion.id));

  if (missing.length > 0) {
    return {
      status: "failed",
      rationale: `Plan is missing blocking criteria: ${missing.map((criterion) => criterion.text).join(", ")}.`,
      followUps: missing.map((criterion) => `Add ${criterion.text.toLowerCase()}.`),
      evidenceRefs: satisfied.map((criterion) => ({
        kind: "plan",
        refId: criterion.id,
        summary: criterion.text,
      })),
    };
  }

  return {
    status: "needs_review",
    rationale: "Judge unavailable; rule-based check passed blocking criteria. Human review recommended.",
    followUps: ["Judge provider was unreachable. Consider re-running when available."],
    evidenceRefs: blocking.map((criterion) => ({
      kind: "plan",
      refId: criterion.id,
      summary: criterion.text,
    })),
  };
};
