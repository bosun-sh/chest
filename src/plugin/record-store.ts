import { mkdir, readFile, readdir } from "node:fs/promises";
import { fail, ok, type ToolResult } from "../shared/result";
import {
  ERR_CHEST_01,
  ERR_CHEST_02,
  ERR_CHEST_03,
  ERR_CHEST_05,
  ERR_CHEST_08,
  ERR_CHEST_09,
} from "../shared/error-codes";
import { findById, removeById, upsertById } from "../workspace/yaml-repository";
import { resolveChestPaths } from "../workspace/storage-paths";
import type { ValidationReport } from "../validation/schema";
import { parseYaml, stringifyYaml } from "../shared/yaml-parse";
import { isValidationReport, toReportSummary, type ReportSummary } from "../reports/schema";
import { atomicWriteText } from "../shared/atomic-write";
import { validateOKRs } from "../okrs/schema";
import { validateKPIs } from "../kpis/schema";
import { validateDoR } from "../dor/schema";
import { validateDoD } from "../dod/schema";

type CollectionName = "okrs" | "kpis" | "dor" | "dod";
type SchemaViolation = { path: string; constraint: string };
type ValidationResult<T> = { ok: true; data: T } | { ok: false; violations: SchemaViolation[] };

type CollectionMeta<T> = {
  label: string;
  validateList(value: unknown): ValidationResult<T[]>;
};

const REPORT_FILE_EXTENSIONS = [".yaml", ".yml", ".json"] as const;

const isReportFileName = (name: string): boolean =>
  REPORT_FILE_EXTENSIONS.some((extension) => name.endsWith(extension));

const collectionMeta: { [K in CollectionName]: CollectionMeta<unknown> } = {
  okrs: { label: "OKR", validateList: validateOKRs },
  kpis: { label: "KPI", validateList: validateKPIs },
  dor: { label: "DoR criterion", validateList: validateDoR },
  dod: { label: "DoD criterion", validateList: validateDoD },
};

const collectionFile = (root: string, collection: CollectionName): string => {
  const paths = resolveChestPaths(root);
  return {
    okrs: paths.okrsFile,
    kpis: paths.kpisFile,
    dor: paths.dorFile,
    dod: paths.dodFile,
  }[collection];
};

const missingStoreResult = (path: string) =>
  fail(
    ERR_CHEST_03,
    `Governance file not found: ${path}. Run chest.init to create the governance store.`,
    { path },
  );

const schemaViolationResult = (
  path: string,
  violations: SchemaViolation[],
  message = `Governance file at ${path} failed schema validation.`,
) =>
  fail(ERR_CHEST_02, message, {
    file: path,
    violations,
  });

const normalizeCollectionName = (collection: CollectionName): string => collectionMeta[collection].label;

const validateRecordInput = <T>(
  collection: CollectionName,
  record: T,
): ValidationResult<T> => {
  const result = collectionMeta[collection].validateList([record]);

  if (!result.ok) {
    return {
      ok: false,
      violations: result.violations.map((violation) => ({
        path: violation.path.replace(/^records\[0\]/, "record"),
        constraint: violation.constraint,
      })),
    };
  }

  return { ok: true, data: result.data[0] as T };
};

export const loadCollection = async <T extends { id: string }>(
  root: string,
  collection: CollectionName,
): Promise<ToolResult<T[]>> => {
  const filePath = collectionFile(root, collection);

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = parseYaml<unknown>(raw);
    const result = collectionMeta[collection].validateList(parsed);

    if (!result.ok) {
      return schemaViolationResult(filePath, result.violations);
    }

    return ok(result.data as T[]);
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "ENOENT") {
      return missingStoreResult(filePath) as ToolResult<T[]>;
    }

    return fail(ERR_CHEST_01, `Governance file could not be parsed: ${filePath}.`, error);
  }
};

export const saveCollection = async <T extends { id: string }>(
  root: string,
  collection: CollectionName,
  items: T[],
): Promise<ToolResult<{ path: string }>> => {
  const filePath = collectionFile(root, collection);
  try {
    const result = collectionMeta[collection].validateList(items);
    if (!result.ok) {
      return schemaViolationResult(filePath, result.violations);
    }

    await atomicWriteText(filePath, stringifyYaml(items));
    return ok({ path: filePath });
  } catch (error) {
    return fail(ERR_CHEST_05, `Governance file could not be written: ${filePath}.`, error);
  }
};

export const readRecord = async <T extends { id: string }>(
  root: string,
  collection: CollectionName,
  id: string,
): Promise<ToolResult<T>> => {
  const loaded = await loadCollection<T>(root, collection);
  if (!loaded.ok) {
    return loaded as ToolResult<T>;
  }

  const record = findById(loaded.data, id);
  if (!record) {
    return fail(ERR_CHEST_02, `${normalizeCollectionName(collection)} with id '${id}' not found.`);
  }

  return ok(record);
};

