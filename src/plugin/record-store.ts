import { mkdir, readFile, readdir } from "node:fs/promises";
import { fail, ok, type ToolResult } from "../shared/result";
import {
  ERR_CHEST_01,
  ERR_CHEST_02,
  ERR_CHEST_03,
  ERR_CHEST_05,
  ERR_CHEST_09,
} from "../shared/error-codes";
import { findById, removeById, upsertById } from "../workspace/yaml-repository";
import { resolveChestPaths } from "../workspace/storage-paths";
import type { ValidationReport } from "../validation/schema";
import { stringifyYaml } from "../shared/yaml-parse";
import { atomicWriteText } from "../shared/atomic-write";

type CollectionName = "okrs" | "kpis" | "dor" | "dod";

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
  fail(ERR_CHEST_03, `Governance file not found: ${path}. Run chest.init to create the governance store.`);

const normalizeUnknownCollection = <T extends { id: string }>(value: unknown, path: string): ToolResult<T[]> => {
  if (!Array.isArray(value)) {
    return fail(ERR_CHEST_02, `Governance file at ${path} must contain a top-level array.`);
  }

  return ok(value as T[]);
};

export const loadCollection = async <T extends { id: string }>(
  root: string,
  collection: CollectionName,
): Promise<ToolResult<T[]>> => {
  const filePath = collectionFile(root, collection);

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeUnknownCollection<T>(parsed, filePath);
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
    return fail(ERR_CHEST_02, `Record with id '${id}' not found.`);
  }

  return ok(record);
};

export const upsertRecord = async <T extends { id: string }>(
  root: string,
  collection: CollectionName,
  record: T,
): Promise<ToolResult<{ op: "inserted" | "updated"; id: string }>> => {
  const loaded = await loadCollection<T>(root, collection);
  if (!loaded.ok) {
    return loaded as ToolResult<{ op: "inserted" | "updated"; id: string }>;
  }

  const index = loaded.data.findIndex((item) => item.id === record.id);
  const next = upsertById(loaded.data, record);
  const saved = await saveCollection(root, collection, next);
  if (!saved.ok) {
    return saved;
  }

  return ok({
    op: index === -1 ? "inserted" : "updated",
    id: record.id,
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
    return fail(ERR_CHEST_02, `Record with id '${id}' not found; nothing removed.`);
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
  const filePath = `${paths.reportsDir}/${report.id}.json`;
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
): Promise<ToolResult<ValidationReport[]>> => {
  const paths = resolveChestPaths(root);
  try {
    const entries = await readdir(paths.reportsDir, { withFileTypes: true });
    const reports: ValidationReport[] = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        continue;
      }

      const filePath = `${paths.reportsDir}/${entry.name}`;
      const raw = await readFile(filePath, "utf8");
      const report = JSON.parse(raw) as ValidationReport;
      if (filter?.workflow && report.workflow !== filter.workflow) {
        continue;
      }
      if (filter?.since && report.timestamp < filter.since) {
        continue;
      }
      reports.push(report);
    }

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
  const filePath = `${paths.reportsDir}/${id}.json`;

  try {
    const raw = await readFile(filePath, "utf8");
    return ok(JSON.parse(raw) as ValidationReport);
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "ENOENT") {
      return fail(ERR_CHEST_09, `Report '${id}' not found.`);
    }

    return fail(ERR_CHEST_03, `reports/ directory not found at ${paths.reportsDir}. Run a validation workflow first.`, error);
  }
};
