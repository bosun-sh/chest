export type DoDCriterion = {
  id: string;
  text: string;
  severity: "blocking" | "warning" | "info" | "advisory";
  requiresKpi?: string;
};

export type SchemaViolation = {
  path: string;
  constraint: string;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; violations: SchemaViolation[] };

const isString = (value: unknown): value is string => typeof value === "string";

const validateCriterion = (
  value: unknown,
  index: number,
): ValidationResult<DoDCriterion> => {
  if (typeof value !== "object" || value === null) {
    return {
      ok: false,
      violations: [{ path: `records[${index}]`, constraint: "object required" }],
    };
  }

  const record = value as Partial<DoDCriterion>;
  const violations: SchemaViolation[] = [];

  if (!isString(record.id) || record.id.trim() === "") {
    violations.push({ path: `records[${index}].id`, constraint: "required field missing" });
  }
  if (!isString(record.text) || record.text.trim() === "") {
    violations.push({ path: `records[${index}].text`, constraint: "required field missing" });
  }
  if (
    !isString(record.severity) ||
    !["blocking", "warning", "info", "advisory"].includes(record.severity)
  ) {
    violations.push({ path: `records[${index}].severity`, constraint: "invalid enum value" });
  }
  if (record.requiresKpi !== undefined && !isString(record.requiresKpi)) {
    violations.push({ path: `records[${index}].requiresKpi`, constraint: "must be a string" });
  }

  return violations.length ? { ok: false, violations } : { ok: true, data: record as DoDCriterion };
};

export const validateDoD = (value: unknown): ValidationResult<DoDCriterion[]> => {
  if (!Array.isArray(value)) {
    return { ok: false, violations: [{ path: "records", constraint: "array required" }] };
  }

  const records: DoDCriterion[] = [];
  const violations: SchemaViolation[] = [];
  value.forEach((item, index) => {
    const result = validateCriterion(item, index);
    if (result.ok) {
      records.push(result.data);
    } else {
      violations.push(...result.violations);
    }
  });

  return violations.length ? { ok: false, violations } : { ok: true, data: records };
};