export const upsertRecord = async <T extends { id: string }>(
  root: string,
  collection: CollectionName,
  record: T,
): Promise<ToolResult<{ op: "inserted" | "updated"; id: string }>> => {
  const validatedRecord = validateRecordInput(collection, record);
  if (!validatedRecord.ok) {
    return schemaViolationResult(
      collectionFile(root, collection),
      validatedRecord.violations,
      `${normalizeCollectionName(collection)} record failed schema validation.`,
    );
  }

  const loaded = await loadCollection<T>(root, collection);
  if (!loaded.ok) {
    return loaded as ToolResult<{ op: "inserted" | "updated"; id: string }>;
  }

  const index = loaded.data.findIndex((item) => item.id === validatedRecord.data.id);
  const next = upsertById(loaded.data, validatedRecord.data);
  const saved = await saveCollection(root, collection, next);
  if (!saved.ok) {
    return saved;
  }

  return ok({
    op: index === -1 ? "inserted" : "updated",
    id: validatedRecord.data.id,
  });
};

export const removeRecord = async (
  root: string,
  collection: CollectionName,
  id: string,
): Promise<ToolResult<{ op: "removed"; id: string }>> => {
  const loaded = await loadCollection<{ id: string }>(root, collection);
  if (!loaded.ok) {
    return loaded as ToolResult<{ op: "removed"; id: string }>;
  }

  const exists = loaded.data.some((item) => item.id === id);
  if (!exists) {
    return fail(ERR_CHEST_02, `${normalizeCollectionName(collection)} with id '${id}' not found; nothing removed.`);
  }

  const next = removeById(loaded.data, id);
  const saved = await saveCollection(root, collection, next);
  if (!saved.ok) {
    return saved;
  }

  return ok({
    op: "removed" as const,
    id,
  });
};

export const writeReportFile = async (
  root: string,
  report: ValidationReport,
): Promise<ToolResult<{ path: string }>> => {
  const paths = resolveChestPaths(root);
  const filePath = `${paths.reportsDir}/${report.timestamp.replace(/[:.]/g, "-")}-${report.workflow}.yaml`;
  try {
    await mkdir(paths.reportsDir, { recursive: true });
    await atomicWriteText(filePath, stringifyYaml(report));
    return ok({ path: filePath });
  } catch (error) {
    return fail(ERR_CHEST_05, `Report could not be written: ${filePath}.`, error);
  }
};

export const listReportFiles = async (
  root: string,
  filter?: { workflow?: string; since?: string },
): Promise<ToolResult<ReportSummary[]>> => {
  const paths = resolveChestPaths(root);
  try {
    const entries = await readdir(paths.reportsDir, { withFileTypes: true });
    const reports: ReportSummary[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !isReportFileName(entry.name)) {
        continue;
      }

      const filePath = `${paths.reportsDir}/${entry.name}`;
      const raw = await readFile(filePath, "utf8");
      const report = parseYaml<unknown>(raw);
      if (!isValidationReport(report)) {
        return fail(ERR_CHEST_08, `Report file at ${filePath} does not match report.v1 schema.`);
      }
      if (filter?.workflow && report.workflow !== filter.workflow) {
        continue;
      }
      if (filter?.since && report.timestamp < filter.since) {
        continue;
      }
      reports.push(toReportSummary(report));
    }

    reports.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
    return ok(reports);
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "ENOENT") {
      return fail(ERR_CHEST_03, `reports/ directory not found at ${paths.reportsDir}. Run a validation workflow first.`);
    }

    return fail(ERR_CHEST_09, `Could not read validation reports at ${paths.reportsDir}.`, error);
  }
};

export const readReportFile = async (
  root: string,
  id: string,
): Promise<ToolResult<ValidationReport>> => {
  const paths = resolveChestPaths(root);

  try {
    const entries = await readdir(paths.reportsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !isReportFileName(entry.name)) {
        continue;
      }

      const filePath = `${paths.reportsDir}/${entry.name}`;
      const raw = await readFile(filePath, "utf8");
      const report = parseYaml<unknown>(raw);
      if (!isValidationReport(report)) {
        return fail(ERR_CHEST_08, `Report file at ${filePath} does not match report.v1 schema.`);
      }

      if (report.id === id) {
        return ok(report);
      }
    }

    return fail(ERR_CHEST_09, `Report '${id}' not found in ${paths.reportsDir}.`);
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "ENOENT") {
      return fail(ERR_CHEST_03, `reports/ directory not found at ${paths.reportsDir}. Run a validation workflow first.`);
    }

    return fail(ERR_CHEST_09, `Could not read validation reports at ${paths.reportsDir}.`, error);
  }
};
