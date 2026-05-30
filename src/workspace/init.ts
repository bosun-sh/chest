import { access, mkdir, readFile } from "node:fs/promises";
import { atomicWriteText } from "../shared/atomic-write";
import { ERR_CHEST_03, ERR_CHEST_10 } from "../shared/error-codes";
import { fail, ok, type ToolResult } from "../shared/result";
import { parseYaml, stringifyYaml } from "../shared/yaml-parse";
import { resolveChestPaths } from "./storage-paths";

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

  try {
    await mkdir(root, { recursive: true });
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    return fail(ERR_CHEST_03, `Cannot write to ${paths.storeDir}: ${cause}`, error);
  }

  await mkdir(paths.storeDir, { recursive: true });

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
  return parseYaml<T>(contents);
};

export const writeWorkspaceFile = async (
  filePath: string,
  value: unknown,
): Promise<void> => {
  await atomicWriteText(filePath, stringifyYaml(value));
};
