import type { KPIEvidence } from "./schema";

const builtInNormalizers: Record<string, (evidence: KPIEvidence) => unknown> = {
  trim: (evidence) => evidence.stdout.trim(),
  stdout: (evidence) => evidence.stdout,
  stderr: (evidence) => evidence.stderr,
  exitCode: (evidence) => evidence.exitCode,
  json: (evidence) => {
    try {
      return JSON.parse(evidence.stdout);
    } catch {
      return evidence.stdout;
    }
  },
};

export const normalizeKPIEvidence = (
  evidence: KPIEvidence,
  normalizer?: string,
): KPIEvidence => {
  if (!normalizer) {
    return evidence;
  }

  return {
    ...evidence,
    normalizedValue: builtInNormalizers[normalizer]?.(evidence) ?? evidence.stdout.trim(),
  };
};
