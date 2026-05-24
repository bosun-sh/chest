import { access, mkdir, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { resolveChestPaths } from "./storage-paths";
import { atomicWriteText } from "../shared/atomic-write";
import { fail, ok, type ToolResult } from "../shared/result";
import { ERR_CHEST_03, ERR_CHEST_10 } from "../shared/error-codes";
import { stringifyYaml } from "../shared/yaml-parse";

export type InitWorkspaceInput = {
  dir?: string;
  force?: boolean;
};

export type InitWorkspaceOutput = {
  created: string[];
  skipped: string[];
};

export const initWorkspace = async (
  input: InitWorkspaceInput = {},
): Promise<ToolResult<InitWorkspaceOutput>> => {
  const root = input.dir?.trim() || process.cwd();
  const paths = resolveChestPaths(root);

  try {
    await access(root, fsConstants.W_OK);
  } catch (error) {
    return fail(ERR_CHEST_03, `Chest store cannot be written at ${root}.`, error);
  }

  try {
    await access(paths.storeDir);
    if (!input.force) {
      return fail(
        ERR_CHEST_10,
        `Chest store already exists at ${paths.storeDir}. Pass force: true to overwrite.`,
      );
    }
  } catch {
    // no existing store
  }

  await mkdir(paths.storeDir, { recursive: true });
  await mkdir(paths.reportsDir, { recursive: true });

  const created = [
    paths.okrsFile,
    paths.kpisFile,
    paths.dorFile,
    paths.dodFile,
  ];

  await Promise.all(created.map((file) => atomicWriteText(file, stringifyYaml([]))));

  return ok({
    created,
    skipped: [],
  });
};

export const readWorkspaceFile = async <T>(filePath: string): Promise<T> => {
  const contents = await readFile(filePath, "utf8");
  return JSON.parse(contents) as T;
};

export const writeWorkspaceFile = async (
  filePath: string,
  value: unknown,
): Promise<void> => {
  await atomicWriteText(filePath, stringifyYaml(value));
};
