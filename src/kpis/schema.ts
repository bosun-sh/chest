export type KPI = {
  id: string;
  name: string;
  target: string;
  command: string[];
  timeoutMs: number;
  evidenceNormalizer?: string;
};

export type KPIEvidence = {
  kpiId: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs: number;
  normalizedValue?: unknown;
};
