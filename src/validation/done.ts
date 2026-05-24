import { newId } from "../shared/ids";
import { nowIso } from "../shared/time";
import type { DoDCriterion } from "../dod/schema";
import type { JudgeProvider } from "../judge/ports";
import { judgeAlign } from "../judge/align";
import type { KPIEvidence } from "../kpis/schema";
import type { OKR } from "../okrs/schema";
import type { ValidationReport } from "./schema";
import { validateDoneRules } from "./rules";

const kpiEvidenceRefs = (kpiEvidence: KPIEvidence[]) =>
  kpiEvidence.map((item) => ({
    kind: "kpi",
    refId: item.kpiId,
    summary: `exit ${item.exitCode}${item.timedOut ? ", timed out" : ""}`,
  }));

const fallbackDoneReport = (
  evidence: string,
  kpiEvidence: KPIEvidence[],
): ValidationReport => ({
  id: newId(),
  workflow: "done",
  timestamp: nowIso(),
  status: validateDoneRules(evidence) ? "passed" : "needs_review",
  rationale: validateDoneRules(evidence)
    ? "Work evidence has a non-empty description."
    : "Work evidence is empty.",
  evidenceRefs: kpiEvidenceRefs(kpiEvidence),
  followUps: [],
});

export const validateDone = async (
  evidence: string,
  dod: DoDCriterion[] = [],
  okrs: OKR[] = [],
  kpiEvidence: KPIEvidence[] = [],
  provider?: JudgeProvider,
): Promise<ValidationReport> => {
  if (!provider) {
    return fallbackDoneReport(evidence, kpiEvidence);
  }

  const report = await judgeAlign(
    {
      mode: "done",
      criteria: dod,
      okrs,
      evidence,
      kpiEvidence,
    },
    provider,
  );

  return {
    ...report,
    workflow: "done",
    evidenceRefs: [...kpiEvidenceRefs(kpiEvidence), ...report.evidenceRefs],
  };
};
