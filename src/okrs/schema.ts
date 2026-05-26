export type KeyResult = {
  id: string;
  description: string;
  target: string;
};

export type OKR = {
  id: string;
  objective: string;
  keyResults: KeyResult[];
  owner?: string;
  tags?: string[];
};

export type SchemaViolation = {
  path: string;
  constraint: string;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; violations: SchemaViolation[] };

const isString = (value: unknown): value is string => typeof value === "string";

const validateKeyResult = (
  value: unknown,
  index: number,
  parent: string,
): ValidationResult<KeyResult> => {
  if (typeof value !== "object" || value === null) {
    return {
      ok: false,
      violations: [{ path: `${parent}[${index}]`, constraint: "object required" }],
    };
  }

  const record = value as Partial<KeyResult>;
  const violations: SchemaViolation[] = [];

  if (!isString(record.id) || record.id.trim() === "") {
    violations.push({ path: `${parent}[${index}].id`, constraint: "required field missing" });
  }
  if (!isString(record.description) || record.description.trim() === "") {
    violations.push({
      path: `${parent}[${index}].description`,
      constraint: "required field missing",
    });
  }
  if (!isString(record.target) || record.target.trim() === "") {
    violations.push({ path: `${parent}[${index}].target`, constraint: "required field missing" });
  }

  return violations.length ? { ok: false, violations } : { ok: true, data: record as KeyResult };
};

const validateOKR = (value: unknown, index: number): ValidationResult<OKR> => {
  if (typeof value !== "object" || value === null) {
    return {
      ok: false,
      violations: [{ path: `records[${index}]`, constraint: "object required" }],
    };
  }

  const record = value as Partial<OKR>;
  const violations: SchemaViolation[] = [];

  if (!isString(record.id) || record.id.trim() === "") {
    violations.push({ path: `records[${index}].id`, constraint: "required field missing" });
  }
  if (!isString(record.objective) || record.objective.trim() === "") {
    violations.push({ path: `records[${index}].objective`, constraint: "required field missing" });
  }
  if (!Array.isArray(record.keyResults) || record.keyResults.length === 0) {
    violations.push({
      path: `records[${index}].keyResults`,
      constraint: "required field missing",
    });
  } else {
    record.keyResults.forEach((item, childIndex) => {
      const result = validateKeyResult(item, childIndex, `records[${index}].keyResults`);
      if (!result.ok) {
        violations.push(...result.violations);
      }
    });
  }
  if (record.owner !== undefined && !isString(record.owner)) {
    violations.push({ path: `records[${index}].owner`, constraint: "must be a string" });
  }
  if (record.tags !== undefined) {
    if (!Array.isArray(record.tags) || record.tags.some((tag) => !isString(tag))) {
      violations.push({ path: `records[${index}].tags`, constraint: "must be a string array" });
    }
  }

  return violations.length ? { ok: false, violations } : { ok: true, data: record as OKR };
};

export const validateOKRs = (value: unknown): ValidationResult<OKR[]> => {
  if (!Array.isArray(value)) {
    return { ok: false, violations: [{ path: "records", constraint: "array required" }] };
  }

  const records: OKR[] = [];
  const violations: SchemaViolation[] = [];
  value.forEach((item, index) => {
    const result = validateOKR(item, index);
    if (result.ok) {
      records.push(result.data);
    } else {
      violations.push(...result.violations);
    }
  });

  return violations.length ? { ok: false, violations } : { ok: true, data: records };
};
