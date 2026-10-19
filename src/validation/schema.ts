export type EvidenceRef = {
  kind: string;
  refId: string;
  summary: string;
};

export type ValidationReport = {
  id: string;
  workflow: "ready" | "done" | "align" | "judge" | "kpi";
  timestamp: string;
  status: "passed" | "failed" | "needs_review";
  rationale: string;
  evidenceRefs: EvidenceRef[];
  confidence?: number;
  followUps: string[];
};

export type JudgeRequest = {
  mode: string;
  criteria: unknown[];
  okrs: unknown[];
  evidence: unknown;
  kpiEvidence?: unknown[];
};

export type JudgeResponse = {
  status: "passed" | "failed" | "needs_review";
  rationale: string;
  confidence?: number;
  followUps: string[];
  evidenceRefs: EvidenceRef[];
};

export type GovernanceSnapshot = {
  okrs: unknown[];
  kpis: unknown[];
  dor: unknown[];
  dod: unknown[];
};

export type JudgeEvidenceRef = EvidenceRef & { digest: string };

export type JudgeBinding = {
  taskId: string;
  taskRevision: string;
  candidateRevision: string;
  criteria: Array<{ id: string; text: string }>;
  evidenceRefs: JudgeEvidenceRef[];
};

export type JudgeValidationRequest = {
  mode: "ready" | "done";
  binding: JudgeBinding;
};

export type JudgeValidationResponse = Omit<JudgeResponse, "evidenceRefs"> & JudgeValidationRequest & {
  source: "judge" | "fallback";
  evidenceRefs: JudgeEvidenceRef[];
};

export type JudgeValidationReport = Omit<ValidationReport, "evidenceRefs"> & {
  verdict: "pass" | "fail" | "inconclusive" | "unavailable";
  binding: JudgeBinding;
  source: "judge" | "fallback" | "none";
  evidenceRefs: JudgeEvidenceRef[];
};
