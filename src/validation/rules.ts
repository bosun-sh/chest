import type { ValidationReport } from "./schema";

export const validateReadyRules = (plan: string): boolean => plan.trim().length > 0;

export const validateDoneRules = (evidence: string): boolean =>
  evidence.trim().length > 0;

export const isValidValidationReport = (
  report: ValidationReport,
): boolean => report.id.trim().length > 0 && report.rationale.trim().length > 0;
