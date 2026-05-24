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

export type SchemaViolation = {
  path: string;
  constraint: string;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; violations: SchemaViolation[] };

const isString = (value: unknown): value is string => typeof value === "string";

const validateKPI = (value: unknown, index: number): ValidationResult<KPI> => {
  if (typeof value !== "object" || value === null) {
    return {
      ok: false,
      violations: [{ path: `records[${index}]`, constraint: "object required" }],
    };
  }

  const record = value as Partial<KPI>;
  const violations: SchemaViolation[] = [];

  if (!isString(record.id) || record.id.trim() === "") {
    violations.push({ path: `records[${index}].id`, constraint: "required field missing" });
  }
  if (!isString(record.name) || record.name.trim() === "") {
    violations.push({ path: `records[${index}].name`, constraint: "required field missing" });
  }
  if (!isString(record.target) || record.target.trim() === "") {
    violations.push({ path: `records[${index}].target`, constraint: "required field missing" });
  }
  if (!Array.isArray(record.command) || record.command.some((value) => !isString(value))) {
    violations.push({ path: `records[${index}].command`, constraint: "required field missing" });
  }
  if (typeof record.timeoutMs !== "number" || Number.isNaN(record.timeoutMs)) {
    violations.push({ path: `records[${index}].timeoutMs`, constraint: "required field missing" });
  }
  if (record.evidenceNormalizer !== undefined && !isString(record.evidenceNormalizer)) {
    violations.push({
      path: `records[${index}].evidenceNormalizer`,
      constraint: "must be a string",
    });
  }

  return violations.length ? { ok: false, violations } : { ok: true, data: record as KPI };
};

export const validateKPIs = (value: unknown): ValidationResult<KPI[]> => {
  if (!Array.isArray(value)) {
    return { ok: false, violations: [{ path: "records", constraint: "array required" }] };
  }

  const records: KPI[] = [];
  const violations: SchemaViolation[] = [];
  value.forEach((item, index) => {
    const result = validateKPI(item, index);
    if (result.ok) {
      records.push(result.data);
    } else {
      violations.push(...result.violations);
    }
  });

  return violations.length ? { ok: false, violations } : { ok: true, data: records };
};
