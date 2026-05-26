export type DoRCriterion = {
  id: string;
  text: string;
  severity: "blocking" | "warning" | "info" | "advisory";
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
): ValidationResult<DoRCriterion> => {
  if (typeof value !== "object" || value === null) {
    return {
      ok: false,
      violations: [{ path: `records[${index}]`, constraint: "object required" }],
    };
  }

  const record = value as Partial<DoRCriterion>;
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

  return violations.length ? { ok: false, violations } : { ok: true, data: record as DoRCriterion };
};

export const validateDoR = (value: unknown): ValidationResult<DoRCriterion[]> => {
  if (!Array.isArray(value)) {
    return { ok: false, violations: [{ path: "records", constraint: "array required" }] };
  }

  const records: DoRCriterion[] = [];
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
