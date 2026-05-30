import type { ValidationReport } from "../validation/schema";

export type { EvidenceRef, ValidationReport } from "../validation/schema";

export type ReportSummary = {
  id: string;
  workflow: "ready" | "done" | "align" | "judge" | "kpi";
  timestamp: string;
  status: "passed" | "failed" | "needs_review";
};

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number" && !Number.isNaN(value);

export const isValidationReport = (value: unknown): value is ValidationReport => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const report = value as Partial<ValidationReport>;
  return (
    isString(report.id) &&
    (report.workflow === "ready" ||
      report.workflow === "done" ||
      report.workflow === "align" ||
      report.workflow === "judge" ||
      report.workflow === "kpi") &&
    isString(report.timestamp) &&
    (report.status === "passed" ||
      report.status === "failed" ||
      report.status === "needs_review") &&
    isString(report.rationale) &&
    Array.isArray(report.evidenceRefs) &&
    report.evidenceRefs.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        isString((item as { kind?: unknown }).kind) &&
        isString((item as { refId?: unknown }).refId) &&
        isString((item as { summary?: unknown }).summary),
    ) &&
    (report.confidence === undefined || isNumber(report.confidence)) &&
    Array.isArray(report.followUps) &&
    report.followUps.every(isString)
  );
};

export const toReportSummary = (report: ValidationReport): ReportSummary => ({
  id: report.id,
  workflow: report.workflow,
  timestamp: report.timestamp,
  status: report.status,
});
