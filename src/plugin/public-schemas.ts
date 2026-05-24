const emptyObjectSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

const idSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
  },
  required: ["id"],
  additionalProperties: false,
} as const;

const okrRecordSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    objective: { type: "string" },
    keyResults: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          target: { type: "string" },
        },
        required: ["id", "description", "target"],
        additionalProperties: false,
      },
    },
    owner: { type: "string" },
    tags: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["id", "objective", "keyResults"],
  additionalProperties: false,
} as const;

const kpiRecordSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    target: { type: "string" },
    command: {
      type: "array",
      items: { type: "string" },
    },
    timeoutMs: { type: "number" },
    evidenceNormalizer: { type: "string" },
  },
  required: ["id", "name", "target", "command", "timeoutMs"],
  additionalProperties: false,
} as const;

const criterionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    text: { type: "string" },
    severity: { type: "string" },
    requiresKpi: { type: "string" },
  },
  required: ["id", "text", "severity"],
  additionalProperties: false,
} as const;

const validateReadySchema = {
  type: "object",
  properties: {
    plan: { type: "string" },
    ref: { type: "string" },
  },
  required: ["plan"],
  additionalProperties: false,
} as const;

const validateDoneSchema = {
  type: "object",
  properties: {
    work_evidence: { type: "string" },
    plan_ref: { type: "string" },
    kpi_results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
  required: ["work_evidence"],
  additionalProperties: false,
} as const;

const judgeAlignSchema = {
  type: "object",
  properties: {
    snapshot: {
      type: "object",
      properties: {
        okrs: { type: "array", items: { type: "object" } },
        kpis: { type: "array", items: { type: "object" } },
        dor: { type: "array", items: { type: "object" } },
        dod: { type: "array", items: { type: "object" } },
      },
      required: ["okrs", "kpis", "dor", "dod"],
      additionalProperties: false,
    },
    evidence: { type: "string" },
  },
  required: ["snapshot", "evidence"],
  additionalProperties: false,
} as const;

const reportsListSchema = {
  type: "object",
  properties: {
    workflow: { type: "string" },
    since: { type: "string" },
  },
  additionalProperties: false,
} as const;

export const chestInputSchemas = {
  init: {
    type: "object",
    properties: {
      dir: { type: "string" },
      force: { type: "boolean" },
    },
    additionalProperties: false,
  } as const,
  emptyObject: emptyObjectSchema,
  id: idSchema,
  okrRecord: okrRecordSchema,
  kpiRecord: kpiRecordSchema,
  criterion: criterionSchema,
  validateReady: validateReadySchema,
  validateDone: validateDoneSchema,
  judgeAlign: judgeAlignSchema,
  reportsList: reportsListSchema,
} as const;
