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
